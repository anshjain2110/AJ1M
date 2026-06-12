"""Backend tests for the unified Projects-as-Products refactor.

Covers:
 - GET /api/collections + /api/collections/{slug} reading from db.projects
 - GET /api/products (now backed by projects) with filters
 - GET /api/projects/{slug} enrichment (buyable, from_price, price_matrix, collections, sale)
 - POST /api/checkout/session with metal_tier + carat from the 30-cell matrix
 - GET /api/shop/variant-options
 - Admin: GET/PUT /api/admin/projects with collections + price_matrix persistence
 - Site-wide SALE: PUT /api/admin/sale, GET /api/shop/sale, on_sale flags + checkout discount,
   reset to disabled at end.
"""

import os
import pytest
import requests

_url_env = os.environ.get("REACT_APP_BACKEND_URL")
if not _url_env:
    # fallback to frontend/.env file when env var isn't injected by pytest runner
    try:
        with open("/app/frontend/.env") as _f:
            for _line in _f:
                if _line.startswith("REACT_APP_BACKEND_URL"):
                    _url_env = _line.split("=", 1)[1].strip()
                    break
    except Exception:
        pass
BASE_URL = (_url_env or "").rstrip("/")
assert BASE_URL, "REACT_APP_BACKEND_URL not set"

ADMIN_EMAIL = "ansh@thelocaljewel.com"
ADMIN_PASSWORD = "Rakesh@2709"

BUYABLE_SLUG_A = "3-40-carat-oval-side-stone-engagement-ring"   # from 1500
BUYABLE_SLUG_B = "5-carat-oval-solitaire-engagement-ring"       # from 1800
BUYABLE_SLUG_C = "4-41-carat-radiant-hidden-halo-engagement-ring"  # from 2850
EXPECTED_BUYABLE_SLUGS = {BUYABLE_SLUG_A, BUYABLE_SLUG_B, BUYABLE_SLUG_C}


@pytest.fixture(scope="session")
def api():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def admin_token(api):
    r = api.post(
        f"{BASE_URL}/api/admin/auth/login",
        json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
    )
    if r.status_code != 200:
        pytest.skip(f"Admin login failed: {r.status_code} {r.text}")
    data = r.json()
    return data.get("token") or data.get("access_token") or data.get("jwt")


@pytest.fixture(scope="session")
def admin_headers(admin_token):
    if not admin_token:
        pytest.skip("No admin token")
    return {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}


# ────────────────────────────────────────────────────────────
# Variant options (shared constants)
# ────────────────────────────────────────────────────────────
class TestVariantOptions:
    def test_variant_options(self, api):
        r = api.get(f"{BASE_URL}/api/shop/variant-options")
        assert r.status_code == 200, r.text
        data = r.json()
        # Expecting metal_tiers and carat_weights collections
        tiers = data.get("metal_tiers") or []
        carats = data.get("carat_weights") or []
        # Accept list of strings or list of {key,...} dicts
        def _ids(items):
            return [
                (i if isinstance(i, str) else (i.get("key") or i.get("id") or i.get("slug") or i.get("value")))
                for i in items
            ]
        tier_ids = [str(x).lower() for x in _ids(tiers)]
        carat_ids = [str(x) for x in _ids(carats)]
        for t in ("silver", "10k", "14k", "18k", "platinum"):
            assert t in tier_ids, f"missing metal tier {t}: {tier_ids}"
        for c in ("1", "2", "2.5", "3", "3.5", "4"):
            assert c in carat_ids, f"missing carat {c}: {carat_ids}"


# ────────────────────────────────────────────────────────────
# Collections (now backed by db.projects)
# ────────────────────────────────────────────────────────────
class TestCollections:
    def test_list_collections_has_engagement_rings(self, api):
        r = api.get(f"{BASE_URL}/api/collections")
        assert r.status_code == 200
        data = r.json()
        cols = data.get("collections") or []
        slugs = [c["slug"] for c in cols]
        assert "engagement-rings" in slugs
        er = next(c for c in cols if c["slug"] == "engagement-rings")
        assert er.get("product_count") == 3, f"expected 3 buyable projects, got {er}"

    def test_engagement_rings_returns_three_products(self, api):
        r = api.get(f"{BASE_URL}/api/collections/engagement-rings")
        assert r.status_code == 200
        data = r.json()
        assert data["collection"]["slug"] == "engagement-rings"
        prods = data.get("products") or []
        assert len(prods) == 3, f"expected 3 products, got {len(prods)}"
        slugs = {p["slug"] for p in prods}
        assert slugs == EXPECTED_BUYABLE_SLUGS
        for p in prods:
            assert "title" in p
            # Each product must expose price or from_price
            assert ("price" in p) or ("from_price" in p)

    def test_engagement_rings_sort_price_asc(self, api):
        r = api.get(f"{BASE_URL}/api/collections/engagement-rings", params={"sort": "price_asc"})
        assert r.status_code == 200
        prices = [p.get("price") or p.get("from_price") or 0 for p in r.json()["products"]]
        assert prices == sorted(prices), prices

    def test_engagement_rings_sort_price_desc(self, api):
        r = api.get(f"{BASE_URL}/api/collections/engagement-rings", params={"sort": "price_desc"})
        assert r.status_code == 200
        prices = [p.get("price") or p.get("from_price") or 0 for p in r.json()["products"]]
        assert prices == sorted(prices, reverse=True), prices

    def test_collection_404(self, api):
        r = api.get(f"{BASE_URL}/api/collections/does-not-exist-xyz")
        assert r.status_code == 404


# ────────────────────────────────────────────────────────────
# Products endpoint now reads buyable projects
# ────────────────────────────────────────────────────────────
class TestProductsFromProjects:
    def test_filter_by_collection_returns_three_buyable_projects(self, api):
        r = api.get(f"{BASE_URL}/api/products", params={"collection": "engagement-rings"})
        assert r.status_code == 200
        data = r.json()
        prods = data["products"]
        slugs = {p["slug"] for p in prods}
        assert slugs == EXPECTED_BUYABLE_SLUGS, slugs

    def test_non_buyable_projects_excluded(self, api):
        # Pull ALL projects and assert any project NOT in EXPECTED_BUYABLE_SLUGS
        # does NOT appear in /api/products
        r_all = api.get(f"{BASE_URL}/api/projects")
        if r_all.status_code != 200:
            pytest.skip("public /api/projects unavailable")
        proj_payload = r_all.json()
        all_projects = proj_payload.get("projects") or proj_payload.get("items") or proj_payload
        if not isinstance(all_projects, list):
            pytest.skip("Unexpected /api/projects shape")
        non_buyable = [p["slug"] for p in all_projects if p.get("slug") and p["slug"] not in EXPECTED_BUYABLE_SLUGS]
        if not non_buyable:
            pytest.skip("No non-buyable projects found in public listing")
        r = api.get(f"{BASE_URL}/api/products")
        prod_slugs = {p["slug"] for p in r.json()["products"]}
        for s in non_buyable:
            assert s not in prod_slugs, f"non-buyable {s} leaked into /api/products"

    def test_featured_filter(self, api):
        r = api.get(f"{BASE_URL}/api/products", params={"featured": "true"})
        assert r.status_code == 200
        for p in r.json()["products"]:
            # featured may be a flag or missing — only assert when present
            if "featured" in p:
                assert p["featured"] is True


# ────────────────────────────────────────────────────────────
# Public project detail enrichment
# ────────────────────────────────────────────────────────────
class TestProjectDetail:
    def test_buyable_project_enriched(self, api):
        r = api.get(f"{BASE_URL}/api/projects/{BUYABLE_SLUG_A}")
        assert r.status_code == 200, r.text
        data = r.json()
        assert data.get("buyable") is True
        assert data.get("from_price") == 1500 or data.get("from_price") == 1500.0
        pm = data.get("price_matrix") or {}
        for k in ("silver", "10k", "14k", "18k", "platinum"):
            assert k in pm, f"price_matrix missing {k}: keys={list(pm.keys())}"
        assert "engagement-rings" in (data.get("collections") or [])
        # sale should be present and null/disabled when no global sale
        assert "sale" in data
        sale = data.get("sale")
        # When no sale, expect None / null OR an object whose enabled is False
        if sale is not None and isinstance(sale, dict):
            assert sale.get("enabled") in (False, None)


# ────────────────────────────────────────────────────────────
# Checkout: variant-priced
# ────────────────────────────────────────────────────────────
class TestCheckout:
    def test_matrix_priced_checkout(self, api):
        # Read the live matrix cell so the test is independent of seed pricing
        pr = api.get(f"{BASE_URL}/api/projects/{BUYABLE_SLUG_A}")
        assert pr.status_code == 200, pr.text
        cell = ((pr.json().get("price_matrix") or {}).get("14k") or {}).get("2")
        assert cell, f"expected a 14k/2ct price, got matrix={pr.json().get('price_matrix')}"
        expected = round(float(cell) * 2, 2)
        payload = {
            "items": [{
                "product_slug": BUYABLE_SLUG_A,
                "quantity": 2,
                "metal_tier": "14k",
                "carat": "2",
            }],
            "origin_url": BASE_URL,
            "email": "TEST_buyer@example.com",
        }
        r = api.post(f"{BASE_URL}/api/checkout/session", json=payload)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "url" in data and "session_id" in data
        assert "stripe.com" in data["url"]
        assert data["amount"] in (expected, float(expected)), data

    def test_invalid_slug(self, api):
        r = api.post(f"{BASE_URL}/api/checkout/session", json={
            "items": [{"product_slug": "nope-zzz", "quantity": 1, "metal_tier": "14k", "carat": "2"}],
            "origin_url": BASE_URL,
        })
        assert r.status_code == 400

    def test_empty_items(self, api):
        r = api.post(f"{BASE_URL}/api/checkout/session", json={"items": [], "origin_url": BASE_URL})
        assert r.status_code == 400


# ────────────────────────────────────────────────────────────
# Admin projects (collections + price_matrix)
# ────────────────────────────────────────────────────────────
class TestAdminProjects:
    def test_admin_list_projects_has_unified_fields(self, api, admin_headers):
        r = api.get(f"{BASE_URL}/api/admin/projects", headers=admin_headers)
        assert r.status_code == 200
        body = r.json()
        projs = body.get("projects") or body.get("items") or []
        assert projs, "no projects returned"
        buyable = [p for p in projs if (p.get("slug") == BUYABLE_SLUG_A)]
        assert buyable, "expected target buyable project in admin list"
        p = buyable[0]
        assert "collections" in p
        assert "price_matrix" in p

    def test_admin_update_price_matrix_persists(self, api, admin_headers):
        # Find the project id
        r = api.get(f"{BASE_URL}/api/admin/projects", headers=admin_headers)
        projs = r.json().get("projects") or r.json().get("items") or []
        target = next(p for p in projs if p.get("slug") == BUYABLE_SLUG_A)
        pid = target.get("project_id") or target.get("id") or target.get("_id")
        assert pid

        original_matrix = target.get("price_matrix") or {}
        # Make a deep-ish copy and tweak one cell
        import copy
        new_matrix = copy.deepcopy(original_matrix)
        # Save the original cell to restore later
        original_cell = None
        try:
            original_cell = new_matrix["14k"]["2"]
            new_matrix["14k"]["2"] = 1777
        except Exception:
            pytest.skip(f"matrix shape unexpected: {new_matrix}")

        payload = dict(target)
        payload["price_matrix"] = new_matrix
        # Strip Mongo internal id key if present
        payload.pop("_id", None)

        r2 = api.put(f"{BASE_URL}/api/admin/projects/{pid}", json=payload, headers=admin_headers)
        assert r2.status_code == 200, r2.text

        # GET back and verify
        r3 = api.get(f"{BASE_URL}/api/admin/projects", headers=admin_headers)
        projs3 = r3.json().get("projects") or r3.json().get("items") or []
        target3 = next(p for p in projs3 if p.get("slug") == BUYABLE_SLUG_A)
        assert target3["price_matrix"]["14k"]["2"] in (1777, 1777.0)

        # Restore original cell
        payload["price_matrix"]["14k"]["2"] = original_cell
        api.put(f"{BASE_URL}/api/admin/projects/{pid}", json=payload, headers=admin_headers)


# ────────────────────────────────────────────────────────────
# Site-wide SALE
# ────────────────────────────────────────────────────────────
class TestSale:
    @pytest.fixture(autouse=True, scope="class")
    def cleanup_sale(self, api):
        # Always run after class to ensure sale disabled
        yield
        # best-effort cleanup; needs admin headers
        try:
            r = api.post(
                f"{BASE_URL}/api/admin/auth/login",
                json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
            )
            tok = r.json().get("token") or r.json().get("access_token")
            api.put(
                f"{BASE_URL}/api/admin/sale",
                json={"enabled": False, "percent": 0, "headline": "", "ends_at": ""},
                headers={"Authorization": f"Bearer {tok}", "Content-Type": "application/json"},
            )
        except Exception:
            pass

    def test_enable_sale_and_verify(self, api, admin_headers):
        payload = {
            "enabled": True,
            "percent": 20,
            "headline": "Test Sale 20% off",
            "ends_at": "2026-12-31T23:59:00Z",
        }
        r = api.put(f"{BASE_URL}/api/admin/sale", json=payload, headers=admin_headers)
        assert r.status_code == 200, r.text

        # public sale endpoint
        r2 = api.get(f"{BASE_URL}/api/shop/sale")
        assert r2.status_code == 200
        _body = r2.json()
        sale = _body.get("sale") if isinstance(_body, dict) and "sale" in _body else _body
        assert sale.get("enabled") is True
        assert sale.get("percent") in (20, 20.0)

        # collection products show on_sale + compare_at_price
        r3 = api.get(f"{BASE_URL}/api/collections/engagement-rings")
        assert r3.status_code == 200
        prods = r3.json()["products"]
        target = next(p for p in prods if p["slug"] == BUYABLE_SLUG_A)
        assert target.get("on_sale") is True, target
        compare_at = target.get("compare_at_price")
        sale_price = target.get("price") or target.get("from_price")
        assert compare_at in (1500, 1500.0), f"compare_at_price expected 1500 got {compare_at}"
        assert sale_price in (1200, 1200.0), f"sale price expected 1200 got {sale_price}"

        # checkout applies discount server-side: 1 * 1500 -> 1200
        co = api.post(
            f"{BASE_URL}/api/checkout/session",
            json={
                "items": [{
                    "product_slug": BUYABLE_SLUG_A,
                    "quantity": 1,
                    "metal_tier": "silver",  # cell happens to be 1500 in flat matrix
                    "carat": "1",
                }],
                "origin_url": BASE_URL,
            },
        )
        assert co.status_code == 200, co.text
        assert co.json()["amount"] in (1200, 1200.0), co.json()

    def test_disable_sale_resets(self, api, admin_headers):
        r = api.put(
            f"{BASE_URL}/api/admin/sale",
            json={"enabled": False, "percent": 0, "headline": "", "ends_at": ""},
            headers=admin_headers,
        )
        assert r.status_code == 200
        # verify
        r2 = api.get(f"{BASE_URL}/api/shop/sale")
        assert r2.status_code == 200
        _body = r2.json()
        sale = _body.get("sale") if isinstance(_body, dict) and "sale" in _body else _body
        assert (sale or {}).get("enabled") in (False, None)

        # product price back to 1500
        r3 = api.get(f"{BASE_URL}/api/collections/engagement-rings")
        target = next(p for p in r3.json()["products"] if p["slug"] == BUYABLE_SLUG_A)
        price = target.get("price") or target.get("from_price")
        assert price in (1500, 1500.0)
        assert target.get("on_sale") in (False, None)
