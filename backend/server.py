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
    await db.events.create_index("session_id")
    await db.events.create_index("anonymous_id")
    await db.events.create_index([("event_name", 1), ("server_timestamp", -1)])
    await db.events.create_index("geo.country")
    await db.events.create_index("ua_parsed.device")
    await db.events.create_index("wizard_step")
    await db.events.create_index("lead_id")
    await db.leads.create_index("lead_score")
    await db.leads.create_index("intent_bucket")
    await db.quotes.create_index("quote_id", unique=True)
    await db.quotes.create_index("lead_id")
    await db.orders.create_index("order_id", unique=True)
    await db.orders.create_index("lead_id")
    # Projects (Past Custom Work CMS)
    try:
        await db.projects.create_index("slug", unique=True)
    except Exception:
        pass
    await db.projects.create_index("published")
    await db.projects.create_index("tags")
    await db.projects.create_index([("published", 1), ("featured", -1), ("position", 1)])
    # Blog posts
    try:
        await db.blog_posts.create_index("slug", unique=True)
    except Exception:
        pass
    await db.blog_posts.create_index("published")
    await db.blog_posts.create_index([("published", 1), ("featured", -1), ("position", 1), ("published_at", -1)])
    # Message threads (marketplace inquiries)
    await db.message_threads.create_index("user_id")
    await db.message_threads.create_index("project_slug")
    await db.message_threads.create_index([("updated_at", -1)])
    await db.users.update_many({"phone": ""}, {"$unset": {"phone": ""}})
    # Refresh static sitemap on every startup so production deploys always have fresh URLs
    try:
        await regenerate_static_sitemap()
    except Exception as e:
        logger.error(f"sitemap regen on startup failed: {e}")
    yield
    client.close()

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.environ.get("CORS_ORIGINS", "https://thelocaljewel.com,https://custom-jewelry-gen.preview.emergentagent.com").split(","),
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
    # Allow up to 8 files per call (admin journey/gallery batches). Per-file size cap below.
    for file in files[:8]:
        content = await file.read()
        # 100 MB cap — fits short product videos (HEIC, MP4, MOV)
        if len(content) > 100 * 1024 * 1024:
            continue
        try:
            result = cloud_upload(
                data=content,
                original_filename=file.filename or "file.png",
                content_type=file.content_type,
                subfolder="uploads",
            )
            ct = (result.get("content_type") or "").lower()
            if ct.startswith("audio/"):
                mtype = "audio"
            elif ct.startswith("video/"):
                mtype = "video"
            else:
                mtype = "image"
            uploaded.append({
                "filename": result["filename"],
                "original_name": result["original_name"],
                "storage_path": result["storage_path"],
                "content_type": result["content_type"],
                "media_type": mtype,
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
            ct = (file.content_type or "").lower()
            if ct.startswith("audio/"):
                mtype = "audio"
            elif ct.startswith("video/"):
                mtype = "video"
            else:
                mtype = "image"
            uploaded.append({
                "filename": filename,
                "original_name": file.filename,
                "media_type": mtype,
                "url": f"/api/uploads/files/{filename}",
            })
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


# ── API: Public Projects (SEO/Past Work) ─────────────────────

def _project_strip_internal(doc: dict) -> dict:
    if not doc:
        return None
    out = {k: v for k, v in doc.items() if k != "_id"}
    for k, v in out.items():
        if isinstance(v, datetime):
            out[k] = v.isoformat()
    return out

@app.get("/api/projects")
async def get_public_projects(
    tag: Optional[str] = None,
    featured: Optional[bool] = None,
    limit: int = 50,
    exclude_slug: Optional[str] = None,
):
    """Public list of published projects. Optionally filter by tag / featured."""
    query = {"published": True}
    if tag:
        query["tags"] = tag
    if featured is True:
        query["featured"] = True
    if exclude_slug:
        query["slug"] = {"$ne": exclude_slug}
    cursor = db.projects.find(query, {"_id": 0}).sort([("featured", -1), ("position", 1), ("created_at", -1)]).limit(min(limit, 100))
    items = [_project_strip_internal(doc) async for doc in cursor]
    # Collect distinct tags for filter chips
    tag_pipeline = [
        {"$match": {"published": True}},
        {"$unwind": "$tags"},
        {"$group": {"_id": "$tags", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
    ]
    tag_docs = await db.projects.aggregate(tag_pipeline).to_list(50)
    tags = [{"tag": t["_id"], "count": t["count"]} for t in tag_docs if t["_id"]]
    return {"projects": items, "tags": tags, "total": len(items)}

@app.get("/api/projects/{slug}")
async def get_public_project_by_slug(slug: str):
    doc = await db.projects.find_one({"slug": slug, "published": True}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Project not found")
    return _project_strip_internal(doc)


# ── API: Public Blog ─────────────────────────────────────────

@app.get("/api/blog")
async def get_public_blog(
    category: Optional[str] = None,
    featured: Optional[bool] = None,
    limit: int = 30,
):
    query = {"published": True}
    if category:
        query["category"] = category
    if featured is True:
        query["featured"] = True
    cursor = db.blog_posts.find(query, {"_id": 0, "content_html": 0}).sort(
        [("featured", -1), ("published_at", -1), ("created_at", -1)]
    ).limit(min(limit, 100))
    items = [_project_strip_internal(doc) async for doc in cursor]
    # Distinct categories
    cat_pipeline = [
        {"$match": {"published": True, "category": {"$ne": ""}}},
        {"$group": {"_id": "$category", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
    ]
    cats = [{"category": c["_id"], "count": c["count"]} async for c in db.blog_posts.aggregate(cat_pipeline) if c.get("_id")]
    return {"posts": items, "categories": cats, "total": len(items)}

@app.get("/api/blog/{slug}")
async def get_public_blog_by_slug(slug: str):
    doc = await db.blog_posts.find_one({"slug": slug, "published": True}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Post not found")
    return _project_strip_internal(doc)


# ── API: Contact form ────────────────────────────────────────

class ContactRequest(BaseModel):
    name: str
    email: str
    phone: Optional[str] = ""
    subject: Optional[str] = ""
    message: str

@app.post("/api/contact")
async def submit_contact(req: ContactRequest, request: Request):
    name = req.name.strip()
    email_val = req.email.strip().lower()
    msg = req.message.strip()
    if not name or not email_val or not msg:
        raise HTTPException(400, "Name, email, and message are required")
    client_ip = request.headers.get("x-forwarded-for", request.client.host if request.client else "").split(",")[0].strip()
    now = datetime.now(timezone.utc)
    doc = {
        "submission_id": f"contact_{uuid.uuid4().hex[:12]}",
        "name": name,
        "email": email_val,
        "phone": req.phone.strip() if req.phone else "",
        "subject": req.subject.strip() if req.subject else "",
        "message": msg,
        "ip_address": client_ip,
        "created_at": now,
    }
    await db.contact_submissions.insert_one(doc)
    if sg_client:
        try:
            notif = SGMail(
                from_email=SENDGRID_FROM_EMAIL,
                to_emails=SENDGRID_FROM_EMAIL,
                subject=f"Contact form: {name}" + (f" — {req.subject}" if req.subject else ""),
                html_content=f"""
                <div style='font-family:-apple-system,sans-serif;max-width:520px;margin:0 auto;padding:28px 20px;'>
                    <h2 style='color:#0F5E4C;font-size:20px;margin:0 0 14px;'>New Contact Submission</h2>
                    <table style='width:100%;font-size:14px;border-collapse:collapse;'>
                        <tr><td style='padding:6px 0;color:#6B7280;'>Name</td><td style='padding:6px 0;text-align:right;'><strong>{name}</strong></td></tr>
                        <tr><td style='padding:6px 0;color:#6B7280;'>Email</td><td style='padding:6px 0;text-align:right;'>{email_val}</td></tr>
                        <tr><td style='padding:6px 0;color:#6B7280;'>Phone</td><td style='padding:6px 0;text-align:right;'>{req.phone or '—'}</td></tr>
                        {f"<tr><td style='padding:6px 0;color:#6B7280;'>Subject</td><td style='padding:6px 0;text-align:right;'>{req.subject}</td></tr>" if req.subject else ''}
                    </table>
                    <div style='margin-top:14px;padding:14px 16px;background:#F5F5F3;border-radius:10px;color:#1A1A1C;font-size:14px;line-height:1.5;'>{msg}</div>
                </div>
                """,
            )
            sg_client.send(notif)
        except Exception as e:
            logger.warning(f"contact notify failed: {e}")
    return {"status": "received", "submission_id": doc["submission_id"]}


# ── API: Marketplace inquiries (project chat threads) ────────

class ProjectInquireRequest(BaseModel):
    name: str
    email: str
    phone: str
    message: str

@app.post("/api/projects/{slug}/inquire")
async def project_inquire(slug: str, req: ProjectInquireRequest, request: Request):
    """Marketplace-style "Hi, is this available?" submission on a project page."""
    name = req.name.strip()
    email_val = req.email.strip().lower()
    phone = req.phone.strip()
    message = req.message.strip()
    if not (name and email_val and phone and message):
        raise HTTPException(400, "Name, email, phone, and message are required")

    project = await db.projects.find_one({"slug": slug, "published": True}, {"_id": 0, "title": 1, "hero_image_url": 1, "slug": 1, "price": 1})
    if not project:
        raise HTTPException(404, "Project not found")

    client_ip = request.headers.get("x-forwarded-for", request.client.host if request.client else "").split(",")[0].strip()

    user = await db.users.find_one({"email": email_val}) or await db.users.find_one({"phone": phone})
    if user:
        user_id = user["user_id"]
        upd = {}
        if not user.get("first_name") and name: upd["first_name"] = name
        if not user.get("phone") and phone: upd["phone"] = phone
        if not user.get("email") and email_val: upd["email"] = email_val
        if upd:
            await db.users.update_one({"user_id": user_id}, {"$set": upd})
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        try:
            await db.users.insert_one({
                "user_id": user_id, "first_name": name, "email": email_val, "phone": phone,
                "created_at": datetime.now(timezone.utc),
            })
        except Exception:
            existing = await db.users.find_one({"email": email_val})
            user_id = existing["user_id"] if existing else user_id

    now = datetime.now(timezone.utc)
    thread_id = f"thr_{uuid.uuid4().hex[:12]}"
    first_msg = {"sender": "user", "text": message, "author_name": name, "created_at": now}
    thread_doc = {
        "thread_id": thread_id,
        "user_id": user_id,
        "user_name": name,
        "user_email": email_val,
        "user_phone": phone,
        "project_slug": project.get("slug"),
        "project_title": project.get("title", ""),
        "project_hero": project.get("hero_image_url", ""),
        "messages": [first_msg],
        "status": "active",
        "admin_unread_count": 1,
        "user_unread_count": 0,
        "attribution": {"ip_address": client_ip, "source": "project_inquiry"},
        "created_at": now,
        "updated_at": now,
    }
    await db.message_threads.insert_one(thread_doc)

    lead_id = f"lead_{uuid.uuid4().hex[:12]}"
    try:
        await db.leads.insert_one({
            "lead_id": lead_id,
            "user_id": user_id,
            "first_name": name,
            "email": email_val,
            "phone": phone,
            "product_type": "engagement_ring",
            "source": "project_inquiry",
            "answers": {},
            "inspiration_links": [f"https://thelocaljewel.com/projects/{slug}"],
            "inspiration_notes": message,
            "attribution": {"ip_address": client_ip, "source": "project_inquiry", "project_slug": slug, "thread_id": thread_id},
            "status": "new",
            "comments": [],
            "internal_notes": [],
            "score": 40,
            "quality_flags": ["project_inquiry"],
            "created_at": now,
            "updated_at": now,
        })
    except Exception as e:
        logger.warning(f"inquiry lead insert failed: {e}")

    token = create_jwt(user_id, email_val)

    if sg_client:
        try:
            notif = SGMail(
                from_email=SENDGRID_FROM_EMAIL,
                to_emails=SENDGRID_FROM_EMAIL,
                subject=f"New project inquiry: {project.get('title', slug)}",
                html_content=f"""
                <div style='font-family:-apple-system,sans-serif;max-width:520px;margin:0 auto;padding:28px 20px;'>
                    <h2 style='color:#0F5E4C;font-size:20px;margin:0 0 12px;'>New message about a project</h2>
                    <p style='font-size:14px;color:#374151;margin:0 0 14px;'>Re: <strong>{project.get('title','')}</strong></p>
                    <table style='width:100%;font-size:14px;border-collapse:collapse;'>
                        <tr><td style='padding:6px 0;color:#6B7280;'>From</td><td style='padding:6px 0;text-align:right;'><strong>{name}</strong></td></tr>
                        <tr><td style='padding:6px 0;color:#6B7280;'>Email</td><td style='padding:6px 0;text-align:right;'>{email_val}</td></tr>
                        <tr><td style='padding:6px 0;color:#6B7280;'>Phone</td><td style='padding:6px 0;text-align:right;'>{phone}</td></tr>
                    </table>
                    <div style='margin-top:14px;padding:14px 16px;background:#F5F5F3;border-radius:10px;color:#1A1A1C;font-size:14px;line-height:1.5;'>{message}</div>
                    <p style='font-size:13px;color:#6B7280;margin-top:18px;'>Reply from the <a href='https://thelocaljewel.com/admin/messages' style='color:#0F5E4C;'>Messages tab in admin</a>.</p>
                </div>
                """,
            )
            sg_client.send(notif)
        except Exception as e:
            logger.warning(f"inquiry notify failed: {e}")

    return {"status": "sent", "thread_id": thread_id, "lead_id": lead_id, "user_id": user_id, "token": token}


@app.get("/api/me/threads")
async def get_my_threads(user=Depends(get_current_user)):
    cursor = db.message_threads.find({"user_id": user["user_id"]}, {"_id": 0}).sort("updated_at", -1)
    threads = []
    async for t in cursor:
        out = dict(t)
        for k, v in list(out.items()):
            if isinstance(v, datetime): out[k] = v.isoformat()
        out["messages"] = [
            {kk: (vv.isoformat() if isinstance(vv, datetime) else vv) for kk, vv in (m if isinstance(m, dict) else {}).items()}
            for m in (out.get("messages") or [])
        ]
        threads.append(out)
    return {"threads": threads}

@app.get("/api/me/threads/{thread_id}")
async def get_my_thread(thread_id: str, user=Depends(get_current_user)):
    doc = await db.message_threads.find_one({"thread_id": thread_id, "user_id": user["user_id"]}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Thread not found")
    await db.message_threads.update_one(
        {"thread_id": thread_id},
        {"$set": {"user_unread_count": 0, "user_last_read_at": datetime.now(timezone.utc)}}
    )
    doc["user_unread_count"] = 0
    out = dict(doc)
    for k, v in list(out.items()):
        if isinstance(v, datetime): out[k] = v.isoformat()
    out["messages"] = [
        {kk: (vv.isoformat() if isinstance(vv, datetime) else vv) for kk, vv in (m if isinstance(m, dict) else {}).items()}
        for m in (out.get("messages") or [])
    ]
    return out

class UserThreadReply(BaseModel):
    text: str

@app.post("/api/me/threads/{thread_id}/reply")
async def reply_my_thread(thread_id: str, req: UserThreadReply, user=Depends(get_current_user)):
    text = req.text.strip()
    if not text:
        raise HTTPException(400, "Message is empty")
    thread = await db.message_threads.find_one({"thread_id": thread_id, "user_id": user["user_id"]})
    if not thread:
        raise HTTPException(404, "Thread not found")
    now = datetime.now(timezone.utc)
    msg = {"sender": "user", "text": text, "author_name": user.get("first_name", "Customer"), "created_at": now}
    await db.message_threads.update_one(
        {"thread_id": thread_id},
        {
            "$push": {"messages": msg},
            "$inc": {"admin_unread_count": 1},
            "$set": {"updated_at": now, "status": "active"},
        }
    )
    return {"status": "sent", "message": {**msg, "created_at": now.isoformat()}}


# ── Public Projects API (key-gated, for automation/n8n/scripts) ─────────

async def _require_projects_api_key(x_api_key: Optional[str] = Header(None, alias="X-API-Key")):
    """Auth dependency for the projects automation API.
    Checks the rotated key in the `settings` collection first (admin-managed),
    then falls back to the PROJECTS_API_KEY env var for initial bootstrap.
    """
    if not x_api_key:
        raise HTTPException(401, "Invalid or missing X-API-Key header")
    # DB-stored key (preferred — set/rotated from admin panel)
    doc = await db.settings.find_one({"key": "projects_api_key"}, {"_id": 0, "value": 1})
    if doc and doc.get("value") and x_api_key == doc.get("value"):
        return True
    # Env-var fallback (bootstrap for first-time use)
    env_key = os.environ.get("PROJECTS_API_KEY", "")
    if env_key and x_api_key == env_key:
        return True
    raise HTTPException(401, "Invalid or missing X-API-Key header")

async def _upload_to_r2(file: UploadFile, subfolder: str = "projects") -> str:
    """Upload a single UploadFile to R2, return the public URL."""
    from storage import upload_file as cloud_upload
    content = await file.read()
    if len(content) > 15 * 1024 * 1024:
        raise HTTPException(400, f"File '{file.filename}' exceeds 15 MB limit")
    result = cloud_upload(
        data=content,
        original_filename=file.filename or "image.png",
        content_type=file.content_type,
        subfolder=subfolder,
    )
    return f"/api/uploads/cloud/{result['storage_path']}"

def _slugify(s: str) -> str:
    import re
    s = (s or "").lower().strip()
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return s.strip("-")

@app.post("/api/projects/api/create", status_code=201)
async def projects_api_create(
    payload: str = Form(..., description="JSON string with project metadata"),
    hero: Optional[UploadFile] = File(None),
    gallery: List[UploadFile] = File([]),
    renders: List[UploadFile] = File([]),
    _auth: bool = Depends(_require_projects_api_key),
):
    """
    Create a project via API (for automation/n8n/scripts). Multipart form:
      - payload (form field, JSON): {slug?, title, subtitle?, description?, specs?, journey?, customer_story?, tags?, meta_title?, meta_description?, published?, featured?, position?}
      - hero (file, optional): single hero image
      - gallery (files, optional): multiple FINAL photos
      - renders (files, optional): multiple 3D-RENDER photos

    Auth: X-API-Key header.
    """
    import json
    try:
        data = json.loads(payload)
    except Exception:
        raise HTTPException(400, "payload must be valid JSON")

    title = (data.get("title") or "").strip()
    if not title:
        raise HTTPException(400, "title is required in payload")
    slug = _slugify(data.get("slug") or title)
    if not slug:
        raise HTTPException(400, "slug could not be derived; provide a valid slug or title")

    # Ensure unique slug
    if await db.projects.find_one({"slug": slug}):
        raise HTTPException(400, f"A project with slug '{slug}' already exists")

    # Upload media
    hero_url = ""
    if hero and hero.filename:
        hero_url = await _upload_to_r2(hero)

    gallery_items = []
    final_captions = data.get("gallery_captions") or []
    render_captions = data.get("render_captions") or []
    for i, f in enumerate(gallery or []):
        if not f or not f.filename:
            continue
        url = await _upload_to_r2(f)
        cap = final_captions[i] if i < len(final_captions) else ""
        gallery_items.append({"url": url, "caption": cap, "type": "final"})
    for i, f in enumerate(renders or []):
        if not f or not f.filename:
            continue
        url = await _upload_to_r2(f)
        cap = render_captions[i] if i < len(render_captions) else ""
        gallery_items.append({"url": url, "caption": cap, "type": "render"})

    now = datetime.now(timezone.utc)
    doc = {
        "project_id": f"proj_{uuid.uuid4().hex[:12]}",
        "slug": slug,
        "title": title,
        "subtitle": data.get("subtitle", ""),
        "hero_image_url": hero_url,
        "gallery": gallery_items,
        "specs": data.get("specs") or {},
        "journey": data.get("journey") or [],
        "customer_story": data.get("customer_story") or None,
        "tags": data.get("tags") or [],
        "description": data.get("description", ""),
        "meta_title": data.get("meta_title", ""),
        "meta_description": data.get("meta_description", ""),
        "published": bool(data.get("published", True)),
        "featured": bool(data.get("featured", False)),
        "position": int(data.get("position", 0)),
        "created_at": now,
        "updated_at": now,
    }
    await db.projects.insert_one(doc)
    return _project_strip_internal({k: v for k, v in doc.items() if k != "_id"})


@app.put("/api/projects/api/{slug}")
async def projects_api_update(
    slug: str,
    payload: str = Form("{}"),
    hero: Optional[UploadFile] = File(None),
    gallery: List[UploadFile] = File([]),
    renders: List[UploadFile] = File([]),
    replace_gallery: bool = Form(False, description="If true, replace existing gallery; otherwise append"),
    _auth: bool = Depends(_require_projects_api_key),
):
    """Partial update of a project by slug. Same shape as /create — all payload fields optional. Files (if provided) get uploaded to R2."""
    import json
    existing = await db.projects.find_one({"slug": slug})
    if not existing:
        raise HTTPException(404, "Project not found")
    try:
        data = json.loads(payload) if payload else {}
    except Exception:
        raise HTTPException(400, "payload must be valid JSON")

    update = {}
    for k in ["title", "subtitle", "description", "meta_title", "meta_description", "tags", "specs", "journey", "customer_story", "published", "featured", "position"]:
        if k in data:
            update[k] = data[k]
    if "slug" in data and data["slug"]:
        new_slug = _slugify(data["slug"])
        if new_slug != slug:
            clash = await db.projects.find_one({"slug": new_slug})
            if clash:
                raise HTTPException(400, f"slug '{new_slug}' already exists")
            update["slug"] = new_slug

    if hero and hero.filename:
        update["hero_image_url"] = await _upload_to_r2(hero)

    new_gallery_items = []
    final_captions = data.get("gallery_captions") or []
    render_captions = data.get("render_captions") or []
    for i, f in enumerate(gallery or []):
        if not f or not f.filename:
            continue
        url = await _upload_to_r2(f)
        cap = final_captions[i] if i < len(final_captions) else ""
        new_gallery_items.append({"url": url, "caption": cap, "type": "final"})
    for i, f in enumerate(renders or []):
        if not f or not f.filename:
            continue
        url = await _upload_to_r2(f)
        cap = render_captions[i] if i < len(render_captions) else ""
        new_gallery_items.append({"url": url, "caption": cap, "type": "render"})
    if new_gallery_items:
        update["gallery"] = new_gallery_items if replace_gallery else (existing.get("gallery") or []) + new_gallery_items
    elif replace_gallery:
        update["gallery"] = []

    if not update:
        raise HTTPException(400, "No fields or files provided to update")

    update["updated_at"] = datetime.now(timezone.utc)
    target_slug = update.get("slug", slug)
    await db.projects.update_one({"slug": slug}, {"$set": update})
    doc = await db.projects.find_one({"slug": target_slug}, {"_id": 0})
    return _project_strip_internal(doc)


@app.delete("/api/projects/api/{slug}")
async def projects_api_delete(slug: str, _auth: bool = Depends(_require_projects_api_key)):
    result = await db.projects.delete_one({"slug": slug})
    if result.deleted_count == 0:
        raise HTTPException(404, "Project not found")
    return {"status": "deleted", "slug": slug}


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
        "inspiration_notes": req.answers.get("inspiration_notes", ""),
        "sms_opt_in": req.sms_opt_in or False,
        "attribution": {**req.attribution, "ip_address": client_ip},
        "status": "new",
        "internal_notes": [],
        "created_at": datetime.now(timezone.utc), "updated_at": datetime.now(timezone.utc),
    }

    # Lead scoring v1
    score = 30  # base score for submitting
    quality_flags = []
    if req.answers.get("product_type") in ("engagement_ring", "wedding_bands"):
        score += 15; quality_flags.append("high_value_product")
    if req.answers.get("carat_range") in ("2.0_2.9", "3.0_plus"):
        score += 10; quality_flags.append("large_carat")
    if req.answers.get("priority") in ("biggest_look", "best_sparkle"):
        score += 5
    if req.answers.get("has_inspiration") == "yes":
        score += 10; quality_flags.append("has_inspiration")
    if phone:
        score += 10; quality_flags.append("has_phone")
    if email_val:
        score += 5; quality_flags.append("has_email")
    if req.sms_opt_in:
        score += 5; quality_flags.append("sms_opt_in")
    # Check for returning visitor
    prev_events = await db.events.count_documents({"anonymous_id": req.attribution.get("anonymous_id", ""), "event_name": "tlj_session_start"})
    if prev_events > 1:
        score += 10; quality_flags.append("returning_visitor")
    score = min(score, 100)
    intent_bucket = "high" if score >= 70 else ("medium" if score >= 45 else "low")
    
    lead["lead_score"] = score
    lead["intent_bucket"] = intent_bucket
    lead["quality_flags"] = quality_flags

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


# ── API: Quick-Quote (friction-reduced single submit) ────────

class QuickQuoteRequest(BaseModel):
    name: str
    email: str
    phone: str
    metal_preference: str = ""
    carat_range: str = ""
    inspiration_link: str = ""
    inspiration_files: list = []
    inspiration_notes: str = ""
    inspiration_voice: Optional[dict] = None

@app.post("/api/leads/quick")
async def submit_quick_quote(req: QuickQuoteRequest, request: Request):
    """One-step lead capture from the homepage hero. Creates a user + lead from name / email / phone +
    any inspiration the customer shared (link, files, or free-text). Defaults product_type to
    engagement_ring since that's our wedge product. Returns a JWT so the customer lands authenticated."""
    name = req.name.strip()
    email_val = req.email.strip().lower() or None
    phone = req.phone.strip() or None
    if not name:
        raise HTTPException(400, "Name is required")
    if not email_val:
        raise HTTPException(400, "Email is required")
    if not phone:
        raise HTTPException(400, "Phone is required")

    client_ip = request.headers.get("x-forwarded-for", request.client.host if request.client else "").split(",")[0].strip()

    # Get or create user
    user = await db.users.find_one({"email": email_val})
    if not user and phone:
        user = await db.users.find_one({"phone": phone})
    if user:
        user_id = user["user_id"]
        update_fields = {}
        if not user.get("first_name") and name: update_fields["first_name"] = name
        if not user.get("phone") and phone: update_fields["phone"] = phone
        if not user.get("email") and email_val: update_fields["email"] = email_val
        if update_fields:
            await db.users.update_one({"user_id": user_id}, {"$set": update_fields})
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        try:
            await db.users.insert_one({
                "user_id": user_id, "first_name": name, "email": email_val, "phone": phone,
                "created_at": datetime.now(timezone.utc),
            })
        except Exception:
            existing = await db.users.find_one({"email": email_val})
            user_id = existing["user_id"] if existing else user_id

    # Create lead
    lead_id = f"lead_{uuid.uuid4().hex[:12]}"
    inspiration_links = [req.inspiration_link] if req.inspiration_link else []
    lead_doc = {
        "lead_id": lead_id,
        "user_id": user_id,
        "first_name": name,
        "email": email_val,
        "phone": phone,
        "product_type": "engagement_ring",
        "source": "quick_quote_hero",
        "answers": {
            "metal": req.metal_preference or None,
            "carat_range": req.carat_range or None,
        },
        "metal_preference": req.metal_preference or "",
        "carat_range": req.carat_range or "",
        "inspiration_links": inspiration_links,
        "inspiration_files": req.inspiration_files or [],
        "inspiration_notes": req.inspiration_notes or "",
        "inspiration_voice": req.inspiration_voice or None,
        "attribution": {"ip_address": client_ip, "source": "homepage_quick_quote"},
        "status": "new",
        "comments": [],
        "internal_notes": [],
        "score": 35,
        "quality_flags": ["quick_quote"],
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    }
    await db.leads.insert_one(lead_doc)

    token = create_jwt(user_id, email_val)

    # Admin notification email
    if sg_client:
        try:
            has_link = "Yes" if req.inspiration_link else "No"
            has_files = f"{len(req.inspiration_files)} file(s)" if req.inspiration_files else "None"
            has_notes = "Yes" if req.inspiration_notes else "No"
            has_voice = "Yes (see lead detail)" if req.inspiration_voice else "No"
            notif = SGMail(
                from_email=SENDGRID_FROM_EMAIL,
                to_emails=SENDGRID_FROM_EMAIL,
                subject=f"Quick Quote Request: {name}",
                html_content=f"""
                <div style="font-family: -apple-system, sans-serif; max-width: 520px; margin: 0 auto; padding: 30px 20px;">
                    <h2 style="color: #0F5E4C; font-size: 20px; margin: 0 0 20px;">New Quick-Quote Lead</h2>
                    <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                        <tr><td style="padding: 8px 0; color: #6B7280; border-bottom: 1px solid #E5E5E3;">Name</td><td style="padding: 8px 0; color: #1A1A1C; font-weight: 600; border-bottom: 1px solid #E5E5E3; text-align: right;">{name}</td></tr>
                        <tr><td style="padding: 8px 0; color: #6B7280; border-bottom: 1px solid #E5E5E3;">Email</td><td style="padding: 8px 0; color: #1A1A1C; font-weight: 600; border-bottom: 1px solid #E5E5E3; text-align: right;">{email_val}</td></tr>
                        <tr><td style="padding: 8px 0; color: #6B7280; border-bottom: 1px solid #E5E5E3;">Phone</td><td style="padding: 8px 0; color: #1A1A1C; font-weight: 600; border-bottom: 1px solid #E5E5E3; text-align: right;">{phone}</td></tr>
                        <tr><td style="padding: 8px 0; color: #6B7280; border-bottom: 1px solid #E5E5E3;">Link shared</td><td style="padding: 8px 0; text-align: right;">{has_link}</td></tr>
                        <tr><td style="padding: 8px 0; color: #6B7280; border-bottom: 1px solid #E5E5E3;">Files shared</td><td style="padding: 8px 0; text-align: right;">{has_files}</td></tr>
                        <tr><td style="padding: 8px 0; color: #6B7280; border-bottom: 1px solid #E5E5E3;">Voice note</td><td style="padding: 8px 0; text-align: right;">{has_voice}</td></tr>
                        <tr><td style="padding: 8px 0; color: #6B7280;">Notes</td><td style="padding: 8px 0; text-align: right;">{has_notes}</td></tr>
                    </table>
                    {f'<div style="margin: 14px 0; padding: 12px; background: #F5F5F3; border-radius: 8px; font-size: 13px; color: #374151;"><strong>Customer notes:</strong><br/>{req.inspiration_notes}</div>' if req.inspiration_notes else ''}
                    <p style="font-size: 12px; color: #9CA3AF; margin-top: 18px;">Lead ID: {lead_id} • Source: Homepage Quick Quote</p>
                </div>
                """,
            )
            sg_client.send(notif)
        except Exception as e:
            print(f"[QUICK-QUOTE NOTIF] {e}")

    return {"status": "submitted", "lead_id": lead_id, "user_id": user_id, "token": token, "first_name": name}


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

@app.post("/api/me/leads/{lead_id}/approve")
async def customer_approve_design(lead_id: str, user=Depends(get_current_user)):
    """Customer approves the CAD/renders and moves the order into production.
    Accepts any draft/sent quotes on the lead and bumps lead order_stage to in_production."""
    lead = await db.leads.find_one({"lead_id": lead_id, "user_id": user["user_id"]})
    if not lead:
        raise HTTPException(404, "Lead not found")
    if not lead.get("cad_renders"):
        raise HTTPException(400, "No renders to approve yet")
    if lead.get("order_stage") and lead["order_stage"] != "design_quotation":
        return {"status": "already_in_production", "order_stage": lead["order_stage"]}

    now = datetime.now(timezone.utc)
    # Mark all pending quotes accepted
    await db.quotes.update_many(
        {"lead_id": lead_id, "status": {"$in": ["draft", "sent", "viewed", None]}},
        {"$set": {"status": "accepted", "accepted_at": now, "updated_at": now}},
    )
    # Move stage to in_production and log a system comment
    sys_comment = {
        "text": "Customer approved the design. Moved to production.",
        "author": user.get("first_name", "Customer"),
        "role": "system",
        "created_at": now,
    }
    await db.leads.update_one(
        {"lead_id": lead_id},
        {
            "$set": {"order_stage": "in_production", "approved_at": now, "updated_at": now},
            "$push": {"comments": sys_comment},
        },
    )
    return {"status": "approved", "order_stage": "in_production"}

@app.get("/api/me/orders")
async def get_my_orders(user=Depends(get_current_user)):
    orders = [serialize_doc(o) async for o in db.orders.find({"user_id": user["user_id"]}).sort("created_at", -1)]
    return {"orders": orders}

# ── API: Events (Enhanced with UA + Geo Enrichment) ─────────

from user_agents import parse as ua_parse
import httpx

# In-memory geo cache: ip -> {data, fetched_date}
_geo_cache = {}

def parse_user_agent(ua_string):
    """Parse UA string into device/browser/OS buckets."""
    if not ua_string:
        return {"device": "unknown", "browser": "unknown", "os": "unknown", "is_mobile": False, "is_tablet": False, "is_bot": False}
    try:
        ua = ua_parse(ua_string)
        device = "mobile" if ua.is_mobile else ("tablet" if ua.is_tablet else "desktop")
        return {
            "device": device,
            "browser": f"{ua.browser.family}",
            "browser_version": ua.browser.version_string,
            "os": f"{ua.os.family}",
            "os_version": ua.os.version_string,
            "is_mobile": ua.is_mobile,
            "is_tablet": ua.is_tablet,
            "is_bot": ua.is_bot,
        }
    except Exception:
        return {"device": "unknown", "browser": "unknown", "os": "unknown", "is_mobile": False, "is_tablet": False, "is_bot": False}

async def resolve_geo(ip: str):
    """Resolve IP to geo data using ip-api.com with daily caching."""
    if not ip or ip in ("127.0.0.1", "::1", "localhost", ""):
        return {"country": "Unknown", "region": "", "city": "", "timezone": "", "lat": 0, "lon": 0, "isp": ""}
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    cache_key = f"{ip}:{today}"
    if cache_key in _geo_cache:
        return _geo_cache[cache_key]
    try:
        async with httpx.AsyncClient(timeout=3) as client_http:
            resp = await client_http.get(f"http://ip-api.com/json/{ip}?fields=status,country,regionName,city,timezone,lat,lon,isp")
            if resp.status_code == 200:
                data = resp.json()
                if data.get("status") == "success":
                    geo = {"country": data.get("country", "Unknown"), "region": data.get("regionName", ""), "city": data.get("city", ""), "timezone": data.get("timezone", ""), "lat": data.get("lat", 0), "lon": data.get("lon", 0), "isp": data.get("isp", "")}
                    _geo_cache[cache_key] = geo
                    # Trim cache to 500 entries
                    if len(_geo_cache) > 500:
                        keys = list(_geo_cache.keys())
                        for k in keys[:100]:
                            _geo_cache.pop(k, None)
                    return geo
    except Exception:
        pass
    return {"country": "Unknown", "region": "", "city": "", "timezone": "", "lat": 0, "lon": 0, "isp": ""}

class EnhancedEventRequest(BaseModel):
    event_name: str
    event_data: dict = {}
    anonymous_id: Optional[str] = None
    session_id: Optional[str] = None
    lead_id: Optional[str] = None
    timestamp: Optional[str] = None
    # Enhanced fields
    client_ts: Optional[str] = None
    page_url: Optional[str] = None
    page_path: Optional[str] = None
    viewport: Optional[str] = None
    wizard_step: Optional[str] = None
    field_name: Optional[str] = None
    error_code: Optional[str] = None
    step_time_ms: Optional[int] = None
    visitor_type: Optional[str] = None
    visit_count: Optional[int] = None
    attribution: Optional[dict] = None

@app.post("/api/events")
async def log_event(req: EnhancedEventRequest, request: Request):
    # Extract IP + UA from request
    client_ip = request.headers.get("x-forwarded-for", request.client.host if request.client else "").split(",")[0].strip()
    ua_string = request.headers.get("user-agent", "")
    ua_parsed = parse_user_agent(ua_string)
    
    # Async geo resolution (non-blocking, fire-and-forget pattern with inline await)
    geo = await resolve_geo(client_ip)
    
    event = {
        "event_id": f"evt_{uuid.uuid4().hex[:12]}",
        "event_name": req.event_name,
        "event_data": req.event_data,
        "anonymous_id": req.anonymous_id,
        "session_id": req.session_id,
        "lead_id": req.lead_id,
        "client_ts": req.client_ts or req.timestamp or datetime.now(timezone.utc).isoformat(),
        "server_timestamp": datetime.now(timezone.utc),
        "page_url": req.page_url or "",
        "page_path": req.page_path or "",
        "viewport": req.viewport or "",
        "wizard_step": req.wizard_step or req.event_data.get("step_id", ""),
        "field_name": req.field_name or "",
        "error_code": req.error_code or "",
        "step_time_ms": req.step_time_ms,
        "visitor_type": req.visitor_type or "unknown",
        "visit_count": req.visit_count or 0,
        "attribution": req.attribution or {},
        "ip": client_ip,
        "ua_raw": ua_string,
        "ua_parsed": ua_parsed,
        "geo": geo,
    }
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

# ── Investor Pitch — Password Gate ────────────────────────────

import hmac as _hmac
import hashlib as _hashlib
import base64 as _b64

PITCH_PASSWORD = "TLJ@2026"
PITCH_TOKEN_SECRET = os.environ.get("JWT_SECRET", "tlj-pitch-secret-2026")
PITCH_TOKEN_TTL_SECONDS = 7 * 24 * 3600  # 7 days

def _sign_pitch_token() -> str:
    expires_at = int(datetime.now(timezone.utc).timestamp()) + PITCH_TOKEN_TTL_SECONDS
    payload = f"pitch.{expires_at}"
    sig = _hmac.new(PITCH_TOKEN_SECRET.encode(), payload.encode(), _hashlib.sha256).hexdigest()
    raw = f"{payload}.{sig}"
    return _b64.urlsafe_b64encode(raw.encode()).decode().rstrip("=")

def _verify_pitch_token(token: str) -> bool:
    try:
        padded = token + "=" * (-len(token) % 4)
        raw = _b64.urlsafe_b64decode(padded.encode()).decode()
        parts = raw.split(".")
        if len(parts) != 3 or parts[0] != "pitch":
            return False
        expires_at = int(parts[1])
        if datetime.now(timezone.utc).timestamp() > expires_at:
            return False
        expected = _hmac.new(PITCH_TOKEN_SECRET.encode(), f"pitch.{expires_at}".encode(), _hashlib.sha256).hexdigest()
        return _hmac.compare_digest(expected, parts[2])
    except Exception:
        return False


class PitchVerifyRequest(BaseModel):
    password: str

@app.post("/api/pitch/verify")
async def pitch_verify(req: PitchVerifyRequest):
    if not _hmac.compare_digest(req.password.strip(), PITCH_PASSWORD):
        raise HTTPException(401, "Incorrect password")
    return {"token": _sign_pitch_token(), "expires_in": PITCH_TOKEN_TTL_SECONDS}

@app.get("/api/pitch/check")
async def pitch_check(token: str):
    if not _verify_pitch_token(token):
        raise HTTPException(401, "Invalid or expired token")
    return {"ok": True}


# ── Investor Pitch — AI Chat ─────────────────────────────────

class PitchChatMessage(BaseModel):
    role: str  # "user" | "assistant"
    content: str

class PitchChatRequest(BaseModel):
    token: str
    session_id: str
    message: str
    history: Optional[List[PitchChatMessage]] = []

@app.post("/api/pitch/chat")
async def pitch_chat(req: PitchChatRequest):
    if not _verify_pitch_token(req.token):
        raise HTTPException(401, "Invalid or expired token")

    user_msg = (req.message or "").strip()
    if not user_msg:
        raise HTTPException(400, "Empty message")
    if len(user_msg) > 800:
        raise HTTPException(400, "Message too long (max 800 chars)")

    # Lazy import so a broken integration doesn't block startup
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        from pitch_context import PITCH_SYSTEM_PROMPT
    except Exception as e:
        raise HTTPException(500, f"LLM integration unavailable: {e}")

    api_key = os.environ.get("EMERGENT_LLM_KEY", "")
    if not api_key:
        raise HTTPException(500, "EMERGENT_LLM_KEY not configured")

    # Build a single prompt with history + new user turn (this keeps things stateless server-side)
    history_text = ""
    if req.history:
        recent = req.history[-8:]  # last 8 turns to bound tokens
        history_text = "\n\nPrior conversation:\n"
        for m in recent:
            label = "Investor" if m.role == "user" else "Assistant"
            history_text += f"\n{label}: {m.content.strip()}"
        history_text += "\n"

    combined = f"{history_text}\nInvestor: {user_msg}"

    try:
        chat = LlmChat(
            api_key=api_key,
            session_id=req.session_id or "pitch_anon",
            system_message=PITCH_SYSTEM_PROMPT,
        ).with_model("anthropic", "claude-sonnet-4-5-20250929")
        reply = await chat.send_message(UserMessage(text=combined))
        return {"reply": str(reply).strip()}
    except Exception as e:
        raise HTTPException(502, f"LLM error: {e}")


# ── SEO: sitemap.xml + robots.txt ──────────────────────────

from fastapi.responses import Response

SITE_BASE_URL = os.environ.get("SITE_BASE_URL", "https://www.thelocaljewel.com").rstrip("/")
SITEMAP_STATIC_PATH = "/app/frontend/public/sitemap.xml"

async def _build_sitemap_xml(base: str) -> str:
    now_iso = datetime.now(timezone.utc).date().isoformat()
    static_routes = [
        ("/",         "1.00", "weekly"),
        ("/projects", "0.90", "weekly"),
        ("/blog",     "0.85", "weekly"),
        ("/contact",  "0.50", "monthly"),
        ("/login",    "0.30", "monthly"),
    ]
    parts = ['<?xml version="1.0" encoding="UTF-8"?>',
             '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for path, priority, changefreq in static_routes:
        parts.append(
            f"<url><loc>{base}{path}</loc><lastmod>{now_iso}</lastmod>"
            f"<changefreq>{changefreq}</changefreq><priority>{priority}</priority></url>"
        )
    try:
        cursor = db.projects.find(
            {"published": {"$ne": False}},
            {"_id": 0, "slug": 1, "updated_at": 1, "created_at": 1},
        )
        async for proj in cursor:
            slug = proj.get("slug")
            if not slug: continue
            last = proj.get("updated_at") or proj.get("created_at")
            lastmod = last.date().isoformat() if hasattr(last, "date") else now_iso
            parts.append(
                f"<url><loc>{base}/projects/{slug}</loc><lastmod>{lastmod}</lastmod>"
                f"<changefreq>monthly</changefreq><priority>0.80</priority></url>"
            )
    except Exception as e:
        logger.error(f"sitemap fetch failed: {e}")
    try:
        bcursor = db.blog_posts.find(
            {"published": True},
            {"_id": 0, "slug": 1, "updated_at": 1, "published_at": 1, "created_at": 1},
        )
        async for post in bcursor:
            slug = post.get("slug")
            if not slug: continue
            last = post.get("updated_at") or post.get("published_at") or post.get("created_at")
            lastmod = last.date().isoformat() if hasattr(last, "date") else now_iso
            parts.append(
                f"<url><loc>{base}/blog/{slug}</loc><lastmod>{lastmod}</lastmod>"
                f"<changefreq>monthly</changefreq><priority>0.70</priority></url>"
            )
    except Exception as e:
        logger.error(f"sitemap blog fetch failed: {e}")
    parts.append('</urlset>')
    return "\n".join(parts)

async def regenerate_static_sitemap():
    """Write the full sitemap to /app/frontend/public/sitemap.xml so the root-domain
    /sitemap.xml is served as proper XML by the static host (no SPA fallback risk)."""
    try:
        xml = await _build_sitemap_xml(SITE_BASE_URL)
        async with aiofiles.open(SITEMAP_STATIC_PATH, "w") as f:
            await f.write(xml)
        logger.info(f"Regenerated static sitemap with {xml.count('<loc>')} URLs")
    except Exception as e:
        logger.error(f"Failed to write static sitemap: {e}")

@app.get("/sitemap.xml", include_in_schema=False)
@app.get("/api/sitemap.xml", include_in_schema=False)
async def sitemap_xml(request: Request):
    """Dynamic sitemap. Used by Googlebot directly via /api/sitemap.xml. The static
    /sitemap.xml file in frontend/public is kept in sync on startup + project changes."""
    host = request.headers.get("x-forwarded-host") or request.headers.get("host") or "www.thelocaljewel.com"
    scheme = request.headers.get("x-forwarded-proto") or "https"
    base = os.environ.get("SITE_BASE_URL") or f"{scheme}://{host}"
    xml = await _build_sitemap_xml(base.rstrip("/"))
    return Response(content=xml, media_type="application/xml")


@app.get("/robots.txt", include_in_schema=False)
@app.get("/api/robots.txt", include_in_schema=False)
async def robots_txt(request: Request):
    host = request.headers.get("x-forwarded-host") or request.headers.get("host") or "thelocaljewel.com"
    scheme = request.headers.get("x-forwarded-proto") or "https"
    base = f"{scheme}://{host}"
    body = (
        "User-agent: *\n"
        "Allow: /\n"
        "Disallow: /admin\n"
        "Disallow: /admin/\n"
        "Disallow: /dashboard\n"
        "Disallow: /pitch\n"
        "Disallow: /pitch/\n"
        f"Sitemap: {base}/sitemap.xml\n"
    )
    return Response(content=body, media_type="text/plain")

