"""Regression tests: auth (on-screen OTP + Google session endpoint), customer
profile, shop orders + invoices, settings extensions.

Run:  cd /app/backend && python -m pytest tests/test_auth_orders_invoices.py -q
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
TEST_EMAIL = f"pytest.{uuid.uuid4().hex[:8]}@example.com"


@pytest.fixture(scope="module")
def client():
    with httpx.Client(base_url=BASE, timeout=30) as c:
        yield c


@pytest.fixture(scope="module")
def auth(client):
    """Full OTP login: the OTP is returned in the response (on-screen OTP)."""
    r = client.post("/api/auth/request-otp", json={"identifier": TEST_EMAIL})
    assert r.status_code == 200, r.text
    data = r.json()
    assert data.get("otp") and len(data["otp"]) == 6, "OTP must be returned in the response"
    r2 = client.post("/api/auth/verify-otp", json={"identifier": TEST_EMAIL, "otp_code": data["otp"]})
    assert r2.status_code == 200, r2.text
    body = r2.json()
    assert body["token"] and body["user"]["email"] == TEST_EMAIL
    return {"token": body["token"], "user": body["user"], "headers": {"Authorization": f"Bearer {body['token']}"}}


def test_otp_creates_account_for_new_user(auth):
    # auth fixture already proves signup-on-first-login works
    assert auth["user"]["user_id"].startswith("user_")


def test_google_session_requires_header(client):
    r = client.post("/api/auth/google/session")
    assert r.status_code == 400


def test_google_session_rejects_bad_session(client):
    r = client.post("/api/auth/google/session", headers={"X-Session-ID": "bogus-session"})
    assert r.status_code == 401


def test_me_endpoint(client, auth):
    r = client.get("/api/me", headers=auth["headers"])
    assert r.status_code == 200
    assert r.json()["user"]["email"] == TEST_EMAIL


def test_profile_update(client, auth):
    payload = {
        "first_name": "Py",
        "last_name": "Test",
        "ring_size": "6.5",
        "address": {"line1": "1 Test St", "city": "Orlando", "state": "FL", "zip": "32801", "country": "United States"},
    }
    r = client.put("/api/me/profile", json=payload, headers=auth["headers"])
    assert r.status_code == 200, r.text
    u = r.json()["user"]
    assert u["first_name"] == "Py" and u["ring_size"] == "6.5"
    assert u["address"]["city"] == "Orlando"


def test_shop_orders_and_invoice(client, auth):
    """Seed a paid order for this user's email directly, then verify portal + invoice."""
    from motor.motor_asyncio import AsyncIOMotorClient

    async def seed():
        db = AsyncIOMotorClient(os.environ["MONGO_URL"])[os.environ["DB_NAME"]]
        session_id = f"pytest_sess_{uuid.uuid4().hex[:10]}"
        order = {
            "order_id": f"so_pytest{uuid.uuid4().hex[:8]}",
            "invoice_number": "INV-2026-9999",
            "session_id": session_id,
            "email": TEST_EMAIL,
            "items": [{"slug": "x", "title": "Test Ring", "image": "", "qty": 1, "unit": 1500.0,
                       "metal": "14K Yellow Gold", "metal_tier": "14k", "metal_color": "Yellow", "carat": "1", "size": ""}],
            "amount": 1500.0, "currency": "usd", "status": "paid",
            "fulfillment_status": "processing", "created_at": datetime.now(timezone.utc),
        }
        await db.shop_orders.insert_one(order)
        return order["order_id"], session_id

    order_id, session_id = asyncio.run(seed())

    r = client.get("/api/me/shop-orders", headers=auth["headers"])
    assert r.status_code == 200
    orders = r.json()["orders"]
    assert any(o["order_id"] == order_id for o in orders)

    # Authenticated invoice
    r2 = client.get(f"/api/me/shop-orders/{order_id}/invoice", headers=auth["headers"])
    assert r2.status_code == 200
    assert r2.headers["content-type"] == "application/pdf"
    assert r2.content[:4] == b"%PDF"

    # Public (session-id) invoice from the confirmation page
    r3 = client.get(f"/api/checkout/invoice/{session_id}")
    assert r3.status_code == 200 and r3.content[:4] == b"%PDF"

    # Cross-user protection: a different user can't fetch this invoice
    other = f"pytest.other.{uuid.uuid4().hex[:6]}@example.com"
    ro = client.post("/api/auth/request-otp", json={"identifier": other})
    rv = client.post("/api/auth/verify-otp", json={"identifier": other, "otp_code": ro.json()["otp"]})
    r4 = client.get(f"/api/me/shop-orders/{order_id}/invoice",
                    headers={"Authorization": f"Bearer {rv.json()['token']}"})
    assert r4.status_code == 404


def test_public_settings_has_product_info(client):
    r = client.get("/api/admin/settings/public")
    assert r.status_code == 200
    d = r.json()
    for key in ["ships_from", "lead_time", "returns_policy", "warranty_text", "care_text", "maker_text"]:
        assert d.get(key), f"missing {key}"


def cleanup():
    from motor.motor_asyncio import AsyncIOMotorClient

    async def run():
        db = AsyncIOMotorClient(os.environ["MONGO_URL"])[os.environ["DB_NAME"]]
        await db.users.delete_many({"email": {"$regex": "^pytest\\."}})
        await db.shop_orders.delete_many({"order_id": {"$regex": "^so_pytest"}})
        await db.otp_codes.delete_many({"identifier": {"$regex": "^pytest\\."}})

    asyncio.run(run())


@pytest.fixture(scope="module", autouse=True)
def _cleanup_after():
    yield
    cleanup()
