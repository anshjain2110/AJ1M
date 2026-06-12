"""Session 11 extras — coverage requested in the review:
- OTP rate-limit returns 429 on immediate second request
- /api/checkout/status/{session_id} returns an `order` payload for a paid order
- PATCH /api/admin/settings persists business/product fields (admin JWT)
- GET /api/admin/shop-orders/{order_id}/invoice with admin JWT returns a PDF
"""
import os
import uuid
import asyncio
from datetime import datetime, timezone

import httpx
import pytest
from dotenv import load_dotenv

load_dotenv("/app/backend/.env")

BASE = "http://localhost:8001"
ADMIN_EMAIL = "ansh@thelocaljewel.com"
ADMIN_PASS = "Rakesh@2709"


@pytest.fixture(scope="module")
def client():
    with httpx.Client(base_url=BASE, timeout=30) as c:
        yield c


@pytest.fixture(scope="module")
def admin_headers(client):
    r = client.post("/api/admin/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASS})
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['token']}"}


# --- OTP rate limit ---
def test_otp_rate_limit_immediate_second_request(client):
    identifier = f"pytest.rl.{uuid.uuid4().hex[:8]}@example.com"
    r1 = client.post("/api/auth/request-otp", json={"identifier": identifier})
    assert r1.status_code == 200 and r1.json().get("otp")
    r2 = client.post("/api/auth/request-otp", json={"identifier": identifier})
    assert r2.status_code == 429, f"expected 429, got {r2.status_code} {r2.text}"


# --- Admin settings PATCH persistence ---
def test_admin_settings_patch_persists(client, admin_headers):
    new_ships = f"TEST Winter Park, Florida {uuid.uuid4().hex[:4]}"
    new_business = f"TEST Local Jewel {uuid.uuid4().hex[:4]}"
    payload = {"ships_from": new_ships, "business_name": new_business, "lead_time": "TEST 3-5 weeks"}
    r = client.patch("/api/admin/settings", json=payload, headers=admin_headers)
    assert r.status_code == 200, r.text
    # Verify via public settings
    rp = client.get("/api/admin/settings/public")
    assert rp.status_code == 200
    d = rp.json()
    assert d.get("ships_from") == new_ships
    assert d.get("lead_time") == "TEST 3-5 weeks"
    # Restore reasonable defaults
    client.patch("/api/admin/settings", json={
        "ships_from": "Winter Park, Florida",
        "business_name": "The Local Jewel",
        "lead_time": "3-4 weeks",
    }, headers=admin_headers)


# --- Seed a paid order, then test checkout/status + admin invoice ---
@pytest.fixture(scope="module")
def seeded_order():
    from motor.motor_asyncio import AsyncIOMotorClient

    async def run():
        db = AsyncIOMotorClient(os.environ["MONGO_URL"])[os.environ["DB_NAME"]]
        session_id = f"pytest_sess_{uuid.uuid4().hex[:10]}"
        order_id = f"so_pytest{uuid.uuid4().hex[:8]}"
        order = {
            "order_id": order_id,
            "invoice_number": "INV-2026-8888",
            "session_id": session_id,
            "email": f"pytest.buyer.{uuid.uuid4().hex[:6]}@example.com",
            "items": [{"slug": "x", "title": "Test Solitaire", "image": "https://example.com/x.jpg",
                       "qty": 1, "unit": 2500.0,
                       "metal": "14K Yellow Gold", "metal_tier": "14k", "metal_color": "Yellow",
                       "carat": "1.5", "size": ""}],
            "amount": 2500.0, "currency": "usd", "status": "paid",
            "fulfillment_status": "processing", "created_at": datetime.now(timezone.utc),
        }
        await db.shop_orders.insert_one(order)
        # Match payment_transactions doc that /api/checkout/status reads
        await db.payment_transactions.insert_one({
            "session_id": session_id,
            "amount": 2500.0,
            "currency": "usd",
            "payment_status": "paid",
            "status": "complete",
            "metadata": {"email": order["email"]},
            "created_at": datetime.now(timezone.utc),
        })
        return order_id, session_id

    order_id, session_id = asyncio.run(run())
    yield {"order_id": order_id, "session_id": session_id}

    async def teardown():
        db = AsyncIOMotorClient(os.environ["MONGO_URL"])[os.environ["DB_NAME"]]
        await db.shop_orders.delete_many({"order_id": {"$regex": "^so_pytest"}})
        await db.payment_transactions.delete_many({"session_id": {"$regex": "^pytest_sess_"}})

    asyncio.run(teardown())


def test_checkout_status_includes_order(client, seeded_order):
    r = client.get(f"/api/checkout/status/{seeded_order['session_id']}")
    assert r.status_code == 200, r.text
    body = r.json()
    # The response must include an order object for the success page
    order = body.get("order")
    assert order, f"checkout/status missing order field: {body}"
    assert order.get("invoice_number") == "INV-2026-8888"
    assert isinstance(order.get("items"), list) and len(order["items"]) >= 1
    it = order["items"][0]
    for k in ("image", "title", "qty", "unit"):
        assert k in it, f"item missing {k}: {it}"


def test_admin_shop_order_invoice_pdf(client, admin_headers, seeded_order):
    r = client.get(f"/api/admin/shop-orders/{seeded_order['order_id']}/invoice", headers=admin_headers)
    assert r.status_code == 200, r.text
    assert r.headers["content-type"] == "application/pdf"
    assert r.content[:4] == b"%PDF"


# --- Cleanup OTP test users ---
@pytest.fixture(scope="module", autouse=True)
def _cleanup():
    yield
    from motor.motor_asyncio import AsyncIOMotorClient

    async def run():
        db = AsyncIOMotorClient(os.environ["MONGO_URL"])[os.environ["DB_NAME"]]
        await db.users.delete_many({"email": {"$regex": "^pytest\\."}})
        await db.otp_codes.delete_many({"identifier": {"$regex": "^pytest\\."}})

    asyncio.run(run())
