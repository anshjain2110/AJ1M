import os
import uuid
import hashlib
import secrets
import time
from datetime import datetime, timezone, timedelta
from typing import Optional, List
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Depends, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from motor.motor_asyncio import AsyncIOMotorClient
import jwt
import aiofiles

# Environment
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "thelocaljewel")
JWT_SECRET = os.environ.get("JWT_SECRET", "tlj-secret-key-change-in-production-2024")
UPLOAD_DIR = "/app/backend/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Database
client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

@asynccontextmanager
async def lifespan(app: FastAPI):
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
    allow_origins=["*"],
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
    phone: str
    notes: Optional[str] = None
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
    uploaded = []
    for file in files[:3]:
        ext = os.path.splitext(file.filename)[1] if file.filename else ".png"
        filename = f"{uuid.uuid4().hex}{ext}"
        filepath = os.path.join(UPLOAD_DIR, filename)
        async with aiofiles.open(filepath, "wb") as f:
            content = await file.read()
            if len(content) > 10 * 1024 * 1024:
                continue
            await f.write(content)
        uploaded.append({"filename": filename, "original_name": file.filename, "url": f"/api/uploads/files/{filename}"})
    return {"files": uploaded}

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
    print(f"[OTP] Code for {identifier}: {otp}")
    return {"status": "sent", "message": "OTP sent", "otp_dev": otp}

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
        return {"phone_number": "+1234567890", "whatsapp_link": "https://wa.me/1234567890", "live_chat_enabled": False, "gia_logo_visible": True, "igi_logo_visible": True, "reviews_count": "70+", "customers_count": "100+", "avg_savings": "$5,000"}
    return {"phone_number": doc.get("phone_number", ""), "whatsapp_link": doc.get("whatsapp_link", ""), "live_chat_enabled": doc.get("live_chat_enabled", False), "gia_logo_visible": doc.get("gia_logo_visible", True), "igi_logo_visible": doc.get("igi_logo_visible", True), "reviews_count": doc.get("reviews_count", "70+"), "customers_count": doc.get("customers_count", "100+"), "avg_savings": doc.get("avg_savings", "$5,000")}

# ── Health ───────────────────────────────────────────────────

@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "thelocaljewel-api"}
