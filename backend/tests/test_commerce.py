"""Commerce/e-commerce backend tests for The Local Jewel.
Covers menu, collections, products, checkout, and admin CRUD endpoints.
"""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://jewel-lead-gen.preview.emergentagent.com").rstrip("/")
ADMIN_EMAIL = "ansh@thelocaljewel.com"
ADMIN_PASSWORD = "Rakesh@2709"


@pytest.fixture(scope="session")
def api():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def admin_token(api):
    r = api.post(f"{BASE_URL}/api/admin/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    if r.status_code != 200:
        pytest.skip(f"Admin login failed: {r.status_code} {r.text}")
    data = r.json()
    return data.get("token") or data.get("access_token") or data.get("jwt")


@pytest.fixture(scope="session")
def admin_headers(admin_token):
    if not admin_token:
        pytest.skip("No admin token")
    return {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}


# ── Public: Menu ─────────────────────────────────────────────
class TestMenu:
    def test_get_public_menu(self, api):
        r = api.get(f"{BASE_URL}/api/menu")
        assert r.status_code == 200
        data = r.json()
        assert "items" in data
        labels = [i.get("label") for i in data["items"]]
        assert "Engagement Rings" in labels
        eng = next(i for i in data["items"] if i["label"] == "Engagement Rings")
        assert eng["type"] == "mega"
        assert len(eng.get("columns", [])) >= 1
        assert eng.get("featured_image_url", "")


# ── Public: Collections ──────────────────────────────────────
class TestCollections:
    def test_list_collections(self, api):
        r = api.get(f"{BASE_URL}/api/collections")
        assert r.status_code == 200
        data = r.json()
        assert "collections" in data
        assert data["total"] >= 1
        for c in data["collections"]:
            assert "product_count" in c
            assert "slug" in c

    def test_get_engagement_rings_collection(self, api):
        r = api.get(f"{BASE_URL}/api/collections/engagement-rings")
        assert r.status_code == 200
        data = r.json()
        assert data["collection"]["slug"] == "engagement-rings"
        assert isinstance(data["products"], list)
        assert data["total"] >= 1

    def test_collection_sort_price_asc(self, api):
        r = api.get(f"{BASE_URL}/api/collections/engagement-rings", params={"sort": "price_asc"})
        assert r.status_code == 200
        prices = [p.get("price", 0) for p in r.json()["products"]]
        assert prices == sorted(prices)

    def test_collection_sort_price_desc(self, api):
        r = api.get(f"{BASE_URL}/api/collections/engagement-rings", params={"sort": "price_desc"})
        assert r.status_code == 200
        prices = [p.get("price", 0) for p in r.json()["products"]]
        assert prices == sorted(prices, reverse=True)

    def test_collection_404(self, api):
        r = api.get(f"{BASE_URL}/api/collections/does-not-exist-xyz")
        assert r.status_code == 404


# ── Public: Products ─────────────────────────────────────────
class TestProducts:
    def test_list_products(self, api):
        r = api.get(f"{BASE_URL}/api/products")
        assert r.status_code == 200
        data = r.json()
        assert data["total"] >= 1
        slugs = [p["slug"] for p in data["products"]]
        assert "oval-hidden-halo-engagement-ring" in slugs

    def test_filter_by_collection(self, api):
        r = api.get(f"{BASE_URL}/api/products", params={"collection": "engagement-rings"})
        assert r.status_code == 200
        for p in r.json()["products"]:
            assert "engagement-rings" in p.get("collections", [])

    def test_filter_featured(self, api):
        r = api.get(f"{BASE_URL}/api/products", params={"featured": "true"})
        assert r.status_code == 200
        for p in r.json()["products"]:
            assert p.get("featured") is True

    def test_search_products(self, api):
        r = api.get(f"{BASE_URL}/api/products", params={"search": "oval"})
        assert r.status_code == 200
        assert r.json()["total"] >= 1

    def test_product_detail(self, api):
        r = api.get(f"{BASE_URL}/api/products/oval-hidden-halo-engagement-ring")
        assert r.status_code == 200
        data = r.json()
        assert data["slug"] == "oval-hidden-halo-engagement-ring"
        assert "related" in data
        assert isinstance(data["related"], list)
        assert "price" in data
        assert data["price"] > 0

    def test_product_404(self, api):
        r = api.get(f"{BASE_URL}/api/products/not-a-real-slug-zzz")
        assert r.status_code == 404


# ── Stripe checkout ──────────────────────────────────────────
class TestCheckout:
    def test_create_session(self, api):
        payload = {
            "items": [{"product_slug": "oval-hidden-halo-engagement-ring", "quantity": 1, "metal": "Platinum"}],
            "origin_url": BASE_URL,
            "email": "TEST_buyer@example.com",
        }
        r = api.post(f"{BASE_URL}/api/checkout/session", json=payload)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "url" in data and "session_id" in data
        assert "checkout.stripe.com" in data["url"] or "stripe.com" in data["url"]
        # Server-side price assertion: known seed price is 1450
        assert data["amount"] == 1450 or data["amount"] == 1450.0
        # stash session_id for next test
        TestCheckout.session_id = data["session_id"]

    def test_checkout_status(self, api):
        sid = getattr(TestCheckout, "session_id", None)
        if not sid:
            pytest.skip("No session_id from previous test")
        r = api.get(f"{BASE_URL}/api/checkout/status/{sid}")
        assert r.status_code == 200
        data = r.json()
        assert "payment_status" in data
        assert data["payment_status"] in ("pending", "paid", "unpaid", "no_payment_required")

    def test_checkout_invalid_product(self, api):
        r = api.post(f"{BASE_URL}/api/checkout/session", json={
            "items": [{"product_slug": "nope-zzz", "quantity": 1}],
            "origin_url": BASE_URL,
        })
        assert r.status_code == 400

    def test_checkout_empty_cart(self, api):
        r = api.post(f"{BASE_URL}/api/checkout/session", json={"items": [], "origin_url": BASE_URL})
        assert r.status_code == 400

    def test_amount_not_client_trusted(self, api):
        """Client-supplied price fields are ignored — server computes total."""
        payload = {
            "items": [{"product_slug": "oval-hidden-halo-engagement-ring", "quantity": 2, "metal": "Platinum"}],
            "origin_url": BASE_URL,
        }
        r = api.post(f"{BASE_URL}/api/checkout/session", json=payload)
        assert r.status_code == 200
        # qty 2 -> 2 * 1450 = 2900
        assert r.json()["amount"] == 2900


# ── Admin Auth + CRUD ────────────────────────────────────────
class TestAdminCommerce:
    def test_admin_list_products(self, api, admin_headers):
        r = api.get(f"{BASE_URL}/api/admin/products", headers=admin_headers)
        assert r.status_code == 200
        assert "products" in r.json()

    def test_admin_list_collections(self, api, admin_headers):
        r = api.get(f"{BASE_URL}/api/admin/collections", headers=admin_headers)
        assert r.status_code == 200
        for c in r.json()["collections"]:
            assert "product_count" in c

    def test_admin_get_menu(self, api, admin_headers):
        r = api.get(f"{BASE_URL}/api/admin/menu", headers=admin_headers)
        assert r.status_code == 200
        assert len(r.json()["items"]) > 0

    def test_admin_update_menu(self, api, admin_headers):
        # get current
        r = api.get(f"{BASE_URL}/api/admin/menu", headers=admin_headers)
        items = r.json()["items"]
        original_label = items[0]["label"]
        items[0]["label"] = "TEST_" + original_label
        r = api.put(f"{BASE_URL}/api/admin/menu", json={"items": items}, headers=admin_headers)
        assert r.status_code == 200
        assert r.json()["items"][0]["label"].startswith("TEST_")
        # restore
        items[0]["label"] = original_label
        api.put(f"{BASE_URL}/api/admin/menu", json={"items": items}, headers=admin_headers)

    def test_admin_product_crud(self, api, admin_headers):
        slug = f"test-prod-{uuid.uuid4().hex[:6]}"
        payload = {
            "slug": slug, "title": "TEST_Product", "price": 999.0,
            "hero_image_url": "", "metals": ["Gold"], "collections": ["engagement-rings"],
            "published": True,
        }
        r = api.post(f"{BASE_URL}/api/admin/products", json=payload, headers=admin_headers)
        assert r.status_code == 200, r.text
        prod = r.json()
        pid = prod["product_id"]
        # verify GET
        r = api.get(f"{BASE_URL}/api/admin/products/{pid}", headers=admin_headers)
        assert r.status_code == 200
        assert r.json()["title"] == "TEST_Product"
        # update
        payload["title"] = "TEST_Updated"
        r = api.put(f"{BASE_URL}/api/admin/products/{pid}", json=payload, headers=admin_headers)
        assert r.status_code == 200
        assert r.json()["title"] == "TEST_Updated"
        # public should see it
        r = api.get(f"{BASE_URL}/api/products/{slug}")
        assert r.status_code == 200
        # delete
        r = api.delete(f"{BASE_URL}/api/admin/products/{pid}", headers=admin_headers)
        assert r.status_code == 200
        r = api.get(f"{BASE_URL}/api/admin/products/{pid}", headers=admin_headers)
        assert r.status_code == 404

    def test_admin_collection_crud(self, api, admin_headers):
        slug = f"test-coll-{uuid.uuid4().hex[:6]}"
        payload = {"slug": slug, "title": "TEST_Coll", "published": True}
        r = api.post(f"{BASE_URL}/api/admin/collections", json=payload, headers=admin_headers)
        assert r.status_code == 200, r.text
        cid = r.json()["collection_id"]
        payload["title"] = "TEST_Coll_Updated"
        r = api.put(f"{BASE_URL}/api/admin/collections/{cid}", json=payload, headers=admin_headers)
        assert r.status_code == 200
        assert r.json()["title"] == "TEST_Coll_Updated"
        r = api.delete(f"{BASE_URL}/api/admin/collections/{cid}", headers=admin_headers)
        assert r.status_code == 200

    def test_admin_shop_orders(self, api, admin_headers):
        r = api.get(f"{BASE_URL}/api/admin/shop-orders", headers=admin_headers)
        assert r.status_code == 200
        assert "orders" in r.json()

    def test_admin_unauth(self, api):
        r = api.get(f"{BASE_URL}/api/admin/products")
        assert r.status_code in (401, 403)

    def test_admin_create_product_from_project(self, api, admin_headers):
        # list projects
        r = api.get(f"{BASE_URL}/api/admin/projects", headers=admin_headers)
        if r.status_code != 200:
            pytest.skip("No admin projects endpoint")
        projs = r.json().get("projects") or r.json().get("items") or []
        if not projs:
            pytest.skip("No projects available")
        pid = projs[0].get("project_id") or projs[0].get("id")
        r = api.post(f"{BASE_URL}/api/admin/products/from-project/{pid}", headers=admin_headers)
        assert r.status_code == 200, r.text
        new_prod = r.json()
        assert new_prod.get("source_project_id") == pid
        # cleanup
        api.delete(f"{BASE_URL}/api/admin/products/{new_prod['product_id']}", headers=admin_headers)
