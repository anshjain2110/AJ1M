import os
import uuid
import csv
import io
import hashlib
from datetime import datetime, timezone, timedelta
from typing import Optional, List
from dotenv import load_dotenv
load_dotenv("/app/backend/.env")
from fastapi import APIRouter, HTTPException, Depends, Header, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorClient
import jwt
from passlib.hash import bcrypt

# Env
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "thelocaljewel")
JWT_SECRET = os.environ.get("JWT_SECRET", "rG9oG5Eul803YO57JCGom4lFp99xXaLvRtbDdQpozd5VDkIWVKnb9quulv4LjawP")
ADMIN_CREDENTIALS = [
    {"email": os.environ.get("ADMIN_EMAIL", "ansh@thelocaljewel.com"), "password": os.environ.get("ADMIN_PASSWORD", "Rakesh@2709")},
    {"email": "nayan@thelocaljewel.com", "password": "Nayan@123"},
]

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

router = APIRouter(prefix="/api/admin", tags=["admin"])

# ── Helpers ──────────────────────────────────────────────────

def serialize_doc(doc):
    if doc is None:
        return None
    doc = dict(doc)
    if "_id" in doc:
        doc["_id"] = str(doc["_id"])
    for k, v in doc.items():
        if isinstance(v, datetime):
            doc[k] = v.isoformat()
        elif isinstance(v, list):
            doc[k] = [serialize_doc(i) if isinstance(i, dict) else (i.isoformat() if isinstance(i, datetime) else i) for i in v]
        elif isinstance(v, dict):
            doc[k] = serialize_doc(v)
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
        matched = any(
            req.email.lower() == cred["email"].lower() and req.password == cred["password"]
            for cred in ADMIN_CREDENTIALS
        )
        if not matched:
            raise HTTPException(401, "Invalid credentials")
    token = create_admin_jwt(req.email.lower())
    return {"token": token, "email": req.email.lower()}

@router.get("/me")
async def admin_me(admin=Depends(require_admin)):
    return {"email": admin["email"], "role": "admin"}

# ── Analytics (Advanced Engine) ───────────────────────────────

def build_date_filter(days: int = 30, date_from: str = None, date_to: str = None):
    """Build a MongoDB date range filter."""
    if date_from:
        try:
            start = datetime.fromisoformat(date_from.replace("Z", "+00:00"))
        except Exception:
            start = datetime.now(timezone.utc) - timedelta(days=days)
    else:
        start = datetime.now(timezone.utc) - timedelta(days=days)
    if date_to:
        try:
            end = datetime.fromisoformat(date_to.replace("Z", "+00:00"))
        except Exception:
            end = datetime.now(timezone.utc)
    else:
        end = datetime.now(timezone.utc)
    return start, end

def build_prev_period(start, end):
    """Calculate previous period of same length for comparison."""
    delta = end - start
    return start - delta, start

@router.get("/analytics/executive")
async def analytics_executive(
    admin=Depends(require_admin),
    days: int = Query(30),
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
):
    start, end = build_date_filter(days, date_from, date_to)
    prev_start, prev_end = build_prev_period(start, end)
    ts_filter = {"server_timestamp": {"$gte": start, "$lte": end}}
    prev_ts_filter = {"server_timestamp": {"$gte": prev_start, "$lte": prev_end}}
    lead_filter = {"created_at": {"$gte": start, "$lte": end}}
    prev_lead_filter = {"created_at": {"$gte": prev_start, "$lte": prev_end}}

    # Current period
    sessions = await db.events.count_documents({**ts_filter, "event_name": "tlj_session_start"})
    wizard_starts = await db.events.count_documents({**ts_filter, "event_name": "tlj_wizard_start"})
    submits = await db.events.count_documents({**ts_filter, "event_name": "tlj_lead_created"})
    total_leads = await db.leads.count_documents(lead_filter)
    abandons = await db.events.count_documents({**ts_filter, "event_name": "tlj_step_abandon"})

    # Previous period
    prev_sessions = await db.events.count_documents({**prev_ts_filter, "event_name": "tlj_session_start"})
    prev_wizard_starts = await db.events.count_documents({**prev_ts_filter, "event_name": "tlj_wizard_start"})
    prev_submits = await db.events.count_documents({**prev_ts_filter, "event_name": "tlj_lead_created"})
    prev_total_leads = await db.leads.count_documents(prev_lead_filter)

    # Completion rate
    completion_rate = round((submits / wizard_starts * 100), 1) if wizard_starts > 0 else 0
    prev_completion_rate = round((prev_submits / prev_wizard_starts * 100), 1) if prev_wizard_starts > 0 else 0

    # Avg step time
    step_time_pipeline = [{"$match": {**ts_filter, "event_name": "tlj_step_complete", "step_time_ms": {"$exists": True, "$gt": 0}}}, {"$group": {"_id": None, "avg_ms": {"$avg": "$step_time_ms"}, "median_ms": {"$avg": "$step_time_ms"}}}]
    step_time_result = await db.events.aggregate(step_time_pipeline).to_list(1)
    avg_step_time_sec = round(step_time_result[0]["avg_ms"] / 1000, 1) if step_time_result and step_time_result[0].get("avg_ms") else 0

    # Lead quality breakdown
    quality_pipeline = [{"$match": lead_filter}, {"$group": {"_id": "$intent_bucket", "count": {"$sum": 1}}}]
    quality_result = await db.leads.aggregate(quality_pipeline).to_list(10)
    quality_breakdown = {q["_id"] or "unscored": q["count"] for q in quality_result}

    # Status breakdown
    status_pipeline = [{"$match": lead_filter}, {"$group": {"_id": "$status", "count": {"$sum": 1}}}]
    status_result = await db.leads.aggregate(status_pipeline).to_list(20)
    status_breakdown = {s["_id"] or "new": s["count"] for s in status_result}

    def delta(current, previous):
        if previous == 0:
            return 100 if current > 0 else 0
        return round(((current - previous) / previous) * 100, 1)

    return {
        "period": {"start": start.isoformat(), "end": end.isoformat(), "days": days},
        "metrics": {
            "sessions": {"value": sessions, "prev": prev_sessions, "delta": delta(sessions, prev_sessions)},
            "wizard_starts": {"value": wizard_starts, "prev": prev_wizard_starts, "delta": delta(wizard_starts, prev_wizard_starts)},
            "submits": {"value": submits, "prev": prev_submits, "delta": delta(submits, prev_submits)},
            "total_leads": {"value": total_leads, "prev": prev_total_leads, "delta": delta(total_leads, prev_total_leads)},
            "completion_rate": {"value": completion_rate, "prev": prev_completion_rate, "delta": round(completion_rate - prev_completion_rate, 1)},
            "avg_step_time_sec": {"value": avg_step_time_sec},
            "abandons": {"value": abandons},
        },
        "quality_breakdown": quality_breakdown,
        "status_breakdown": status_breakdown,
    }

@router.get("/analytics/overview")
async def analytics_overview(admin=Depends(require_admin)):
    """Legacy endpoint for backward compat."""
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_start = today_start - timedelta(days=today_start.weekday())
    month_start = today_start.replace(day=1)
    total = await db.leads.count_documents({})
    today = await db.leads.count_documents({"created_at": {"$gte": today_start}})
    this_week = await db.leads.count_documents({"created_at": {"$gte": week_start}})
    this_month = await db.leads.count_documents({"created_at": {"$gte": month_start}})
    pipeline = [{"$match": {"started_at": {"$exists": True}, "completed_at": {"$exists": True}}}, {"$project": {"duration": {"$subtract": ["$completed_at", "$started_at"]}}}, {"$group": {"_id": None, "avg_ms": {"$avg": "$duration"}}}]
    avg_result = await db.wizard_sessions.aggregate(pipeline).to_list(1)
    avg_time_seconds = round(avg_result[0]["avg_ms"] / 1000, 1) if avg_result and avg_result[0].get("avg_ms") else 0
    status_pipeline = [{"$group": {"_id": "$status", "count": {"$sum": 1}}}]
    status_result = await db.leads.aggregate(status_pipeline).to_list(20)
    status_breakdown = {s["_id"] or "new": s["count"] for s in status_result}
    return {"total": total, "today": today, "this_week": this_week, "this_month": this_month, "avg_completion_time_seconds": avg_time_seconds, "status_breakdown": status_breakdown}

@router.get("/analytics/funnel")
async def analytics_funnel(
    admin=Depends(require_admin),
    days: int = Query(30),
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
):
    start, end = build_date_filter(days, date_from, date_to)
    ts_filter = {"server_timestamp": {"$gte": start, "$lte": end}}

    # Top-level funnel
    funnel_events = ["tlj_landing_view", "tlj_session_start", "tlj_wizard_start", "tlj_step_view", "tlj_step_complete", "tlj_value_reveal_view", "tlj_contact_submit_attempt", "tlj_lead_created"]
    pipeline = [{"$match": {**ts_filter, "event_name": {"$in": funnel_events}}}, {"$group": {"_id": "$event_name", "count": {"$sum": 1}, "unique_sessions": {"$addToSet": "$session_id"}}}]
    result = await db.events.aggregate(pipeline).to_list(20)
    funnel = {}
    for r in result:
        funnel[r["_id"]] = {"count": r["count"], "unique_sessions": len(r["unique_sessions"])}

    # Step-level breakdown with timing
    step_view_pipeline = [
        {"$match": {**ts_filter, "event_name": "tlj_step_view"}},
        {"$group": {"_id": "$wizard_step", "views": {"$sum": 1}, "unique_sessions": {"$addToSet": "$session_id"}}}
    ]
    step_views = await db.events.aggregate(step_view_pipeline).to_list(30)

    step_complete_pipeline = [
        {"$match": {**ts_filter, "event_name": "tlj_step_complete"}},
        {"$group": {"_id": "$wizard_step", "completes": {"$sum": 1}, "avg_time_ms": {"$avg": "$step_time_ms"}, "unique_sessions": {"$addToSet": "$session_id"}}}
    ]
    step_completes = await db.events.aggregate(step_complete_pipeline).to_list(30)

    step_abandon_pipeline = [
        {"$match": {**ts_filter, "event_name": "tlj_step_abandon"}},
        {"$group": {"_id": "$wizard_step", "abandons": {"$sum": 1}}}
    ]
    step_abandons = await db.events.aggregate(step_abandon_pipeline).to_list(30)

    # Merge step data
    steps = {}
    for sv in step_views:
        sid = sv["_id"] or "unknown"
        steps[sid] = {"views": sv["views"], "unique_views": len(sv["unique_sessions"]), "completes": 0, "abandons": 0, "avg_time_sec": 0}
    for sc in step_completes:
        sid = sc["_id"] or "unknown"
        if sid not in steps:
            steps[sid] = {"views": 0, "unique_views": 0, "completes": 0, "abandons": 0, "avg_time_sec": 0}
        steps[sid]["completes"] = sc["completes"]
        steps[sid]["avg_time_sec"] = round(sc["avg_time_ms"] / 1000, 1) if sc.get("avg_time_ms") else 0
        steps[sid]["unique_completes"] = len(sc["unique_sessions"])
    for sa in step_abandons:
        sid = sa["_id"] or "unknown"
        if sid in steps:
            steps[sid]["abandons"] = sa["abandons"]

    # Calculate drop rates
    for sid, data in steps.items():
        if data["views"] > 0:
            data["drop_rate"] = round((1 - data["completes"] / data["views"]) * 100, 1)
        else:
            data["drop_rate"] = 0

    return {"funnel": funnel, "steps": steps}

@router.get("/analytics/trends")
async def analytics_trends(
    admin=Depends(require_admin),
    days: int = Query(30),
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
):
    start, end = build_date_filter(days, date_from, date_to)
    ts_filter = {"server_timestamp": {"$gte": start, "$lte": end}}

    # Daily trends
    daily_pipeline = [
        {"$match": {**ts_filter, "event_name": {"$in": ["tlj_session_start", "tlj_wizard_start", "tlj_lead_created"]}}},
        {"$group": {
            "_id": {"date": {"$dateToString": {"format": "%Y-%m-%d", "date": "$server_timestamp"}}, "event": "$event_name"},
            "count": {"$sum": 1}
        }},
        {"$sort": {"_id.date": 1}}
    ]
    daily_result = await db.events.aggregate(daily_pipeline).to_list(500)
    daily = {}
    for r in daily_result:
        d = r["_id"]["date"]
        if d not in daily:
            daily[d] = {"date": d, "sessions": 0, "wizard_starts": 0, "leads": 0}
        if r["_id"]["event"] == "tlj_session_start":
            daily[d]["sessions"] = r["count"]
        elif r["_id"]["event"] == "tlj_wizard_start":
            daily[d]["wizard_starts"] = r["count"]
        elif r["_id"]["event"] == "tlj_lead_created":
            daily[d]["leads"] = r["count"]

    # Hourly heatmap
    hourly_pipeline = [
        {"$match": {**ts_filter, "event_name": {"$in": ["tlj_session_start", "tlj_wizard_start", "tlj_lead_created"]}}},
        {"$group": {
            "_id": {"hour": {"$hour": "$server_timestamp"}, "dow": {"$dayOfWeek": "$server_timestamp"}, "event": "$event_name"},
            "count": {"$sum": 1}
        }}
    ]
    hourly_result = await db.events.aggregate(hourly_pipeline).to_list(500)
    hourly = {}
    for r in hourly_result:
        key = f"{r['_id']['dow']}_{r['_id']['hour']}"
        if key not in hourly:
            hourly[key] = {"dow": r["_id"]["dow"], "hour": r["_id"]["hour"], "sessions": 0, "wizard_starts": 0, "leads": 0}
        if r["_id"]["event"] == "tlj_session_start":
            hourly[key]["sessions"] = r["count"]
        elif r["_id"]["event"] == "tlj_wizard_start":
            hourly[key]["wizard_starts"] = r["count"]
        elif r["_id"]["event"] == "tlj_lead_created":
            hourly[key]["leads"] = r["count"]

    return {"daily": sorted(daily.values(), key=lambda x: x["date"]), "hourly": list(hourly.values())}

@router.get("/analytics/friction")
async def analytics_friction(
    admin=Depends(require_admin),
    days: int = Query(30),
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
):
    start, end = build_date_filter(days, date_from, date_to)
    ts_filter = {"server_timestamp": {"$gte": start, "$lte": end}}

    # Step-level friction: abandons by step
    abandon_pipeline = [
        {"$match": {**ts_filter, "event_name": "tlj_step_abandon"}},
        {"$group": {"_id": "$wizard_step", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 15}
    ]
    abandon_result = await db.events.aggregate(abandon_pipeline).to_list(15)

    # Field errors
    field_error_pipeline = [
        {"$match": {**ts_filter, "event_name": "tlj_field_error"}},
        {"$group": {"_id": {"field": "$field_name", "error": "$error_code"}, "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 20}
    ]
    field_error_result = await db.events.aggregate(field_error_pipeline).to_list(20)

    # Slowest steps (avg time)
    slow_step_pipeline = [
        {"$match": {**ts_filter, "event_name": "tlj_step_complete", "step_time_ms": {"$exists": True, "$gt": 0}}},
        {"$group": {"_id": "$wizard_step", "avg_time_ms": {"$avg": "$step_time_ms"}, "max_time_ms": {"$max": "$step_time_ms"}, "count": {"$sum": 1}}},
        {"$sort": {"avg_time_ms": -1}},
        {"$limit": 15}
    ]
    slow_step_result = await db.events.aggregate(slow_step_pipeline).to_list(15)

    # Back-button frequency by step
    back_pipeline = [
        {"$match": {**ts_filter, "event_name": "tlj_step_back"}},
        {"$group": {"_id": "$event_data.from_step_id", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 10}
    ]
    back_result = await db.events.aggregate(back_pipeline).to_list(10)

    return {
        "abandon_by_step": [{"step": a["_id"] or "unknown", "count": a["count"]} for a in abandon_result],
        "field_errors": [{"field": f["_id"]["field"] or "unknown", "error": f["_id"]["error"] or "unknown", "count": f["count"]} for f in field_error_result],
        "slowest_steps": [{"step": s["_id"] or "unknown", "avg_time_sec": round(s["avg_time_ms"] / 1000, 1), "max_time_sec": round(s["max_time_ms"] / 1000, 1), "count": s["count"]} for s in slow_step_result],
        "back_navigation": [{"from_step": b["_id"] or "unknown", "count": b["count"]} for b in back_result],
    }

@router.get("/analytics/quality")
async def analytics_quality(
    admin=Depends(require_admin),
    days: int = Query(30),
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
):
    start, end = build_date_filter(days, date_from, date_to)
    lead_filter = {"created_at": {"$gte": start, "$lte": end}}

    # Score distribution
    score_pipeline = [
        {"$match": {**lead_filter, "lead_score": {"$exists": True}}},
        {"$bucket": {"groupBy": "$lead_score", "boundaries": [0, 20, 40, 60, 80, 101], "default": "other", "output": {"count": {"$sum": 1}}}}
    ]
    try:
        score_result = await db.leads.aggregate(score_pipeline).to_list(10)
        score_dist = [{"range": f"{r['_id']}-{r['_id']+19}" if isinstance(r['_id'], int) else str(r['_id']), "count": r["count"]} for r in score_result]
    except Exception:
        score_dist = []

    # Intent bucket breakdown
    intent_pipeline = [
        {"$match": lead_filter},
        {"$group": {"_id": "$intent_bucket", "count": {"$sum": 1}, "avg_score": {"$avg": {"$ifNull": ["$lead_score", 0]}}}},
        {"$sort": {"count": -1}}
    ]
    intent_result = await db.leads.aggregate(intent_pipeline).to_list(10)

    # Quality by source
    quality_by_source_pipeline = [
        {"$match": {**lead_filter, "lead_score": {"$exists": True}}},
        {"$group": {"_id": {"$ifNull": ["$attribution.utm_source", "direct"]}, "count": {"$sum": 1}, "avg_score": {"$avg": "$lead_score"}, "high_intent": {"$sum": {"$cond": [{"$gte": ["$lead_score", 70]}, 1, 0]}}}},
        {"$sort": {"count": -1}},
        {"$limit": 15}
    ]
    quality_source_result = await db.leads.aggregate(quality_by_source_pipeline).to_list(15)

    # Quality flags frequency
    flags_pipeline = [
        {"$match": {**lead_filter, "quality_flags": {"$exists": True}}},
        {"$unwind": "$quality_flags"},
        {"$group": {"_id": "$quality_flags", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]
    flags_result = await db.leads.aggregate(flags_pipeline).to_list(20)

    return {
        "score_distribution": score_dist,
        "intent_breakdown": [{"bucket": i["_id"] or "unscored", "count": i["count"], "avg_score": round(i["avg_score"], 1)} for i in intent_result],
        "quality_by_source": [{"source": q["_id"], "count": q["count"], "avg_score": round(q["avg_score"], 1), "high_intent": q["high_intent"]} for q in quality_source_result],
        "quality_flags": [{"flag": f["_id"], "count": f["count"]} for f in flags_result],
    }

@router.get("/analytics/geo")
async def analytics_geo(
    admin=Depends(require_admin),
    days: int = Query(30),
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
):
    start, end = build_date_filter(days, date_from, date_to)
    ts_filter = {"server_timestamp": {"$gte": start, "$lte": end}}

    # Geo from events (enriched)
    country_pipeline = [
        {"$match": {**ts_filter, "geo.country": {"$exists": True, "$ne": "Unknown"}}},
        {"$group": {"_id": "$geo.country", "events": {"$sum": 1}, "sessions": {"$addToSet": "$session_id"}}},
        {"$sort": {"events": -1}},
        {"$limit": 20}
    ]
    country_result = await db.events.aggregate(country_pipeline).to_list(20)

    # City breakdown
    city_pipeline = [
        {"$match": {**ts_filter, "geo.city": {"$exists": True, "$ne": ""}}},
        {"$group": {"_id": {"city": "$geo.city", "region": "$geo.region", "country": "$geo.country"}, "events": {"$sum": 1}, "sessions": {"$addToSet": "$session_id"}}},
        {"$sort": {"events": -1}},
        {"$limit": 20}
    ]
    city_result = await db.events.aggregate(city_pipeline).to_list(20)

    # Timezone breakdown
    tz_pipeline = [
        {"$match": {**ts_filter, "geo.timezone": {"$exists": True, "$ne": ""}}},
        {"$group": {"_id": "$geo.timezone", "events": {"$sum": 1}}},
        {"$sort": {"events": -1}},
        {"$limit": 15}
    ]
    tz_result = await db.events.aggregate(tz_pipeline).to_list(15)

    # Geo from leads (attribution IP-based)
    lead_geo_pipeline = [
        {"$match": {"created_at": {"$gte": start, "$lte": end}, "attribution.country": {"$exists": True}}},
        {"$group": {"_id": "$attribution.country", "leads": {"$sum": 1}}},
        {"$sort": {"leads": -1}},
        {"$limit": 15}
    ]
    lead_geo_result = await db.leads.aggregate(lead_geo_pipeline).to_list(15)

    return {
        "countries": [{"country": c["_id"], "events": c["events"], "sessions": len(c["sessions"])} for c in country_result],
        "cities": [{"city": c["_id"]["city"], "region": c["_id"]["region"], "country": c["_id"]["country"], "events": c["events"], "sessions": len(c["sessions"])} for c in city_result],
        "timezones": [{"timezone": t["_id"], "events": t["events"]} for t in tz_result],
        "lead_geo": [{"country": lg["_id"], "leads": lg["leads"]} for lg in lead_geo_result],
    }

@router.get("/analytics/sources")
async def analytics_sources(
    admin=Depends(require_admin),
    days: int = Query(30),
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
):
    start, end = build_date_filter(days, date_from, date_to)
    lead_filter = {"created_at": {"$gte": start, "$lte": end}}

    # Source/Medium breakdown from leads
    source_pipeline = [
        {"$match": lead_filter},
        {"$group": {
            "_id": {"source": {"$ifNull": ["$attribution.utm_source", "direct"]}, "medium": {"$ifNull": ["$attribution.utm_medium", "(none)"]}},
            "count": {"$sum": 1},
            "avg_score": {"$avg": {"$ifNull": ["$lead_score", 0]}},
            "high_intent": {"$sum": {"$cond": [{"$gte": [{"$ifNull": ["$lead_score", 0]}, 70]}, 1, 0]}}
        }},
        {"$sort": {"count": -1}},
        {"$limit": 20}
    ]
    source_result = await db.leads.aggregate(source_pipeline).to_list(20)

    # Campaign breakdown
    campaign_pipeline = [
        {"$match": {**lead_filter, "attribution.utm_campaign": {"$exists": True, "$ne": ""}}},
        {"$group": {
            "_id": "$attribution.utm_campaign",
            "count": {"$sum": 1},
            "avg_score": {"$avg": {"$ifNull": ["$lead_score", 0]}}
        }},
        {"$sort": {"count": -1}},
        {"$limit": 15}
    ]
    campaign_result = await db.leads.aggregate(campaign_pipeline).to_list(15)

    # Referrer breakdown from events
    ts_filter = {"server_timestamp": {"$gte": start, "$lte": end}}
    referrer_pipeline = [
        {"$match": {**ts_filter, "attribution.referrer_url": {"$exists": True, "$ne": ""}}},
        {"$group": {"_id": "$attribution.referrer_url", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 10}
    ]
    referrer_result = await db.events.aggregate(referrer_pipeline).to_list(10)

    # Landing page breakdown from events
    landing_pipeline = [
        {"$match": {**ts_filter, "event_name": "tlj_session_start", "attribution.landing_url": {"$exists": True, "$ne": ""}}},
        {"$group": {"_id": "$attribution.landing_url", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 10}
    ]
    landing_result = await db.events.aggregate(landing_pipeline).to_list(10)

    return {
        "sources": [{"source": s["_id"]["source"], "medium": s["_id"]["medium"], "count": s["count"], "avg_score": round(s["avg_score"], 1), "high_intent": s["high_intent"]} for s in source_result],
        "campaigns": [{"campaign": c["_id"], "count": c["count"], "avg_score": round(c["avg_score"], 1)} for c in campaign_result],
        "referrers": [{"url": r["_id"], "count": r["count"]} for r in referrer_result],
        "landing_pages": [{"url": lp["_id"], "count": lp["count"]} for lp in landing_result],
    }

@router.get("/analytics/devices")
async def analytics_devices(
    admin=Depends(require_admin),
    days: int = Query(30),
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
):
    start, end = build_date_filter(days, date_from, date_to)
    ts_filter = {"server_timestamp": {"$gte": start, "$lte": end}}

    # Device type from enriched events
    device_pipeline = [
        {"$match": {**ts_filter, "ua_parsed.device": {"$exists": True}}},
        {"$group": {"_id": "$ua_parsed.device", "events": {"$sum": 1}, "sessions": {"$addToSet": "$session_id"}}},
        {"$sort": {"events": -1}}
    ]
    device_result = await db.events.aggregate(device_pipeline).to_list(10)

    # Browser breakdown
    browser_pipeline = [
        {"$match": {**ts_filter, "ua_parsed.browser": {"$exists": True}}},
        {"$group": {"_id": "$ua_parsed.browser", "events": {"$sum": 1}, "sessions": {"$addToSet": "$session_id"}}},
        {"$sort": {"events": -1}},
        {"$limit": 10}
    ]
    browser_result = await db.events.aggregate(browser_pipeline).to_list(10)

    # OS breakdown
    os_pipeline = [
        {"$match": {**ts_filter, "ua_parsed.os": {"$exists": True}}},
        {"$group": {"_id": "$ua_parsed.os", "events": {"$sum": 1}, "sessions": {"$addToSet": "$session_id"}}},
        {"$sort": {"events": -1}},
        {"$limit": 10}
    ]
    os_result = await db.events.aggregate(os_pipeline).to_list(10)

    # Viewport breakdown
    viewport_pipeline = [
        {"$match": {**ts_filter, "viewport": {"$exists": True, "$ne": ""}}},
        {"$group": {"_id": "$viewport", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 10}
    ]
    viewport_result = await db.events.aggregate(viewport_pipeline).to_list(10)

    return {
        "devices": [{"device": d["_id"] or "unknown", "events": d["events"], "sessions": len(d["sessions"])} for d in device_result],
        "browsers": [{"browser": b["_id"] or "unknown", "events": b["events"], "sessions": len(b["sessions"])} for b in browser_result],
        "os": [{"os": o["_id"] or "unknown", "events": o["events"], "sessions": len(o["sessions"])} for o in os_result],
        "viewports": [{"viewport": v["_id"], "count": v["count"]} for v in viewport_result],
    }

@router.get("/analytics/visitors")
async def analytics_visitors(
    admin=Depends(require_admin),
    days: int = Query(30),
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
):
    start, end = build_date_filter(days, date_from, date_to)
    ts_filter = {"server_timestamp": {"$gte": start, "$lte": end}}

    # New vs returning from events
    visitor_pipeline = [
        {"$match": {**ts_filter, "visitor_type": {"$exists": True, "$ne": "unknown"}}},
        {"$group": {"_id": "$visitor_type", "count": {"$sum": 1}, "sessions": {"$addToSet": "$session_id"}}},
    ]
    visitor_result = await db.events.aggregate(visitor_pipeline).to_list(10)
    visitor_types = {v["_id"]: {"events": v["count"], "sessions": len(v["sessions"])} for v in visitor_result}

    # Unique visitors over time
    unique_pipeline = [
        {"$match": {**ts_filter, "event_name": "tlj_session_start"}},
        {"$group": {
            "_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$server_timestamp"}},
            "unique_visitors": {"$addToSet": "$anonymous_id"},
            "total_sessions": {"$sum": 1}
        }},
        {"$sort": {"_id": 1}}
    ]
    unique_result = await db.events.aggregate(unique_pipeline).to_list(100)

    # Session depth (events per session)
    depth_pipeline = [
        {"$match": ts_filter},
        {"$group": {"_id": "$session_id", "event_count": {"$sum": 1}}},
        {"$bucket": {"groupBy": "$event_count", "boundaries": [1, 3, 6, 10, 20, 100], "default": "100+", "output": {"count": {"$sum": 1}}}}
    ]
    try:
        depth_result = await db.events.aggregate(depth_pipeline).to_list(10)
        session_depth = [{"range": f"{d['_id']}-{d['_id']+2}" if isinstance(d['_id'], int) else str(d['_id']), "count": d["count"]} for d in depth_result]
    except Exception:
        session_depth = []

    return {
        "visitor_types": visitor_types,
        "daily_visitors": [{"date": u["_id"], "unique": len(u["unique_visitors"]), "sessions": u["total_sessions"]} for u in unique_result],
        "session_depth": session_depth,
    }

@router.get("/analytics/events-health")
async def analytics_events_health(admin=Depends(require_admin)):
    """Event health: last seen, counts, stale warnings for all critical events."""
    critical_events = [
        "tlj_session_start", "tlj_landing_view", "tlj_wizard_start",
        "tlj_step_view", "tlj_step_complete", "tlj_step_back",
        "tlj_step_abandon", "tlj_value_reveal_view",
        "tlj_contact_submit_attempt", "tlj_lead_created",
        "tlj_field_focus", "tlj_field_error",
        "tlj_file_upload_start", "tlj_file_upload_success", "tlj_file_upload_fail",
    ]
    now = datetime.now(timezone.utc)
    stale_threshold = now - timedelta(hours=24)
    last_7d = now - timedelta(days=7)

    results = []
    for name in critical_events:
        last = await db.events.find_one({"event_name": name}, sort=[("server_timestamp", -1)])
        total = await db.events.count_documents({"event_name": name})
        last_7d_count = await db.events.count_documents({"event_name": name, "server_timestamp": {"$gte": last_7d}})
        
        last_seen = None
        is_stale = True
        if last and "server_timestamp" in last:
            ts = last["server_timestamp"]
            if isinstance(ts, datetime):
                # Ensure timezone-aware comparison
                if ts.tzinfo is None:
                    ts = ts.replace(tzinfo=timezone.utc)
                last_seen = ts.isoformat()
                is_stale = ts < stale_threshold
            else:
                last_seen = str(ts)
        
        results.append({
            "event": name,
            "total_count": total,
            "last_7d_count": last_7d_count,
            "last_seen": last_seen or "never",
            "is_stale": is_stale if total > 0 else None,
            "status": "healthy" if total > 0 and not is_stale else ("stale" if total > 0 and is_stale else "never_fired"),
        })

    return {"events": results, "checked_at": now.isoformat()}

@router.get("/analytics/lead-ops")
async def analytics_lead_ops(admin=Depends(require_admin)):
    """Lead operations: aging, uncontacted, priority queue."""
    now = datetime.now(timezone.utc)

    # Aging buckets
    aging_pipeline = [
        {"$match": {"status": {"$in": ["new", "contacted"]}}},
        {"$project": {
            "lead_id": 1, "first_name": 1, "status": 1, "lead_score": 1, "intent_bucket": 1,
            "product_type": 1, "created_at": 1,
            "age_hours": {"$divide": [{"$subtract": [now, "$created_at"]}, 3600000]}
        }},
        {"$sort": {"age_hours": -1}}
    ]
    aging_result = await db.leads.aggregate(aging_pipeline).to_list(100)

    # Bucket them
    buckets = {"critical_48h": [], "urgent_24h": [], "aging_12h": [], "fresh": []}
    for lead in aging_result:
        age = lead.get("age_hours", 0)
        entry = {
            "lead_id": lead.get("lead_id", ""),
            "first_name": lead.get("first_name", ""),
            "status": lead.get("status", "new"),
            "product_type": lead.get("product_type", ""),
            "lead_score": lead.get("lead_score", 0),
            "intent_bucket": lead.get("intent_bucket", ""),
            "age_hours": round(age, 1),
            "created_at": lead["created_at"].isoformat() if isinstance(lead.get("created_at"), datetime) else str(lead.get("created_at", "")),
        }
        if age >= 48:
            buckets["critical_48h"].append(entry)
        elif age >= 24:
            buckets["urgent_24h"].append(entry)
        elif age >= 12:
            buckets["aging_12h"].append(entry)
        else:
            buckets["fresh"].append(entry)

    # Uncontacted count
    uncontacted = await db.leads.count_documents({"status": "new"})

    # High-intent uncontacted
    high_intent_new = await db.leads.count_documents({"status": "new", "intent_bucket": "high"})

    return {
        "aging_buckets": buckets,
        "total_uncontacted": uncontacted,
        "high_intent_uncontacted": high_intent_new,
        "summary": {
            "critical": len(buckets["critical_48h"]),
            "urgent": len(buckets["urgent_24h"]),
            "aging": len(buckets["aging_12h"]),
            "fresh": len(buckets["fresh"]),
        }
    }

@router.get("/analytics/smart-insights")
async def analytics_smart_insights(
    admin=Depends(require_admin),
    days: int = Query(30),
):
    """Rules-based smart insights for founders."""
    start = datetime.now(timezone.utc) - timedelta(days=days)
    ts_filter = {"server_timestamp": {"$gte": start}}
    lead_filter = {"created_at": {"$gte": start}}
    insights = []

    # 1. Top drop-off step
    drop_pipeline = [
        {"$match": {**ts_filter, "event_name": "tlj_step_abandon"}},
        {"$group": {"_id": "$wizard_step", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 1}
    ]
    drop_result = await db.events.aggregate(drop_pipeline).to_list(1)
    if drop_result:
        insights.append({"type": "warning", "category": "funnel", "title": "Top Drop-off Step", "message": f"'{drop_result[0]['_id']}' has the most abandons ({drop_result[0]['count']}) in the last {days} days.", "metric": drop_result[0]["count"]})

    # 2. Slowest step
    slow_pipeline = [
        {"$match": {**ts_filter, "event_name": "tlj_step_complete", "step_time_ms": {"$exists": True, "$gt": 0}}},
        {"$group": {"_id": "$wizard_step", "avg_ms": {"$avg": "$step_time_ms"}}},
        {"$sort": {"avg_ms": -1}},
        {"$limit": 1}
    ]
    slow_result = await db.events.aggregate(slow_pipeline).to_list(1)
    if slow_result:
        secs = round(slow_result[0]["avg_ms"] / 1000, 1)
        insights.append({"type": "info", "category": "friction", "title": "Slowest Step", "message": f"'{slow_result[0]['_id']}' takes an average of {secs}s to complete.", "metric": secs})

    # 3. Best source by quality
    best_source_pipeline = [
        {"$match": {**lead_filter, "lead_score": {"$exists": True}}},
        {"$group": {"_id": {"$ifNull": ["$attribution.utm_source", "direct"]}, "avg_score": {"$avg": "$lead_score"}, "count": {"$sum": 1}}},
        {"$match": {"count": {"$gte": 2}}},
        {"$sort": {"avg_score": -1}},
        {"$limit": 1}
    ]
    best_source = await db.leads.aggregate(best_source_pipeline).to_list(1)
    if best_source:
        insights.append({"type": "success", "category": "attribution", "title": "Best Quality Source", "message": f"'{best_source[0]['_id']}' produces the highest quality leads (avg score: {round(best_source[0]['avg_score'], 1)}, {best_source[0]['count']} leads).", "metric": round(best_source[0]["avg_score"], 1)})

    # 4. Device with worst completion
    device_completion_pipeline = [
        {"$match": {**ts_filter, "event_name": {"$in": ["tlj_wizard_start", "tlj_lead_created"]}, "ua_parsed.device": {"$exists": True}}},
        {"$group": {"_id": {"device": "$ua_parsed.device", "event": "$event_name"}, "count": {"$sum": 1}}}
    ]
    device_comp = await db.events.aggregate(device_completion_pipeline).to_list(20)
    device_starts = {}
    device_completes = {}
    for dc in device_comp:
        dev = dc["_id"]["device"]
        if dc["_id"]["event"] == "tlj_wizard_start":
            device_starts[dev] = dc["count"]
        elif dc["_id"]["event"] == "tlj_lead_created":
            device_completes[dev] = dc["count"]
    worst_device = None
    worst_rate = 100
    for dev, starts in device_starts.items():
        if starts >= 3:
            completes = device_completes.get(dev, 0)
            rate = round((completes / starts) * 100, 1)
            if rate < worst_rate:
                worst_rate = rate
                worst_device = dev
    if worst_device:
        insights.append({"type": "warning", "category": "device", "title": "Worst Device Completion", "message": f"'{worst_device}' has the lowest completion rate ({worst_rate}%).", "metric": worst_rate})

    # 5. Uncontacted leads alert
    uncontacted = await db.leads.count_documents({"status": "new", "created_at": {"$lte": datetime.now(timezone.utc) - timedelta(hours=12)}})
    if uncontacted > 0:
        insights.append({"type": "critical", "category": "ops", "title": "Uncontacted Leads", "message": f"{uncontacted} leads have been waiting 12+ hours without contact.", "metric": uncontacted})

    # 6. Best hour for high-intent
    hour_pipeline = [
        {"$match": {**ts_filter, "event_name": "tlj_lead_created"}},
        {"$group": {"_id": {"$hour": "$server_timestamp"}, "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 1}
    ]
    hour_result = await db.events.aggregate(hour_pipeline).to_list(1)
    if hour_result:
        h = hour_result[0]["_id"]
        insights.append({"type": "info", "category": "trends", "title": "Peak Lead Hour", "message": f"{h}:00 UTC is when most leads submit ({hour_result[0]['count']} in {days}d).", "metric": hour_result[0]["count"]})

    return {"insights": insights, "period_days": days}

@router.get("/analytics/abandonment")
async def analytics_abandonment(admin=Depends(require_admin), days: int = Query(30)):
    """Legacy abandonment endpoint."""
    since = datetime.now(timezone.utc) - timedelta(days=days)
    pipeline = [{"$match": {"started_at": {"$gte": since}}}, {"$group": {"_id": "$current_step", "count": {"$sum": 1}}}, {"$sort": {"count": -1}}]
    result = await db.wizard_sessions.aggregate(pipeline).to_list(30)
    abandonment = [{"screen": r["_id"], "count": r["count"]} for r in result]
    total_started = await db.wizard_sessions.count_documents({"started_at": {"$gte": since}})
    total_completed = await db.leads.count_documents({"created_at": {"$gte": since}})
    rate = round((1 - total_completed / total_started) * 100, 1) if total_started > 0 else 0
    return {"abandonment_by_screen": abandonment, "total_started": total_started, "total_completed": total_completed, "abandonment_rate_pct": rate}

@router.get("/analytics/campaigns")
async def analytics_campaigns(admin=Depends(require_admin), days: int = Query(30)):
    since = datetime.now(timezone.utc) - timedelta(days=days)
    pipeline = [{"$match": {"created_at": {"$gte": since}, "attribution.utm_campaign": {"$exists": True, "$ne": ""}}}, {"$group": {"_id": {"campaign": "$attribution.utm_campaign", "content": {"$ifNull": ["$attribution.utm_content", ""]}}, "count": {"$sum": 1}}}, {"$sort": {"count": -1}}, {"$limit": 20}]
    result = await db.leads.aggregate(pipeline).to_list(20)
    campaigns = [{"campaign": r["_id"]["campaign"], "content": r["_id"]["content"], "count": r["count"]} for r in result]
    return {"campaigns": campaigns}

# ── Lead CRM ─────────────────────────────────────────────────

@router.get("/leads")
async def get_leads(admin=Depends(require_admin), page: int = Query(1, ge=1), limit: int = Query(25, le=100), status: Optional[str] = None, product_type: Optional[str] = None, budget: Optional[str] = None, source: Optional[str] = None, search: Optional[str] = None, date_from: Optional[str] = None, date_to: Optional[str] = None):
    query = {}
    if status:
        query["status"] = status
    if product_type:
        query["product_type"] = product_type
    if budget:
        query["budget"] = budget
    if source:
        query["attribution.utm_source"] = source
    if search:
        query["$or"] = [{"first_name": {"$regex": search, "$options": "i"}}, {"email": {"$regex": search, "$options": "i"}}, {"phone": {"$regex": search, "$options": "i"}}, {"lead_id": {"$regex": search, "$options": "i"}}]
    if date_from:
        try:
            query["created_at"] = {"$gte": datetime.fromisoformat(date_from.replace("Z", "+00:00"))}
        except Exception:
            pass
    if date_to:
        dt_to = query.get("created_at", {})
        try:
            dt_to["$lte"] = datetime.fromisoformat(date_to.replace("Z", "+00:00"))
        except Exception:
            pass
        if dt_to:
            query["created_at"] = dt_to

    total = await db.leads.count_documents(query)
    skip = (page - 1) * limit
    cursor = db.leads.find(query).sort("created_at", -1).skip(skip).limit(limit)
    leads = [serialize_doc(doc) async for doc in cursor]
    return {"leads": leads, "total": total, "page": page, "limit": limit, "pages": (total + limit - 1) // limit if limit > 0 else 0}

@router.get("/leads/export.csv")
async def export_leads_csv(admin=Depends(require_admin), status: Optional[str] = None, date_from: Optional[str] = None, date_to: Optional[str] = None):
    query = {}
    if status:
        query["status"] = status
    if date_from:
        try:
            query.setdefault("created_at", {})["$gte"] = datetime.fromisoformat(date_from.replace("Z", "+00:00"))
        except Exception:
            pass
    if date_to:
        try:
            query.setdefault("created_at", {})["$lte"] = datetime.fromisoformat(date_to.replace("Z", "+00:00"))
        except Exception:
            pass

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
    if not lead:
        raise HTTPException(404, "Lead not found")
    # Get quotes and notes
    quotes = [serialize_doc(q) async for q in db.quotes.find({"lead_id": lead_id}).sort("created_at", -1)]
    orders = [serialize_doc(o) async for o in db.orders.find({"lead_id": lead_id}).sort("created_at", -1)]
    return {"lead": serialize_doc(lead), "quotes": quotes, "orders": orders}

@router.patch("/leads/{lead_id}")
async def update_lead_status(lead_id: str, req: LeadStatusUpdate, admin=Depends(require_admin)):
    valid = ["new", "contacted", "quoted", "won", "lost"]
    if req.status not in valid:
        raise HTTPException(400, f"Status must be one of: {valid}")
    result = await db.leads.update_one({"lead_id": lead_id}, {"$set": {"status": req.status, "updated_at": datetime.now(timezone.utc)}})
    if result.matched_count == 0:
        raise HTTPException(404, "Lead not found")
    return {"status": "updated"}

@router.post("/leads/{lead_id}/notes")
async def add_lead_note(lead_id: str, req: NoteCreate, admin=Depends(require_admin)):
    note = {"text": req.text, "author": admin["email"], "created_at": datetime.now(timezone.utc)}
    result = await db.leads.update_one({"lead_id": lead_id}, {"$push": {"internal_notes": note}})
    if result.matched_count == 0:
        raise HTTPException(404, "Lead not found")
    return {"status": "added", "note": serialize_doc(note)}

@router.post("/leads/{lead_id}/comments")
async def add_admin_comment(lead_id: str, req: NoteCreate, admin=Depends(require_admin)):
    comment = {"text": req.text, "author": "The Local Jewel", "role": "admin", "created_at": datetime.now(timezone.utc)}
    result = await db.leads.update_one({"lead_id": lead_id}, {"$push": {"comments": comment}})
    if result.matched_count == 0:
        raise HTTPException(404, "Lead not found")
    return {"status": "added", "comment": serialize_doc(comment)}

from fastapi import UploadFile, File
import aiofiles as aiofiles_admin

UPLOAD_DIR_ADMIN = "/app/backend/uploads"

@router.post("/leads/{lead_id}/renders")
async def upload_cad_renders(lead_id: str, files: List[UploadFile] = File(...), admin=Depends(require_admin)):
    lead = await db.leads.find_one({"lead_id": lead_id})
    if not lead:
        raise HTTPException(404, "Lead not found")
    uploaded = []
    for file in files[:5]:
        ext = os.path.splitext(file.filename)[1] if file.filename else ".png"
        filename = f"cad_{uuid.uuid4().hex[:8]}{ext}"
        filepath = os.path.join(UPLOAD_DIR_ADMIN, filename)
        async with aiofiles_admin.open(filepath, "wb") as f:
            content = await file.read()
            await f.write(content)
        uploaded.append({"filename": filename, "original_name": file.filename, "url": f"/api/uploads/files/{filename}", "uploaded_at": datetime.now(timezone.utc).isoformat()})
    await db.leads.update_one({"lead_id": lead_id}, {"$push": {"cad_renders": {"$each": uploaded}}})
    return {"status": "uploaded", "files": uploaded}

@router.patch("/leads/{lead_id}/stage")
async def update_lead_stage(lead_id: str, req: dict, admin=Depends(require_admin)):
    stage = req.get("stage")
    valid_stages = ["design_quotation", "in_production", "shipped", "delivered"]
    if stage not in valid_stages:
        raise HTTPException(400, f"Stage must be one of: {valid_stages}")
    update = {"order_stage": stage, "updated_at": datetime.now(timezone.utc)}
    if stage == "shipped":
        if req.get("tracking_number"):
            update["tracking_number"] = req["tracking_number"]
        if req.get("shipping_provider"):
            update["shipping_provider"] = req["shipping_provider"]
    result = await db.leads.update_one({"lead_id": lead_id}, {"$set": update})
    if result.matched_count == 0:
        raise HTTPException(404, "Lead not found")
    return {"status": "updated"}

# ── Quotation Management ─────────────────────────────────────

@router.post("/leads/{lead_id}/quotes")
async def create_quote(lead_id: str, req: QuoteCreate, admin=Depends(require_admin)):
    lead = await db.leads.find_one({"lead_id": lead_id})
    if not lead:
        raise HTTPException(404, "Lead not found")
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
    if req.status not in valid:
        raise HTTPException(400, f"Status must be one of: {valid}")
    update = {"status": req.status, "updated_at": datetime.now(timezone.utc)}
    if req.status == "sent":
        update["sent_at"] = datetime.now(timezone.utc)
    elif req.status == "viewed":
        update["viewed_at"] = datetime.now(timezone.utc)
    elif req.status == "accepted":
        update["accepted_at"] = datetime.now(timezone.utc)
    result = await db.quotes.update_one({"quote_id": quote_id}, {"$set": update})
    if result.matched_count == 0:
        raise HTTPException(404, "Quote not found")
    return {"status": "updated"}

# ── Order Management ─────────────────────────────────────────

@router.post("/orders")
async def create_order(req: OrderCreate, admin=Depends(require_admin)):
    quote = await db.quotes.find_one({"quote_id": req.quote_id})
    if not quote:
        raise HTTPException(404, "Quote not found")
    order = {"order_id": f"ord_{uuid.uuid4().hex[:10]}", "lead_id": quote["lead_id"], "quote_id": req.quote_id, "notes": req.notes, "status": "processing", "tracking_number": "", "shipping_provider": "", "shipping_url": "", "created_at": datetime.now(timezone.utc), "updated_at": datetime.now(timezone.utc)}
    await db.orders.insert_one(order)
    # Update lead + quote
    await db.leads.update_one({"lead_id": quote["lead_id"]}, {"$set": {"status": "won", "updated_at": datetime.now(timezone.utc)}})
    await db.quotes.update_one({"quote_id": req.quote_id}, {"$set": {"status": "accepted", "updated_at": datetime.now(timezone.utc)}})
    return serialize_doc(order)

@router.get("/orders")
async def get_orders(admin=Depends(require_admin), page: int = Query(1, ge=1), limit: int = Query(25, le=100), status: Optional[str] = None):
    query = {}
    if status:
        query["status"] = status
    total = await db.orders.count_documents(query)
    skip = (page - 1) * limit
    cursor = db.orders.find(query).sort("created_at", -1).skip(skip).limit(limit)
    orders = [serialize_doc(o) async for o in cursor]
    return {"orders": orders, "total": total, "page": page, "limit": limit}

@router.get("/orders/{order_id}")
async def get_order(order_id: str, admin=Depends(require_admin)):
    order = await db.orders.find_one({"order_id": order_id})
    if not order:
        raise HTTPException(404, "Order not found")
    return serialize_doc(order)

@router.patch("/orders/{order_id}")
async def update_order(order_id: str, req: OrderUpdate, admin=Depends(require_admin)):
    update = {"updated_at": datetime.now(timezone.utc)}
    if req.status:
        valid = ["processing", "in_production", "shipped", "delivered"]
        if req.status not in valid:
            raise HTTPException(400, f"Status must be one of: {valid}")
        update["status"] = req.status
    if req.tracking_number is not None:
        update["tracking_number"] = req.tracking_number
    if req.shipping_provider is not None:
        update["shipping_provider"] = req.shipping_provider
    if req.shipping_url is not None:
        update["shipping_url"] = req.shipping_url
    result = await db.orders.update_one({"order_id": order_id}, {"$set": update})
    if result.matched_count == 0:
        raise HTTPException(404, "Order not found")
    return {"status": "updated"}

# ── Settings ─────────────────────────────────────────────────

async def get_settings_doc():
    doc = await db.settings.find_one({"_type": "site_settings"})
    if not doc:
        doc = {"_type": "site_settings", "phone_number": "+15857108292", "whatsapp_link": "https://wa.me/15857108292", "live_chat_enabled": False, "gia_logo_visible": True, "igi_logo_visible": True, "reviews_count": "70+", "customers_count": "100+", "avg_savings": "$5,000", "email_notify_new_lead": True, "email_notify_quote": True}
        await db.settings.insert_one(doc)
    return serialize_doc(doc)

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
    return serialize_doc(doc)

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


# ── A/B Test Management ─────────────────────────────────────────

async def get_abtest_doc():
    doc = await db.settings.find_one({"_type": "abtest_settings"})
    if not doc:
        doc = {"_type": "abtest_settings", "lead_capture_mode": "auto", "variant_a_weight": 50}
        await db.settings.insert_one(doc)
    return serialize_doc(doc)

@router.get("/abtest")
async def get_abtest(admin=Depends(require_admin)):
    doc = await get_abtest_doc()
    return serialize_doc(doc)

@router.patch("/abtest")
async def update_abtest(req: dict, admin=Depends(require_admin)):
    await get_abtest_doc()
    update = {}
    if "lead_capture_mode" in req and req["lead_capture_mode"] in ["auto", "variant_a", "variant_b"]:
        update["lead_capture_mode"] = req["lead_capture_mode"]
    if "variant_a_weight" in req:
        update["variant_a_weight"] = max(0, min(100, int(req["variant_a_weight"])))
    if update:
        await db.settings.update_one({"_type": "abtest_settings"}, {"$set": update})
    return serialize_doc(await get_abtest_doc())

@router.get("/abtest/results")
async def get_abtest_results(admin=Depends(require_admin)):
    # Count variant assignments
    variant_a_shown = await db.events.count_documents({"event_name": "tlj_ab_variant_shown", "event_data.variant": "A"})
    variant_b_shown = await db.events.count_documents({"event_name": "tlj_ab_variant_shown", "event_data.variant": "B"})
    # Count completions
    variant_a_completed = await db.events.count_documents({"event_name": "tlj_ab_form_completed", "event_data.variant": "A"})
    variant_b_completed = await db.events.count_documents({"event_name": "tlj_ab_form_completed", "event_data.variant": "B"})
    # Avg time to submit
    pipeline_a = [{"$match": {"event_name": "tlj_ab_form_completed", "event_data.variant": "A", "event_data.time_to_submit_ms": {"$exists": True}}}, {"$group": {"_id": None, "avg_ms": {"$avg": "$event_data.time_to_submit_ms"}}}]
    pipeline_b = [{"$match": {"event_name": "tlj_ab_form_completed", "event_data.variant": "B", "event_data.time_to_submit_ms": {"$exists": True}}}, {"$group": {"_id": None, "avg_ms": {"$avg": "$event_data.time_to_submit_ms"}}}]
    avg_a = await db.events.aggregate(pipeline_a).to_list(1)
    avg_b = await db.events.aggregate(pipeline_b).to_list(1)
    
    rate_a = round((variant_a_completed / variant_a_shown) * 100, 1) if variant_a_shown > 0 else 0
    rate_b = round((variant_b_completed / variant_b_shown) * 100, 1) if variant_b_shown > 0 else 0
    
    return {
        "variant_a": {"shown": variant_a_shown, "completed": variant_a_completed, "conversion_rate": rate_a, "avg_time_to_submit_sec": round(avg_a[0]["avg_ms"] / 1000, 1) if avg_a and avg_a[0].get("avg_ms") else 0},
        "variant_b": {"shown": variant_b_shown, "completed": variant_b_completed, "conversion_rate": rate_b, "avg_time_to_submit_sec": round(avg_b[0]["avg_ms"] / 1000, 1) if avg_b and avg_b[0].get("avg_ms") else 0},
    }


# ── Showcase Pairs (Render → Product) ────────────────────────

@router.get("/showcase-pairs")
async def get_showcase_pairs(admin=Depends(require_admin)):
    """Get all showcase pairs for admin management."""
    pairs = await db.showcase_pairs.find().sort("order", 1).to_list(100)
    for p in pairs:
        p["_id"] = str(p["_id"])
    return {"pairs": pairs}

@router.post("/showcase-pairs")
async def create_showcase_pair(
    admin=Depends(require_admin),
    title: str = "",
    render_storage_path: str = "",
    render_original_name: str = "",
    render_content_type: str = "image/jpeg",
    product_storage_path: str = "",
    product_original_name: str = "",
    product_content_type: str = "image/jpeg",
):
    """Create a new showcase pair from already-uploaded images."""
    pair_id = f"pair_{uuid.uuid4().hex[:12]}"
    count = await db.showcase_pairs.count_documents({})
    doc = {
        "pair_id": pair_id,
        "title": title,
        "order": count,
        "render_image": {
            "storage_path": render_storage_path,
            "original_name": render_original_name,
            "content_type": render_content_type,
            "url": f"/api/uploads/cloud/{render_storage_path}",
        },
        "product_image": {
            "storage_path": product_storage_path,
            "original_name": product_original_name,
            "content_type": product_content_type,
            "url": f"/api/uploads/cloud/{product_storage_path}",
        },
        "created_at": datetime.now(timezone.utc),
    }
    await db.showcase_pairs.insert_one(doc)
    return serialize_doc(doc)

@router.delete("/showcase-pairs/{pair_id}")
async def delete_showcase_pair(pair_id: str, admin=Depends(require_admin)):
    result = await db.showcase_pairs.delete_one({"pair_id": pair_id})
    if result.deleted_count == 0:
        raise HTTPException(404, "Pair not found")
    return {"status": "deleted"}


# ── Projects (Past Custom Work CMS) ───────────────────────────

from pydantic import Field as _Field

class ProjectSpec(BaseModel):
    carat: Optional[str] = ""
    shape: Optional[str] = ""
    setting_style: Optional[str] = ""
    metal: Optional[str] = ""
    color: Optional[str] = ""
    clarity: Optional[str] = ""
    certification: Optional[str] = ""
    cert_number: Optional[str] = ""
    cert_link: Optional[str] = ""

class ProjectMediaItem(BaseModel):
    url: str
    media_type: str = "image"   # 'image' | 'video'
    caption: Optional[str] = ""

class ProjectJourneyStep(BaseModel):
    label: str
    description: Optional[str] = ""
    image_url: Optional[str] = ""           # kept for back-compat (single image)
    media: List[ProjectMediaItem] = []      # NEW — multi-media (images + videos)

class ProjectGalleryImage(BaseModel):
    url: str
    caption: Optional[str] = ""
    type: Optional[str] = "final"           # render | final | journey
    media_type: Optional[str] = "image"     # NEW — 'image' | 'video'

class ProjectCustomerStory(BaseModel):
    name: Optional[str] = ""
    location: Optional[str] = ""
    quote: Optional[str] = ""
    date: Optional[str] = ""

class ProjectPayload(BaseModel):
    slug: str
    title: str
    subtitle: Optional[str] = ""
    hero_image_url: str = ""
    gallery: List[ProjectGalleryImage] = []
    specs: ProjectSpec = _Field(default_factory=ProjectSpec)
    journey: List[ProjectJourneyStep] = []
    customer_story: Optional[ProjectCustomerStory] = None
    tags: List[str] = []
    description: str = ""
    meta_title: Optional[str] = ""
    meta_description: Optional[str] = ""
    seo_phrases: List[str] = []
    published: bool = True
    featured: bool = False
    position: int = 0
    # Pricing — optional
    price: Optional[float] = None
    price_prefix: Optional[str] = "Starting at"  # "Starting at", "From", or "" for none
    price_currency: Optional[str] = "USD"

def _project_public_view(doc: dict) -> dict:
    """Strip _id, format dates, return JSON-safe dict."""
    if not doc:
        return None
    out = {k: v for k, v in doc.items() if k != "_id"}
    for k, v in out.items():
        if isinstance(v, datetime):
            out[k] = v.isoformat()
    return out

@router.get("/projects")
async def admin_list_projects(admin=Depends(require_admin)):
    cursor = db.projects.find({}, {"_id": 0}).sort([("position", 1), ("created_at", -1)])
    items = [_project_public_view(doc) async for doc in cursor]
    return {"projects": items}

@router.get("/projects/{project_id}")
async def admin_get_project(project_id: str, admin=Depends(require_admin)):
    doc = await db.projects.find_one({"project_id": project_id}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Project not found")
    return _project_public_view(doc)

@router.post("/projects")
async def admin_create_project(req: ProjectPayload, admin=Depends(require_admin)):
    # Ensure unique slug
    existing = await db.projects.find_one({"slug": req.slug})
    if existing:
        raise HTTPException(400, "A project with this slug already exists")
    now = datetime.now(timezone.utc)
    doc = req.dict()
    doc["project_id"] = f"proj_{uuid.uuid4().hex[:12]}"
    doc["created_at"] = now
    doc["updated_at"] = now
    await db.projects.insert_one(doc)
    await _regen_sitemap_safe()
    return _project_public_view({k: v for k, v in doc.items() if k != "_id"})

@router.put("/projects/{project_id}")
async def admin_update_project(project_id: str, req: ProjectPayload, admin=Depends(require_admin)):
    existing = await db.projects.find_one({"project_id": project_id})
    if not existing:
        raise HTTPException(404, "Project not found")
    # If slug changed, ensure unique
    if req.slug != existing.get("slug"):
        clash = await db.projects.find_one({"slug": req.slug, "project_id": {"$ne": project_id}})
        if clash:
            raise HTTPException(400, "A project with this slug already exists")
    update = req.dict()
    update["updated_at"] = datetime.now(timezone.utc)
    await db.projects.update_one({"project_id": project_id}, {"$set": update})
    doc = await db.projects.find_one({"project_id": project_id}, {"_id": 0})
    await _regen_sitemap_safe()
    return _project_public_view(doc)

@router.delete("/projects/{project_id}")
async def admin_delete_project(project_id: str, admin=Depends(require_admin)):
    result = await db.projects.delete_one({"project_id": project_id})
    if result.deleted_count == 0:
        raise HTTPException(404, "Project not found")
    await _regen_sitemap_safe()
    return {"status": "deleted"}


async def _regen_sitemap_safe():
    """Best-effort static sitemap regen after a project mutation. Imported lazily to
    avoid circular import with server.py at module load."""
    try:
        from server import regenerate_static_sitemap
        await regenerate_static_sitemap()
    except Exception as e:
        import logging
        logging.getLogger(__name__).error(f"sitemap regen after project change failed: {e}")


# ── Admin: Projects Automation API Key (rotation) ───────────────────────

import secrets as _secrets

def _mask_api_key(key: str) -> str:
    if not key or len(key) < 12:
        return "—"
    return key[:8] + "•" * 12 + key[-4:]

@router.get("/api-keys/projects")
async def admin_get_projects_api_key(admin=Depends(require_admin)):
    """Return masked key + metadata. Full key is never re-shown after rotation."""
    doc = await db.settings.find_one({"key": "projects_api_key"}, {"_id": 0})
    env_key = os.environ.get("PROJECTS_API_KEY", "")
    if not doc:
        # No DB-stored key yet — show env-var as the active one (if any)
        return {
            "configured": bool(env_key),
            "source": "env" if env_key else "none",
            "masked": _mask_api_key(env_key) if env_key else "—",
            "created_at": None,
            "rotated_at": None,
        }
    return {
        "configured": True,
        "source": "db",
        "masked": _mask_api_key(doc.get("value", "")),
        "created_at": doc.get("created_at").isoformat() if doc.get("created_at") else None,
        "rotated_at": doc.get("rotated_at").isoformat() if doc.get("rotated_at") else None,
    }

@router.post("/api-keys/projects/rotate")
async def admin_rotate_projects_api_key(admin=Depends(require_admin)):
    """Generate a new key. Returns the FULL key ONCE — store it immediately on the client side."""
    new_key = "tlj_" + _secrets.token_urlsafe(32)
    now = datetime.now(timezone.utc)
    existing = await db.settings.find_one({"key": "projects_api_key"})
    if existing:
        await db.settings.update_one(
            {"key": "projects_api_key"},
            {"$set": {"value": new_key, "rotated_at": now}},
        )
        created_at = existing.get("created_at", now)
    else:
        await db.settings.insert_one({
            "key": "projects_api_key",
            "value": new_key,
            "created_at": now,
            "rotated_at": now,
        })
        created_at = now
    return {
        "full_key": new_key,  # shown ONCE — UI must surface "copy now, can't be retrieved again"
        "masked": _mask_api_key(new_key),
        "created_at": created_at.isoformat() if isinstance(created_at, datetime) else None,
        "rotated_at": now.isoformat(),
        "warning": "Save this key now — it cannot be retrieved again after you close this view.",
    }

@router.delete("/api-keys/projects")
async def admin_revoke_projects_api_key(admin=Depends(require_admin)):
    """Revoke the DB-stored key (env fallback still works if present)."""
    await db.settings.delete_one({"key": "projects_api_key"})
    return {"status": "revoked"}


# ── Blog Automation API key (same pattern as projects) ────────

@router.get("/api-keys/blog")
async def admin_get_blog_api_key(admin=Depends(require_admin)):
    doc = await db.settings.find_one({"key": "blog_api_key"}, {"_id": 0})
    env_key = os.environ.get("BLOG_API_KEY", "")
    if not doc:
        return {
            "configured": bool(env_key),
            "source": "env" if env_key else "none",
            "masked": _mask_api_key(env_key) if env_key else "—",
            "created_at": None,
            "rotated_at": None,
        }
    return {
        "configured": True,
        "source": "db",
        "masked": _mask_api_key(doc.get("value", "")),
        "created_at": doc.get("created_at").isoformat() if doc.get("created_at") else None,
        "rotated_at": doc.get("rotated_at").isoformat() if doc.get("rotated_at") else None,
    }

@router.post("/api-keys/blog/rotate")
async def admin_rotate_blog_api_key(admin=Depends(require_admin)):
    new_key = "tljb_" + _secrets.token_urlsafe(32)
    now = datetime.now(timezone.utc)
    existing = await db.settings.find_one({"key": "blog_api_key"})
    if existing:
        await db.settings.update_one(
            {"key": "blog_api_key"},
            {"$set": {"value": new_key, "rotated_at": now}},
        )
        created_at = existing.get("created_at", now)
    else:
        await db.settings.insert_one({
            "key": "blog_api_key",
            "value": new_key,
            "created_at": now,
            "rotated_at": now,
        })
        created_at = now
    return {
        "full_key": new_key,
        "masked": _mask_api_key(new_key),
        "created_at": created_at.isoformat() if isinstance(created_at, datetime) else None,
        "rotated_at": now.isoformat(),
        "warning": "Save this key now — it cannot be retrieved again after you close this view.",
    }

@router.delete("/api-keys/blog")
async def admin_revoke_blog_api_key(admin=Depends(require_admin)):
    await db.settings.delete_one({"key": "blog_api_key"})
    return {"status": "revoked"}


# ── Admin: Blog CMS ──────────────────────────────────────────

class BlogPayload(BaseModel):
    slug: str
    title: str
    subtitle: Optional[str] = ""
    excerpt: Optional[str] = ""
    hero_image_url: Optional[str] = ""
    content_html: str = ""        # TipTap-generated HTML
    category: Optional[str] = ""
    tags: List[str] = []
    author_name: Optional[str] = "The Local Jewel"
    meta_title: Optional[str] = ""
    meta_description: Optional[str] = ""
    published: bool = False
    featured: bool = False
    position: int = 0

def _blog_public_view(doc: dict) -> dict:
    if not doc:
        return None
    out = {k: v for k, v in doc.items() if k != "_id"}
    for k, v in out.items():
        if isinstance(v, datetime):
            out[k] = v.isoformat()
    return out

@router.get("/blog")
async def admin_list_blog(admin=Depends(require_admin)):
    cursor = db.blog_posts.find({}, {"_id": 0}).sort([("position", 1), ("published_at", -1), ("created_at", -1)])
    items = [_blog_public_view(doc) async for doc in cursor]
    return {"posts": items}

@router.get("/blog/{post_id}")
async def admin_get_blog(post_id: str, admin=Depends(require_admin)):
    doc = await db.blog_posts.find_one({"post_id": post_id}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Post not found")
    return _blog_public_view(doc)

@router.post("/blog")
async def admin_create_blog(req: BlogPayload, admin=Depends(require_admin)):
    existing = await db.blog_posts.find_one({"slug": req.slug})
    if existing:
        raise HTTPException(400, "A post with this slug already exists")
    now = datetime.now(timezone.utc)
    doc = req.dict()
    doc["post_id"] = f"post_{uuid.uuid4().hex[:12]}"
    doc["created_at"] = now
    doc["updated_at"] = now
    if req.published:
        doc["published_at"] = now
    await db.blog_posts.insert_one(doc)
    await _regen_sitemap_safe()
    return _blog_public_view({k: v for k, v in doc.items() if k != "_id"})

@router.put("/blog/{post_id}")
async def admin_update_blog(post_id: str, req: BlogPayload, admin=Depends(require_admin)):
    existing = await db.blog_posts.find_one({"post_id": post_id})
    if not existing:
        raise HTTPException(404, "Post not found")
    if req.slug != existing.get("slug"):
        clash = await db.blog_posts.find_one({"slug": req.slug, "post_id": {"$ne": post_id}})
        if clash:
            raise HTTPException(400, "A post with this slug already exists")
    update = req.dict()
    update["updated_at"] = datetime.now(timezone.utc)
    # Stamp published_at on the transition from draft → published
    if req.published and not existing.get("published_at"):
        update["published_at"] = update["updated_at"]
    await db.blog_posts.update_one({"post_id": post_id}, {"$set": update})
    doc = await db.blog_posts.find_one({"post_id": post_id}, {"_id": 0})
    await _regen_sitemap_safe()
    return _blog_public_view(doc)

@router.delete("/blog/{post_id}")
async def admin_delete_blog(post_id: str, admin=Depends(require_admin)):
    result = await db.blog_posts.delete_one({"post_id": post_id})
    if result.deleted_count == 0:
        raise HTTPException(404, "Post not found")
    await _regen_sitemap_safe()
    return {"status": "deleted"}


# ── Admin: Message Threads (marketplace-style inquiries) ──────

class ThreadReply(BaseModel):
    text: str

def _thread_public_view(doc: dict) -> dict:
    if not doc:
        return None
    out = {k: v for k, v in doc.items() if k != "_id"}
    for k, v in out.items():
        if isinstance(v, datetime):
            out[k] = v.isoformat()
        elif isinstance(v, list):
            out[k] = [
                (
                    {kk: (vv.isoformat() if isinstance(vv, datetime) else vv) for kk, vv in m.items()}
                    if isinstance(m, dict) else m
                )
                for m in v
            ]
    return out

@router.get("/threads")
async def admin_list_threads(admin=Depends(require_admin), q: Optional[str] = None, status: Optional[str] = None):
    query = {}
    if status:
        query["status"] = status
    if q:
        query["$or"] = [
            {"user_email": {"$regex": q, "$options": "i"}},
            {"user_phone": {"$regex": q, "$options": "i"}},
            {"user_name": {"$regex": q, "$options": "i"}},
            {"project_title": {"$regex": q, "$options": "i"}},
        ]
    cursor = db.message_threads.find(query, {"_id": 0}).sort("updated_at", -1).limit(200)
    threads = [_thread_public_view(doc) async for doc in cursor]
    return {"threads": threads, "total": len(threads)}

@router.get("/threads/{thread_id}")
async def admin_get_thread(thread_id: str, admin=Depends(require_admin)):
    doc = await db.message_threads.find_one({"thread_id": thread_id}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Thread not found")
    # Mark all customer messages as read by admin
    await db.message_threads.update_one(
        {"thread_id": thread_id},
        {"$set": {"admin_unread_count": 0, "admin_last_read_at": datetime.now(timezone.utc)}}
    )
    doc["admin_unread_count"] = 0
    return _thread_public_view(doc)

@router.post("/threads/{thread_id}/reply")
async def admin_reply_thread(thread_id: str, req: ThreadReply, admin=Depends(require_admin)):
    text = req.text.strip()
    if not text:
        raise HTTPException(400, "Message is empty")
    thread = await db.message_threads.find_one({"thread_id": thread_id})
    if not thread:
        raise HTTPException(404, "Thread not found")
    now = datetime.now(timezone.utc)
    msg = {"sender": "admin", "text": text, "author_name": admin.get("email", "Admin"), "created_at": now}
    await db.message_threads.update_one(
        {"thread_id": thread_id},
        {
            "$push": {"messages": msg},
            "$inc": {"user_unread_count": 1},
            "$set": {"updated_at": now, "status": "active"},
        }
    )
    # Best-effort notify customer via email + SMS (non-blocking)
    try:
        from server import sg_client, SENDGRID_FROM_EMAIL, twilio_client, TWILIO_PHONE
        from sendgrid.helpers.mail import Mail as SGMail
        proj_title = thread.get("project_title", "your inquiry")
        if sg_client and thread.get("user_email"):
            try:
                em = SGMail(
                    from_email=SENDGRID_FROM_EMAIL,
                    to_emails=thread["user_email"],
                    subject=f"The Local Jewel replied about {proj_title}",
                    html_content=f"""
                    <div style='font-family: -apple-system, sans-serif; max-width: 520px; margin: 0 auto; padding: 28px 20px;'>
                        <h2 style='color:#0F5E4C; font-size:20px; margin:0 0 14px;'>You have a new message</h2>
                        <p style='font-size:14px; color:#374151; margin:0 0 14px;'>Re: <strong>{proj_title}</strong></p>
                        <div style='padding:14px 16px; background:#F5F5F3; border-radius:10px; color:#1A1A1C; font-size:14px; line-height:1.5;'>{text}</div>
                        <p style='font-size:13px; color:#6B7280; margin-top:18px;'>
                            Reply by visiting your <a href='https://thelocaljewel.com/dashboard' style='color:#0F5E4C;'>dashboard</a>.
                        </p>
                    </div>
                    """,
                )
                sg_client.send(em)
            except Exception as e:
                import logging
                logging.getLogger(__name__).warning(f"thread email failed: {e}")
        if twilio_client and thread.get("user_phone") and TWILIO_PHONE:
            try:
                sms_preview = text[:120] + ("..." if len(text) > 120 else "")
                twilio_client.messages.create(
                    body=f"The Local Jewel replied: {sms_preview}\nView at thelocaljewel.com/dashboard",
                    from_=TWILIO_PHONE,
                    to=thread["user_phone"],
                )
            except Exception as e:
                import logging
                logging.getLogger(__name__).warning(f"thread SMS failed: {e}")
    except Exception as e:
        import logging
        logging.getLogger(__name__).warning(f"thread notify import failed: {e}")
    return {"status": "sent", "message": {**msg, "created_at": now.isoformat()}}

@router.patch("/threads/{thread_id}")
async def admin_update_thread(thread_id: str, payload: dict, admin=Depends(require_admin)):
    """Update thread status (active/closed/spam) or add admin notes."""
    allowed = {k: v for k, v in payload.items() if k in {"status", "admin_notes"}}
    if not allowed:
        raise HTTPException(400, "Nothing to update")
    allowed["updated_at"] = datetime.now(timezone.utc)
    await db.message_threads.update_one({"thread_id": thread_id}, {"$set": allowed})
    doc = await db.message_threads.find_one({"thread_id": thread_id}, {"_id": 0})
    return _thread_public_view(doc)


# ── Admin: Contact form submissions ───────────────────────────

@router.get("/contact-submissions")
async def admin_list_contact_submissions(admin=Depends(require_admin)):
    cursor = db.contact_submissions.find({}, {"_id": 0}).sort("created_at", -1).limit(200)
    items = []
    async for doc in cursor:
        out = {k: v for k, v in doc.items()}
        for k, v in out.items():
            if isinstance(v, datetime):
                out[k] = v.isoformat()
        items.append(out)
    return {"submissions": items, "total": len(items)}

