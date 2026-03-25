import os
import uuid
import logging

logger = logging.getLogger(__name__)
import hashlib
import secrets
import time
from datetime import datetime, timezone, timedelta
from typing import Optional, List
from contextlib import asynccontextmanager
from dotenv import load_dotenv
load_dotenv("/app/backend/.env")

from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Depends, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, Response
from pydantic import BaseModel, Field
from motor.motor_asyncio import AsyncIOMotorClient
import jwt
import aiofiles

# Twilio for SMS OTP
from twilio.rest import Client as TwilioClient
# SendGrid for email OTP
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail as SGMail

# Environment
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "thelocaljewel")
JWT_SECRET = os.environ.get("JWT_SECRET", "rG9oG5Eul803YO57JCGom4lFp99xXaLvRtbDdQpozd5VDkIWVKnb9quulv4LjawP")
UPLOAD_DIR = "/app/backend/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Twilio config
TWILIO_SID = os.environ.get("TWILIO_ACCOUNT_SID", "")
TWILIO_AUTH = os.environ.get("TWILIO_AUTH_TOKEN", "")
TWILIO_PHONE = os.environ.get("TWILIO_PHONE_NUMBER", "")
twilio_client = TwilioClient(TWILIO_SID, TWILIO_AUTH) if TWILIO_SID and TWILIO_AUTH else None

# SendGrid config
SENDGRID_API_KEY = os.environ.get("SENDGRID_API_KEY", "")
SENDGRID_FROM_EMAIL = os.environ.get("SENDGRID_FROM_EMAIL", "ansh@thelocaljewel.com")
sg_client = SendGridAPIClient(SENDGRID_API_KEY) if SENDGRID_API_KEY else None

# Database
client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize cloud storage
    try:
        from storage import init_storage
        init_storage()
        logger.info("Cloud storage initialized")
    except Exception as e:
        logger.error(f"Cloud storage init failed: {e}")
    # Drop problematic phone index
    try:
        await db.users.drop_index("phone_1")
    except Exception:
        pass
    await db.leads.create_index("lead_id", unique=True)
    await db.leads.create_index("email")
    await db.leads.create_index("created_at")
    await db.wizard_sessions.create_index("lead_id", unique=True)
    await db.users.create_index("email", unique=True, sparse=True)
    try:
        await db.users.create_index("phone", unique=True, partialFilterExpression={"phone": {"$type": "string", "$gt": ""}})
    except Exception:
        pass
    await db.otp_codes.create_index("expires_at", expireAfterSeconds=0)
    await db.events.create_index("event_name")
    await db.events.create_index("server_timestamp")
    await db.quotes.create_index("quote_id", unique=True)
    await db.quotes.create_index("lead_id")
    await db.orders.create_index("order_id", unique=True)
    await db.orders.create_index("lead_id")
    await db.users.update_many({"phone": ""}, {"$unset": {"phone": ""}})
    yield
    client.close()

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.environ.get("CORS_ORIGINS", "https://thelocaljewel.com,https://custom-cuts-hub.preview.emergentagent.com").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/api/uploads/files", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Include admin routes
from admin_routes import router as admin_router
app.include_router(admin_router)

# ── Helpers ──────────────────────────────────────────────────

def serialize_doc(doc):
    if doc is None:
        return None
    doc = dict(doc)
    if "_id" in doc:
        doc["_id"] = str(doc["_id"])
    for key, value in doc.items():
        if isinstance(value, datetime):
            doc[key] = value.isoformat()
        elif isinstance(value, list):
            doc[key] = [serialize_doc(v) if isinstance(v, dict) else (v.isoformat() if isinstance(v, datetime) else v) for v in value]
        elif isinstance(value, dict):
            doc[key] = serialize_doc(value)
    return doc

def create_jwt(user_id: str, email: str = None):
    payload = {
        "user_id": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(days=30),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")

async def get_current_user(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        user = await db.users.find_one({"user_id": payload["user_id"]})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return serialize_doc(user)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ── Models ───────────────────────────────────────────────────

class WizardStartRequest(BaseModel):
    anonymous_id: str
    session_id: str
    attribution: dict = {}

class AutosaveRequest(BaseModel):
    answers: dict = {}
    current_step: str = ""
    frozen_step_total: Optional[int] = None

class LeadSubmitRequest(BaseModel):
    lead_id: str
    first_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    notes: Optional[str] = None
    sms_opt_in: Optional[bool] = False
    answers: dict = {}
    attribution: dict = {}

class OTPRequest(BaseModel):
    identifier: str

class OTPVerify(BaseModel):
    identifier: str
    otp_code: str

class EventRequest(BaseModel):
    event_name: str
    event_data: dict = {}
    anonymous_id: Optional[str] = None
    session_id: Optional[str] = None
    lead_id: Optional[str] = None
    timestamp: Optional[str] = None

# ── API: Wizard ──────────────────────────────────────────────

@app.post("/api/wizard/start")
async def wizard_start(req: WizardStartRequest):
    lead_id = f"lead_{uuid.uuid4().hex[:12]}"
    session_data = {
        "lead_id": lead_id,
        "anonymous_id": req.anonymous_id,
        "session_id": req.session_id,
        "attribution": req.attribution,
        "answers": {},
        "current_step": "screen_1",
        "frozen_step_total": None,
        "started_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    }
    await db.wizard_sessions.insert_one(session_data)
    return {"lead_id": lead_id, "status": "started"}

@app.put("/api/wizard/{lead_id}/autosave")
async def wizard_autosave(lead_id: str, req: AutosaveRequest):
    update = {"$set": {"answers": req.answers, "current_step": req.current_step, "updated_at": datetime.now(timezone.utc)}}
    if req.frozen_step_total is not None:
        update["$set"]["frozen_step_total"] = req.frozen_step_total
    result = await db.wizard_sessions.update_one({"lead_id": lead_id}, update)
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"status": "saved"}

@app.get("/api/wizard/{lead_id}/restore")
async def wizard_restore(lead_id: str):
    session = await db.wizard_sessions.find_one({"lead_id": lead_id})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return serialize_doc(session)

# ── API: File Upload ─────────────────────────────────────────

@app.post("/api/uploads")
async def upload_files(files: List[UploadFile] = File(...)):
    from storage import upload_file as cloud_upload
    uploaded = []
    for file in files[:3]:
        content = await file.read()
        if len(content) > 10 * 1024 * 1024:
            continue
        try:
            result = cloud_upload(
                data=content,
                original_filename=file.filename or "file.png",
                content_type=file.content_type,
                subfolder="uploads",
            )
            uploaded.append({
                "filename": result["filename"],
                "original_name": result["original_name"],
                "storage_path": result["storage_path"],
                "content_type": result["content_type"],
                "url": f"/api/uploads/cloud/{result['storage_path']}",
            })
        except Exception as e:
            logger.error(f"Cloud upload failed for {file.filename}: {e}")
            # Fallback to local storage
            ext = os.path.splitext(file.filename)[1] if file.filename else ".png"
            filename = f"{uuid.uuid4().hex}{ext}"
            filepath = os.path.join(UPLOAD_DIR, filename)
            async with aiofiles.open(filepath, "wb") as f:
                await f.write(content)
            uploaded.append({"filename": filename, "original_name": file.filename, "url": f"/api/uploads/files/{filename}"})
    return {"files": uploaded}

@app.get("/api/uploads/cloud/{path:path}")
async def serve_cloud_file(path: str):
    """Serve a file from cloud storage"""
    from storage import download_file as cloud_download
    try:
        data, content_type = cloud_download(path)
        return Response(content=data, media_type=content_type)
    except Exception as e:
        logger.error(f"Cloud download failed for {path}: {e}")
        raise HTTPException(404, "File not found in cloud storage")

@app.get("/api/uploads/download/{path:path}")
async def download_file(path: str):
    """Force-download a file — tries cloud first, then local disk"""
    from storage import download_file as cloud_download

    # Try cloud storage first
    try:
        data, content_type = cloud_download(path)
        # Look up original name from DB
        lead = await db.leads.find_one(
            {"inspiration_files.storage_path": path},
            {"inspiration_files.$": 1}
        )
        original_name = path.split("/")[-1]
        if lead and lead.get("inspiration_files"):
            original_name = lead["inspiration_files"][0].get("original_name", original_name)
        return Response(
            content=data,
            media_type="application/octet-stream",
            headers={"Content-Disposition": f'attachment; filename="{original_name}"'}
        )
    except Exception:
        pass

    # Fallback to local file (for old uploads)
    filename = path.split("/")[-1] if "/" in path else path
    filepath = os.path.join(UPLOAD_DIR, filename)
    if not os.path.exists(filepath):
        raise HTTPException(404, "File not found")
    lead = await db.leads.find_one(
        {"inspiration_files.filename": filename},
        {"inspiration_files.$": 1}
    )
    original_name = filename
    if lead and lead.get("inspiration_files"):
        original_name = lead["inspiration_files"][0].get("original_name", filename)
    return FileResponse(
        path=filepath,
        filename=original_name,
        media_type="application/octet-stream",
    )


# ── API: Public Showcase Pairs ───────────────────────────────

@app.get("/api/showcase-pairs")
async def get_public_showcase_pairs():
    """Public endpoint — returns active showcase pairs for the landing page."""
    pairs = await db.showcase_pairs.find().sort("order", 1).to_list(50)
    result = []
    for p in pairs:
        result.append({
            "pair_id": p.get("pair_id"),
            "title": p.get("title", ""),
            "render_image": p.get("render_image", {}),
            "product_image": p.get("product_image", {}),
        })
    return {"pairs": result}


# ── API: Lead Submission ─────────────────────────────────────

@app.post("/api/leads/submit")
async def submit_lead(req: LeadSubmitRequest, request: Request):
    phone = req.phone.strip() if req.phone else None
    if phone == "": phone = None
    email_val = req.email.strip() if req.email else None
    if email_val == "": email_val = None

    # Capture IP for geo
    client_ip = request.headers.get("x-forwarded-for", request.client.host if request.client else "").split(",")[0].strip()

    lead = {
        "lead_id": req.lead_id, "first_name": req.first_name, "email": email_val, "phone": phone,
        "notes": req.notes, "product_type": req.answers.get("product_type"),
        "occasion": req.answers.get("occasion"), "deadline": req.answers.get("deadline"),
        "setting_style": req.answers.get("setting_style"),
        "bracelet_wrist_size": req.answers.get("bracelet_wrist_size"),
        "bracelet_metal": req.answers.get("bracelet_metal"),
        "diamond_shape": req.answers.get("diamond_shape"), "carat_range": req.answers.get("carat_range"),
        "priority": req.answers.get("priority"), "metal": req.answers.get("metal"),
        "ring_size_known": req.answers.get("ring_size_known"), "ring_size": req.answers.get("ring_size"),
        "budget": req.answers.get("budget"), "has_inspiration": req.answers.get("has_inspiration"),
        "inspiration_links": req.answers.get("inspiration_links", []),
        "inspiration_files": req.answers.get("inspiration_files", []),
        "sms_opt_in": req.sms_opt_in or False,
        "attribution": {**req.attribution, "ip_address": client_ip},
        "status": "new",
        "internal_notes": [],
        "created_at": datetime.now(timezone.utc), "updated_at": datetime.now(timezone.utc),
    }

    existing = await db.leads.find_one({"lead_id": req.lead_id})
    if existing:
        await db.leads.update_one({"lead_id": req.lead_id}, {"$set": lead})
    else:
        await db.leads.insert_one(lead)

    # Mark wizard session as completed
    await db.wizard_sessions.update_one({"lead_id": req.lead_id}, {"$set": {"completed_at": datetime.now(timezone.utc)}})

    # Auto-create user
    user = None
    if phone:
        user = await db.users.find_one({"phone": phone})
    if not user and email_val:
        user = await db.users.find_one({"email": email_val})

    if not user:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        user_doc = {"user_id": user_id, "first_name": req.first_name, "phone": phone, "created_at": datetime.now(timezone.utc)}
        if email_val: user_doc["email"] = email_val
        try:
            await db.users.insert_one(user_doc)
        except Exception:
            if phone: user = await db.users.find_one({"phone": phone})
            if not user and email_val: user = await db.users.find_one({"email": email_val})
            if user: user_id = user["user_id"]
    else:
        user_id = user["user_id"]
        if email_val and not user.get("email"):
            await db.users.update_one({"user_id": user_id}, {"$set": {"email": email_val}})

    await db.leads.update_one({"lead_id": req.lead_id}, {"$set": {"user_id": user_id}})
    token = create_jwt(user_id, email_val or phone)

    # Send new lead notification email to admin
    if sg_client:
        try:
            product = req.answers.get("product_type", "").replace("_", " ").title()
            budget = req.answers.get("budget", "").replace("_", " ")
            diamond = req.answers.get("diamond_shape", "").replace("_", " ").title()
            carat = req.answers.get("carat_range", "").replace("_", " ")
            notif = SGMail(
                from_email=SENDGRID_FROM_EMAIL,
                to_emails=SENDGRID_FROM_EMAIL,
                subject=f"New Lead: {req.first_name} — {product}",
                html_content=f"""
                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 30px 20px;">
                    <h2 style="color: #0F5E4C; font-size: 20px; margin: 0 0 20px;">New Lead Submitted</h2>
                    <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                        <tr><td style="padding: 8px 0; color: #6B7280; border-bottom: 1px solid #E5E5E3;">Name</td><td style="padding: 8px 0; color: #1A1A1C; font-weight: 600; border-bottom: 1px solid #E5E5E3; text-align: right;">{req.first_name}</td></tr>
                        <tr><td style="padding: 8px 0; color: #6B7280; border-bottom: 1px solid #E5E5E3;">Phone</td><td style="padding: 8px 0; color: #1A1A1C; font-weight: 600; border-bottom: 1px solid #E5E5E3; text-align: right;">{phone or '—'}</td></tr>
                        <tr><td style="padding: 8px 0; color: #6B7280; border-bottom: 1px solid #E5E5E3;">Email</td><td style="padding: 8px 0; color: #1A1A1C; font-weight: 600; border-bottom: 1px solid #E5E5E3; text-align: right;">{email_val or '—'}</td></tr>
                        <tr><td style="padding: 8px 0; color: #6B7280; border-bottom: 1px solid #E5E5E3;">Product</td><td style="padding: 8px 0; color: #1A1A1C; font-weight: 600; border-bottom: 1px solid #E5E5E3; text-align: right;">{product}</td></tr>
                        <tr><td style="padding: 8px 0; color: #6B7280; border-bottom: 1px solid #E5E5E3;">Diamond</td><td style="padding: 8px 0; color: #1A1A1C; font-weight: 600; border-bottom: 1px solid #E5E5E3; text-align: right;">{diamond} {carat}</td></tr>
                        <tr><td style="padding: 8px 0; color: #6B7280;">Budget</td><td style="padding: 8px 0; color: #1A1A1C; font-weight: 600; text-align: right;">{budget}</td></tr>
                    </table>
                    {f'<p style="margin: 16px 0 0; padding: 12px; background: #F5F5F3; border-radius: 8px; font-size: 13px; color: #6B7280;">Note: {req.notes}</p>' if req.notes else ''}
                    <hr style="border: none; border-top: 1px solid #E5E5E3; margin: 20px 0;" />
                    <p style="font-size: 12px; color: #9CA3AF;">Lead ID: {req.lead_id} • The Local Jewel</p>
                </div>
                """,
            )
            sg_client.send(notif)
            print(f"[NOTIF] New lead email sent for {req.first_name}")
        except Exception as e:
            print(f"[NOTIF] Email failed: {e}")

    return {"status": "submitted", "lead_id": req.lead_id, "user_id": user_id, "token": token, "first_name": req.first_name}

# ── API: Auth (OTP) ──────────────────────────────────────────

@app.post("/api/auth/request-otp")
async def request_otp(req: OTPRequest):
    identifier = req.identifier.strip().lower()
    user = await db.users.find_one({"$or": [{"email": identifier}, {"phone": identifier}]})
    if not user:
        raise HTTPException(status_code=404, detail="No account found with this email/phone")
    recent = await db.otp_codes.find_one({"identifier": identifier, "created_at": {"$gte": datetime.now(timezone.utc) - timedelta(seconds=60)}})
    if recent:
        raise HTTPException(status_code=429, detail="Please wait before requesting another OTP")
    otp = f"{secrets.randbelow(1000000):06d}"
    otp_hash = hashlib.sha256(otp.encode()).hexdigest()
    await db.otp_codes.insert_one({"identifier": identifier, "otp_hash": otp_hash, "user_id": user["user_id"], "created_at": datetime.now(timezone.utc), "expires_at": datetime.now(timezone.utc) + timedelta(minutes=10), "used": False})
    
    # Determine if identifier is email or phone
    is_email = "@" in identifier
    delivered = False
    delivery_method = ""
    
    # Try email delivery via SendGrid
    if is_email and sg_client:
        try:
            message = SGMail(
                from_email=SENDGRID_FROM_EMAIL,
                to_emails=identifier,
                subject="Your Local Jewel Verification Code",
                html_content=f"""
                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h2 style="color: #1A1A1C; font-size: 22px; margin: 0;">The Local Jewel</h2>
                    </div>
                    <p style="color: #6B7280; font-size: 16px; line-height: 24px;">Your verification code is:</p>
                    <div style="background: #F5F5F3; border: 1px solid #E5E5E3; border-radius: 12px; padding: 24px; text-align: center; margin: 20px 0;">
                        <span style="font-size: 36px; font-weight: 700; letter-spacing: 0.3em; color: #0F5E4C;">{otp}</span>
                    </div>
                    <p style="color: #6B7280; font-size: 14px; line-height: 20px;">This code expires in 10 minutes. If you didn't request this, you can safely ignore this email.</p>
                    <hr style="border: none; border-top: 1px solid #E5E5E3; margin: 30px 0;" />
                    <p style="color: #9CA3AF; font-size: 12px; text-align: center;">The Local Jewel — Diamond Jewelry, Direct to You</p>
                </div>
                """,
            )
            sg_client.send(message)
            delivered = True
            delivery_method = "email"
            print(f"[OTP] Email sent to {identifier}")
        except Exception as e:
            print(f"[OTP] Email failed: {type(e).__name__}: {e}")
    
    # Try SMS delivery via Twilio (for phone numbers, or as fallback if email has a phone on file)
    if not delivered:
        phone_to_send = user.get("phone") if not is_email else user.get("phone")
        if not phone_to_send and not is_email:
            phone_to_send = identifier
        
        if twilio_client and phone_to_send:
            try:
                phone_normalized = phone_to_send.strip()
                if not phone_normalized.startswith("+"):
                    phone_normalized = "+1" + phone_normalized.replace("-", "").replace(" ", "").replace("(", "").replace(")", "")
                twilio_client.messages.create(
                    body=f"Your Local Jewel verification code is: {otp}",
                    from_=TWILIO_PHONE,
                    to=phone_normalized,
                )
                delivered = True
                delivery_method = "sms"
                print(f"[OTP] SMS sent to {phone_normalized}")
            except Exception as e:
                print(f"[OTP] SMS failed: {e}")
    
    if not delivered:
        print(f"[OTP] Code for {identifier}: {otp} (delivery failed)")
    
    msg = "Verification code sent to your email" if delivery_method == "email" else "Verification code sent to your phone" if delivery_method == "sms" else "Verification code generated"
    return {"status": "sent", "message": msg}

@app.post("/api/auth/verify-otp")
async def verify_otp(req: OTPVerify):
    identifier = req.identifier.strip().lower()
    otp_hash = hashlib.sha256(req.otp_code.encode()).hexdigest()
    otp_record = await db.otp_codes.find_one({"identifier": identifier, "otp_hash": otp_hash, "used": False, "expires_at": {"$gte": datetime.now(timezone.utc)}})
    if not otp_record:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")
    await db.otp_codes.update_one({"_id": otp_record["_id"]}, {"$set": {"used": True}})
    user = await db.users.find_one({"user_id": otp_record["user_id"]})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    token = create_jwt(user["user_id"], user.get("email"))
    return {"status": "verified", "token": token, "user": serialize_doc(user)}

# ── API: Dashboard ───────────────────────────────────────────

@app.get("/api/me")
async def get_me(user=Depends(get_current_user)):
    return {"user": user}

@app.get("/api/me/leads")
async def get_my_leads(user=Depends(get_current_user)):
    leads = [serialize_doc(l) async for l in db.leads.find({"user_id": user["user_id"]}).sort("created_at", -1)]
    return {"leads": leads}

@app.get("/api/me/leads/{lead_id}")
async def get_my_lead_detail(lead_id: str, user=Depends(get_current_user)):
    lead = await db.leads.find_one({"lead_id": lead_id, "user_id": user["user_id"]})
    if not lead:
        raise HTTPException(404, "Lead not found")
    quotes = [serialize_doc(q) async for q in db.quotes.find({"lead_id": lead_id}).sort("created_at", -1)]
    orders = [serialize_doc(o) async for o in db.orders.find({"lead_id": lead_id}).sort("created_at", -1)]
    return {"lead": serialize_doc(lead), "quotes": quotes, "orders": orders}

class CommentCreate(BaseModel):
    text: str

@app.post("/api/me/leads/{lead_id}/comments")
async def add_customer_comment(lead_id: str, req: CommentCreate, user=Depends(get_current_user)):
    lead = await db.leads.find_one({"lead_id": lead_id, "user_id": user["user_id"]})
    if not lead:
        raise HTTPException(404, "Lead not found")
    comment = {"text": req.text, "author": user.get("first_name", "Customer"), "role": "customer", "created_at": datetime.now(timezone.utc)}
    await db.leads.update_one({"lead_id": lead_id}, {"$push": {"comments": comment}})
    return {"status": "added", "comment": serialize_doc(comment)}

@app.get("/api/me/orders")
async def get_my_orders(user=Depends(get_current_user)):
    orders = [serialize_doc(o) async for o in db.orders.find({"user_id": user["user_id"]}).sort("created_at", -1)]
    return {"orders": orders}

# ── API: Events ──────────────────────────────────────────────

@app.post("/api/events")
async def log_event(req: EventRequest):
    event = {"event_name": req.event_name, "event_data": req.event_data, "anonymous_id": req.anonymous_id, "session_id": req.session_id, "lead_id": req.lead_id, "timestamp": req.timestamp or datetime.now(timezone.utc).isoformat(), "server_timestamp": datetime.now(timezone.utc)}
    await db.events.insert_one(event)
    return {"status": "logged"}

# ── API: Public Settings ─────────────────────────────────────

@app.get("/api/settings/public")
async def public_settings():
    doc = await db.settings.find_one({"_type": "site_settings"})
    if not doc:
        return {"phone_number": "+15857108292", "whatsapp_link": "https://wa.me/15857108292", "live_chat_enabled": False, "gia_logo_visible": True, "igi_logo_visible": True, "reviews_count": "70+", "customers_count": "100+", "avg_savings": "$5,000"}
    return {"phone_number": doc.get("phone_number", ""), "whatsapp_link": doc.get("whatsapp_link", ""), "live_chat_enabled": doc.get("live_chat_enabled", False), "gia_logo_visible": doc.get("gia_logo_visible", True), "igi_logo_visible": doc.get("igi_logo_visible", True), "reviews_count": doc.get("reviews_count", "70+"), "customers_count": doc.get("customers_count", "100+"), "avg_savings": doc.get("avg_savings", "$5,000")}

@app.get("/api/abtest/config")
async def get_abtest_config():
    doc = await db.settings.find_one({"_type": "abtest_settings"})
    if not doc:
        return {"lead_capture_mode": "auto", "variant_a_weight": 50}
    return {"lead_capture_mode": doc.get("lead_capture_mode", "auto"), "variant_a_weight": doc.get("variant_a_weight", 50)}

# ── Health ───────────────────────────────────────────────────

@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "thelocaljewel-api"}
