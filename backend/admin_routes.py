import os
import uuid
import csv
import io
import hashlib
from datetime import datetime, timezone, timedelta
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Depends, Header, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorClient
import jwt
from passlib.hash import bcrypt

# Env
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "thelocaljewel")
JWT_SECRET = os.environ.get("JWT_SECRET", "tlj-secret-key-change-in-production-2024")
ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "admin@thelocaljewel.com")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "TLJadmin2024!")

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

router = APIRouter(prefix="/api/admin", tags=["admin"])

# ── Helpers ──────────────────────────────────────────────────

def serialize_doc(doc):
    if doc is None: return None
    doc = dict(doc)
    if "_id" in doc: doc["_id"] = str(doc["_id"])
    for k, v in doc.items():
        if isinstance(v, datetime): doc[k] = v.isoformat()
        elif isinstance(v, list): doc[k] = [serialize_doc(i) if isinstance(i, dict) else (i.isoformat() if isinstance(i, datetime) else i) for i in v]
        elif isinstance(v, dict): doc[k] = serialize_doc(v)
    return doc

def create_admin_jwt(email: str):
    return jwt.encode({"email": email, "role": "admin", "exp": datetime.now(timezone.utc) + timedelta(days=7), "iat": datetime.now(timezone.utc)}, JWT_SECRET, algorithm="HS256")

async def require_admin(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Admin auth required")
    try:
        payload = jwt.decode(authorization.split(" ")[1], JWT_SECRET, algorithms=["HS256"])
        if payload.get("role") != "admin":
            raise HTTPException(403, "Not admin")
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(401, "Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(401, "Invalid token")

# ── Models ───────────────────────────────────────────────────

class AdminLogin(BaseModel):
    email: str
    password: str

class LeadStatusUpdate(BaseModel):
    status: str  # new, contacted, quoted, won, lost

class NoteCreate(BaseModel):
    text: str

class QuoteCreate(BaseModel):
    items: list = []
    total: float = 0
    currency: str = "USD"
    notes: str = ""
    template_name: str = ""

class QuoteStatusUpdate(BaseModel):
    status: str  # draft, sent, viewed, accepted, rejected

class OrderCreate(BaseModel):
    quote_id: str
    notes: str = ""

class OrderUpdate(BaseModel):
    status: Optional[str] = None
    tracking_number: Optional[str] = None
    shipping_provider: Optional[str] = None
    shipping_url: Optional[str] = None

class SettingsUpdate(BaseModel):
    phone_number: Optional[str] = None
    whatsapp_link: Optional[str] = None
    live_chat_enabled: Optional[bool] = None
    gia_logo_visible: Optional[bool] = None
    igi_logo_visible: Optional[bool] = None
    reviews_count: Optional[str] = None
    customers_count: Optional[str] = None
    avg_savings: Optional[str] = None
    email_notify_new_lead: Optional[bool] = None
    email_notify_quote: Optional[bool] = None

class TrackingUpdate(BaseModel):
    meta_pixel_id: Optional[str] = None
    google_ads_tag: Optional[str] = None
    tiktok_pixel_id: Optional[str] = None
    google_analytics_id: Optional[str] = None

# ── Auth ─────────────────────────────────────────────────────

@router.post("/auth/login")
async def admin_login(req: AdminLogin):
    # Check admin from DB or env
    admin = await db.admins.find_one({"email": req.email.lower()})
    if admin:
        if not bcrypt.verify(req.password, admin["password_hash"]):
            raise HTTPException(401, "Invalid credentials")
    else:
        # Fallback to env-based admin
        if req.email.lower() != ADMIN_EMAIL.lower() or req.password != ADMIN_PASSWORD:
            raise HTTPException(401, "Invalid credentials")
    token = create_admin_jwt(req.email.lower())
    return {"token": token, "email": req.email.lower()}

@router.get("/me")
async def admin_me(admin=Depends(require_admin)):
    return {"email": admin["email"], "role": "admin"}

# ── Analytics ────────────────────────────────────────────────

@router.get("/analytics/overview")
async def analytics_overview(admin=Depends(require_admin)):
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_start = today_start - timedelta(days=today_start.weekday())
    month_start = today_start.replace(day=1)

    total = await db.leads.count_documents({})
    today = await db.leads.count_documents({"created_at": {"$gte": today_start}})
    this_week = await db.leads.count_documents({"created_at": {"$gte": week_start}})
    this_month = await db.leads.count_documents({"created_at": {"$gte": month_start}})

    # Avg completion time
    pipeline = [{"$match": {"started_at": {"$exists": True}, "completed_at": {"$exists": True}}}, {"$project": {"duration": {"$subtract": ["$completed_at", "$started_at"]}}}, {"$group": {"_id": None, "avg_ms": {"$avg": "$duration"}}}]
    avg_result = await db.wizard_sessions.aggregate(pipeline).to_list(1)
    avg_time_seconds = round(avg_result[0]["avg_ms"] / 1000, 1) if avg_result and avg_result[0].get("avg_ms") else 0

    # Status breakdown
    status_pipeline = [{"$group": {"_id": "$status", "count": {"$sum": 1}}}]
    status_result = await db.leads.aggregate(status_pipeline).to_list(20)
    status_breakdown = {s["_id"] or "new": s["count"] for s in status_result}

    return {"total": total, "today": today, "this_week": this_week, "this_month": this_month, "avg_completion_time_seconds": avg_time_seconds, "status_breakdown": status_breakdown}

@router.get("/analytics/funnel")
async def analytics_funnel(admin=Depends(require_admin), days: int = Query(30)):
    since = datetime.now(timezone.utc) - timedelta(days=days)
    pipeline = [{"$match": {"server_timestamp": {"$gte": since}, "event_name": {"$in": ["tlj_landing_view", "tlj_wizard_start", "tlj_step_view", "tlj_step_complete", "tlj_value_reveal_view", "tlj_contact_submit_attempt", "tlj_lead_created"]}}}, {"$group": {"_id": "$event_name", "count": {"$sum": 1}}}]
    result = await db.events.aggregate(pipeline).to_list(20)
    funnel = {r["_id"]: r["count"] for r in result}

    # Step-level breakdown
    step_pipeline = [{"$match": {"server_timestamp": {"$gte": since}, "event_name": "tlj_step_view"}}, {"$group": {"_id": "$event_data.step_id", "views": {"$sum": 1}}}]
    step_result = await db.events.aggregate(step_pipeline).to_list(30)
    step_views = {s["_id"]: s["views"] for s in step_result if s["_id"]}

    step_complete_pipeline = [{"$match": {"server_timestamp": {"$gte": since}, "event_name": "tlj_step_complete"}}, {"$group": {"_id": "$event_data.step_id", "completes": {"$sum": 1}}}]
    step_complete_result = await db.events.aggregate(step_complete_pipeline).to_list(30)
    step_completes = {s["_id"]: s["completes"] for s in step_complete_result if s["_id"]}

    return {"funnel": funnel, "step_views": step_views, "step_completes": step_completes}

@router.get("/analytics/sources")
async def analytics_sources(admin=Depends(require_admin), days: int = Query(30)):
    since = datetime.now(timezone.utc) - timedelta(days=days)
    pipeline = [{"$match": {"created_at": {"$gte": since}}}, {"$group": {"_id": {"source": {"$ifNull": ["$attribution.utm_source", "direct"]}, "medium": {"$ifNull": ["$attribution.utm_medium", ""]}}, "count": {"$sum": 1}}}, {"$sort": {"count": -1}}, {"$limit": 20}]
    result = await db.leads.aggregate(pipeline).to_list(20)
    sources = [{"source": r["_id"]["source"], "medium": r["_id"]["medium"], "count": r["count"]} for r in result]
    return {"sources": sources}

@router.get("/analytics/campaigns")
async def analytics_campaigns(admin=Depends(require_admin), days: int = Query(30)):
    since = datetime.now(timezone.utc) - timedelta(days=days)
    pipeline = [{"$match": {"created_at": {"$gte": since}, "attribution.utm_campaign": {"$exists": True, "$ne": ""}}}, {"$group": {"_id": {"campaign": "$attribution.utm_campaign", "content": {"$ifNull": ["$attribution.utm_content", ""]}}, "count": {"$sum": 1}}}, {"$sort": {"count": -1}}, {"$limit": 20}]
    result = await db.leads.aggregate(pipeline).to_list(20)
    campaigns = [{"campaign": r["_id"]["campaign"], "content": r["_id"]["content"], "count": r["count"]} for r in result]
    return {"campaigns": campaigns}

@router.get("/analytics/devices")
async def analytics_devices(admin=Depends(require_admin), days: int = Query(30)):
    since = datetime.now(timezone.utc) - timedelta(days=days)
    pipeline = [{"$match": {"created_at": {"$gte": since}}}, {"$group": {"_id": {"$ifNull": ["$attribution.device_type", "unknown"]}, "count": {"$sum": 1}}}]
    result = await db.leads.aggregate(pipeline).to_list(10)
    devices = [{"device": r["_id"], "count": r["count"]} for r in result]
    return {"devices": devices}

@router.get("/analytics/geo")
async def analytics_geo(admin=Depends(require_admin), days: int = Query(30)):
    since = datetime.now(timezone.utc) - timedelta(days=days)
    pipeline = [{"$match": {"created_at": {"$gte": since}}}, {"$group": {"_id": {"$ifNull": ["$attribution.country", "Unknown"]}, "count": {"$sum": 1}}}, {"$sort": {"count": -1}}, {"$limit": 20}]
    result = await db.leads.aggregate(pipeline).to_list(20)
    geo = [{"country": r["_id"], "count": r["count"]} for r in result]
    return {"geo": geo}

@router.get("/analytics/abandonment")
async def analytics_abandonment(admin=Depends(require_admin), days: int = Query(30)):
    since = datetime.now(timezone.utc) - timedelta(days=days)
    # Get sessions that never completed
    pipeline = [{"$match": {"started_at": {"$gte": since}}}, {"$group": {"_id": "$current_step", "count": {"$sum": 1}}}, {"$sort": {"count": -1}}]
    result = await db.wizard_sessions.aggregate(pipeline).to_list(30)
    abandonment = [{"screen": r["_id"], "count": r["count"]} for r in result]

    total_started = await db.wizard_sessions.count_documents({"started_at": {"$gte": since}})
    total_completed = await db.leads.count_documents({"created_at": {"$gte": since}})
    rate = round((1 - total_completed / total_started) * 100, 1) if total_started > 0 else 0

    return {"abandonment_by_screen": abandonment, "total_started": total_started, "total_completed": total_completed, "abandonment_rate_pct": rate}

# ── Lead CRM ─────────────────────────────────────────────────

@router.get("/leads")
async def get_leads(admin=Depends(require_admin), page: int = Query(1, ge=1), limit: int = Query(25, le=100), status: Optional[str] = None, product_type: Optional[str] = None, budget: Optional[str] = None, source: Optional[str] = None, search: Optional[str] = None, date_from: Optional[str] = None, date_to: Optional[str] = None):
    query = {}
    if status: query["status"] = status
    if product_type: query["product_type"] = product_type
    if budget: query["budget"] = budget
    if source: query["attribution.utm_source"] = source
    if search:
        query["$or"] = [{"first_name": {"$regex": search, "$options": "i"}}, {"email": {"$regex": search, "$options": "i"}}, {"phone": {"$regex": search, "$options": "i"}}, {"lead_id": {"$regex": search, "$options": "i"}}]
    if date_from:
        try: query["created_at"] = {"$gte": datetime.fromisoformat(date_from.replace("Z", "+00:00"))}
        except: pass
    if date_to:
        dt_to = query.get("created_at", {})
        try: dt_to["$lte"] = datetime.fromisoformat(date_to.replace("Z", "+00:00"))
        except: pass
        if dt_to: query["created_at"] = dt_to

    total = await db.leads.count_documents(query)
    skip = (page - 1) * limit
    cursor = db.leads.find(query).sort("created_at", -1).skip(skip).limit(limit)
    leads = [serialize_doc(doc) async for doc in cursor]
    return {"leads": leads, "total": total, "page": page, "limit": limit, "pages": (total + limit - 1) // limit if limit > 0 else 0}

@router.get("/leads/export.csv")
async def export_leads_csv(admin=Depends(require_admin), status: Optional[str] = None, date_from: Optional[str] = None, date_to: Optional[str] = None):
    query = {}
    if status: query["status"] = status
    if date_from:
        try: query.setdefault("created_at", {})["$gte"] = datetime.fromisoformat(date_from.replace("Z", "+00:00"))
        except: pass
    if date_to:
        try: query.setdefault("created_at", {})["$lte"] = datetime.fromisoformat(date_to.replace("Z", "+00:00"))
        except: pass

    cursor = db.leads.find(query).sort("created_at", -1)
    fields = ["lead_id", "first_name", "phone", "email", "product_type", "diamond_shape", "carat_range", "priority", "metal", "budget", "status", "created_at", "notes"]

    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=fields, extrasaction="ignore")
    writer.writeheader()
    async for doc in cursor:
        row = serialize_doc(doc)
        writer.writerow({f: row.get(f, "") for f in fields})

    output.seek(0)
    return StreamingResponse(iter([output.getvalue()]), media_type="text/csv", headers={"Content-Disposition": f"attachment; filename=leads_export_{datetime.now().strftime('%Y%m%d')}.csv"})

@router.get("/leads/{lead_id}")
async def get_lead_detail(lead_id: str, admin=Depends(require_admin)):
    lead = await db.leads.find_one({"lead_id": lead_id})
    if not lead: raise HTTPException(404, "Lead not found")
    # Get quotes and notes
    quotes = [serialize_doc(q) async for q in db.quotes.find({"lead_id": lead_id}).sort("created_at", -1)]
    orders = [serialize_doc(o) async for o in db.orders.find({"lead_id": lead_id}).sort("created_at", -1)]
    return {"lead": serialize_doc(lead), "quotes": quotes, "orders": orders}

@router.patch("/leads/{lead_id}")
async def update_lead_status(lead_id: str, req: LeadStatusUpdate, admin=Depends(require_admin)):
    valid = ["new", "contacted", "quoted", "won", "lost"]
    if req.status not in valid: raise HTTPException(400, f"Status must be one of: {valid}")
    result = await db.leads.update_one({"lead_id": lead_id}, {"$set": {"status": req.status, "updated_at": datetime.now(timezone.utc)}})
    if result.matched_count == 0: raise HTTPException(404, "Lead not found")
    return {"status": "updated"}

@router.post("/leads/{lead_id}/notes")
async def add_lead_note(lead_id: str, req: NoteCreate, admin=Depends(require_admin)):
    note = {"text": req.text, "author": admin["email"], "created_at": datetime.now(timezone.utc)}
    result = await db.leads.update_one({"lead_id": lead_id}, {"$push": {"internal_notes": note}})
    if result.matched_count == 0: raise HTTPException(404, "Lead not found")
    return {"status": "added", "note": serialize_doc(note)}

# ── Quotation Management ─────────────────────────────────────

@router.post("/leads/{lead_id}/quotes")
async def create_quote(lead_id: str, req: QuoteCreate, admin=Depends(require_admin)):
    lead = await db.leads.find_one({"lead_id": lead_id})
    if not lead: raise HTTPException(404, "Lead not found")
    quote = {"quote_id": f"q_{uuid.uuid4().hex[:10]}", "lead_id": lead_id, "items": req.items, "total": req.total, "currency": req.currency, "notes": req.notes, "template_name": req.template_name, "status": "draft", "created_at": datetime.now(timezone.utc), "updated_at": datetime.now(timezone.utc)}
    await db.quotes.insert_one(quote)
    # Update lead status
    await db.leads.update_one({"lead_id": lead_id}, {"$set": {"status": "quoted", "updated_at": datetime.now(timezone.utc)}})
    return serialize_doc(quote)

@router.get("/leads/{lead_id}/quotes")
async def get_lead_quotes(lead_id: str, admin=Depends(require_admin)):
    quotes = [serialize_doc(q) async for q in db.quotes.find({"lead_id": lead_id}).sort("created_at", -1)]
    return {"quotes": quotes}

@router.patch("/quotes/{quote_id}")
async def update_quote_status(quote_id: str, req: QuoteStatusUpdate, admin=Depends(require_admin)):
    valid = ["draft", "sent", "viewed", "accepted", "rejected"]
    if req.status not in valid: raise HTTPException(400, f"Status must be one of: {valid}")
    update = {"status": req.status, "updated_at": datetime.now(timezone.utc)}
    if req.status == "sent": update["sent_at"] = datetime.now(timezone.utc)
    elif req.status == "viewed": update["viewed_at"] = datetime.now(timezone.utc)
    elif req.status == "accepted": update["accepted_at"] = datetime.now(timezone.utc)
    result = await db.quotes.update_one({"quote_id": quote_id}, {"$set": update})
    if result.matched_count == 0: raise HTTPException(404, "Quote not found")
    return {"status": "updated"}

# ── Order Management ─────────────────────────────────────────

@router.post("/orders")
async def create_order(req: OrderCreate, admin=Depends(require_admin)):
    quote = await db.quotes.find_one({"quote_id": req.quote_id})
    if not quote: raise HTTPException(404, "Quote not found")
    order = {"order_id": f"ord_{uuid.uuid4().hex[:10]}", "lead_id": quote["lead_id"], "quote_id": req.quote_id, "notes": req.notes, "status": "processing", "tracking_number": "", "shipping_provider": "", "shipping_url": "", "created_at": datetime.now(timezone.utc), "updated_at": datetime.now(timezone.utc)}
    await db.orders.insert_one(order)
    # Update lead + quote
    await db.leads.update_one({"lead_id": quote["lead_id"]}, {"$set": {"status": "won", "updated_at": datetime.now(timezone.utc)}})
    await db.quotes.update_one({"quote_id": req.quote_id}, {"$set": {"status": "accepted", "updated_at": datetime.now(timezone.utc)}})
    return serialize_doc(order)

@router.get("/orders")
async def get_orders(admin=Depends(require_admin), page: int = Query(1, ge=1), limit: int = Query(25, le=100), status: Optional[str] = None):
    query = {}
    if status: query["status"] = status
    total = await db.orders.count_documents(query)
    skip = (page - 1) * limit
    cursor = db.orders.find(query).sort("created_at", -1).skip(skip).limit(limit)
    orders = [serialize_doc(o) async for o in cursor]
    return {"orders": orders, "total": total, "page": page, "limit": limit}

@router.get("/orders/{order_id}")
async def get_order(order_id: str, admin=Depends(require_admin)):
    order = await db.orders.find_one({"order_id": order_id})
    if not order: raise HTTPException(404, "Order not found")
    return serialize_doc(order)

@router.patch("/orders/{order_id}")
async def update_order(order_id: str, req: OrderUpdate, admin=Depends(require_admin)):
    update = {"updated_at": datetime.now(timezone.utc)}
    if req.status:
        valid = ["processing", "in_production", "shipped", "delivered"]
        if req.status not in valid: raise HTTPException(400, f"Status must be one of: {valid}")
        update["status"] = req.status
    if req.tracking_number is not None: update["tracking_number"] = req.tracking_number
    if req.shipping_provider is not None: update["shipping_provider"] = req.shipping_provider
    if req.shipping_url is not None: update["shipping_url"] = req.shipping_url
    result = await db.orders.update_one({"order_id": order_id}, {"$set": update})
    if result.matched_count == 0: raise HTTPException(404, "Order not found")
    return {"status": "updated"}

# ── Settings ─────────────────────────────────────────────────

async def get_settings_doc():
    doc = await db.settings.find_one({"_type": "site_settings"})
    if not doc:
        doc = {"_type": "site_settings", "phone_number": "+1234567890", "whatsapp_link": "https://wa.me/1234567890", "live_chat_enabled": False, "gia_logo_visible": True, "igi_logo_visible": True, "reviews_count": "70+", "customers_count": "100+", "avg_savings": "$5,000", "email_notify_new_lead": True, "email_notify_quote": True}
        await db.settings.insert_one(doc)
    return doc

@router.get("/settings")
async def get_settings(admin=Depends(require_admin)):
    doc = await get_settings_doc()
    return serialize_doc(doc)

@router.patch("/settings")
async def update_settings(req: SettingsUpdate, admin=Depends(require_admin)):
    await get_settings_doc()  # ensure exists
    update = {k: v for k, v in req.dict(exclude_none=True).items()}
    if update:
        await db.settings.update_one({"_type": "site_settings"}, {"$set": update})
    doc = await get_settings_doc()
    return serialize_doc(doc)

# Public endpoint for frontend to get settings
@router.get("/settings/public")
async def get_public_settings():
    doc = await get_settings_doc()
    return {"phone_number": doc.get("phone_number", ""), "whatsapp_link": doc.get("whatsapp_link", ""), "live_chat_enabled": doc.get("live_chat_enabled", False), "gia_logo_visible": doc.get("gia_logo_visible", True), "igi_logo_visible": doc.get("igi_logo_visible", True), "reviews_count": doc.get("reviews_count", "70+"), "customers_count": doc.get("customers_count", "100+"), "avg_savings": doc.get("avg_savings", "$5,000")}

# ── Tracking Configuration ───────────────────────────────────

async def get_tracking_doc():
    doc = await db.settings.find_one({"_type": "tracking_settings"})
    if not doc:
        doc = {"_type": "tracking_settings", "meta_pixel_id": "", "google_ads_tag": "", "tiktok_pixel_id": "", "google_analytics_id": ""}
        await db.settings.insert_one(doc)
    return doc

@router.get("/tracking")
async def get_tracking(admin=Depends(require_admin)):
    return serialize_doc(await get_tracking_doc())

@router.patch("/tracking")
async def update_tracking(req: TrackingUpdate, admin=Depends(require_admin)):
    await get_tracking_doc()
    update = {k: v for k, v in req.dict(exclude_none=True).items()}
    if update:
        await db.settings.update_one({"_type": "tracking_settings"}, {"$set": update})
    return serialize_doc(await get_tracking_doc())

@router.get("/tracking/verify")
async def verify_tracking(admin=Depends(require_admin)):
    event_names = ["tlj_landing_view", "tlj_wizard_start", "tlj_step_view", "tlj_step_complete", "tlj_step_back", "tlj_step_abandon", "tlj_value_reveal_view", "tlj_contact_submit_attempt", "tlj_lead_created", "tlj_file_upload_start", "tlj_file_upload_success", "tlj_file_upload_fail"]
    verification = []
    for name in event_names:
        last = await db.events.find_one({"event_name": name}, sort=[("server_timestamp", -1)])
        count = await db.events.count_documents({"event_name": name})
        verification.append({"event": name, "total_count": count, "last_seen": last["server_timestamp"].isoformat() if last and "server_timestamp" in last and isinstance(last["server_timestamp"], datetime) else (str(last.get("server_timestamp", "never")) if last else "never")})
    return {"events": verification}
