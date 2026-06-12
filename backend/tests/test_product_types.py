"""Backend regression tests for the product_type → variant-table feature.

Covers the automation API (key-gated) validation + the public read shape:
 - product_type is required and validated
 - per-type carat validation (engagement vs pendant)
 - metal-only types accept the flat {tier: price} form (folded under "0")
 - custom_project is never buyable
 - GET /api/projects/{slug} exposes product_type + buyable
 - GET /api/shop/variant-options lists product_types

Creates throw-away projects with a "ztest-" prefix and deletes them at the end.
"""
import os
import json
import pytest
import requests

_url_env = os.environ.get("REACT_APP_BACKEND_URL")
if not _url_env:
    with open("/app/frontend/.env") as _f:
        for _line in _f:
            if _line.startswith("REACT_APP_BACKEND_URL"):
                _url_env = _line.split("=", 1)[1].strip()
                break
BASE_URL = (_url_env or "").rstrip("/")
assert BASE_URL, "REACT_APP_BACKEND_URL not set"

_key = os.environ.get("PROJECTS_API_KEY")
if not _key:
    with open("/app/backend/.env") as _f:
        for _line in _f:
            if _line.startswith("PROJECTS_API_KEY"):
                _key = _line.split("=", 1)[1].strip()
                break
API_KEY = _key
HEADERS = {"X-API-Key": API_KEY}

CREATED = []


def _create(payload):
    return requests.post(f"{BASE_URL}/api/projects/api/create", headers=HEADERS,
                         files={"payload": (None, json.dumps(payload))})


@pytest.fixture(scope="module", autouse=True)
def cleanup():
    yield
    for slug in CREATED:
        requests.delete(f"{BASE_URL}/api/projects/api/{slug}", headers=HEADERS)


def test_variant_options_lists_product_types():
    r = requests.get(f"{BASE_URL}/api/shop/variant-options")
    assert r.status_code == 200
    ids = [p["id"] for p in r.json().get("product_types", [])]
    for expected in ["engagement_ring", "wedding_band", "engagement_ring_set",
                     "pendant_studs", "stand_alone", "custom_project"]:
        assert expected in ids


def test_create_requires_product_type():
    r = _create({"title": "ztest No Type"})
    assert r.status_code == 400
    assert "product_type" in r.text


def test_create_rejects_invalid_product_type():
    r = _create({"title": "ztest Bad Type", "product_type": "ring_thing"})
    assert r.status_code == 400


def test_engagement_rejects_pendant_carat():
    r = _create({
        "title": "ztest ER bad carat", "product_type": "engagement_ring",
        "collections": ["engagement-rings"], "price_matrix": {"14k": {"0.25": 900}},
    })
    assert r.status_code == 400
    assert "0.25" in r.text


def test_pendant_accepts_its_carats():
    slug = "ztest-pendant-ok"
    r = _create({
        "title": "ztest Pendant OK", "slug": slug, "product_type": "pendant_studs",
        "collections": ["engagement-rings"],
        "price_matrix": {"14k": {"0.25": 400, "10": 9000}},
    })
    assert r.status_code == 201, r.text
    CREATED.append(slug)
    pub = requests.get(f"{BASE_URL}/api/projects/{slug}").json()
    assert pub["product_type"] == "pendant_studs"
    assert pub["buyable"] is True
    assert pub["price_matrix"]["14k"]["0.25"] == 400


def test_metal_only_flat_form_normalizes():
    slug = "ztest-band-flat"
    r = _create({
        "title": "ztest Band Flat", "slug": slug, "product_type": "wedding_band",
        "collections": ["engagement-rings"],
        "price_matrix": {"14k": 1200, "platinum": 1800},
    })
    assert r.status_code == 201, r.text
    CREATED.append(slug)
    pub = requests.get(f"{BASE_URL}/api/projects/{slug}").json()
    assert pub["price_matrix"]["14k"] == {"0": 1200.0}
    assert pub["from_price"] == 1200.0
    assert pub["buyable"] is True


def test_custom_project_not_buyable():
    slug = "ztest-custom"
    r = _create({
        "title": "ztest Custom", "slug": slug, "product_type": "custom_project",
        "collections": ["engagement-rings"],
        "price_matrix": {"14k": {"1": 1000}},
    })
    assert r.status_code == 201, r.text
    CREATED.append(slug)
    pub = requests.get(f"{BASE_URL}/api/projects/{slug}").json()
    assert pub["product_type"] == "custom_project"
    assert pub["buyable"] is False


def test_metal_only_checkout_prices_server_side():
    slug = "ztest-band-checkout"
    r = _create({
        "title": "ztest Band Checkout", "slug": slug, "product_type": "stand_alone",
        "collections": ["engagement-rings"], "price_matrix": {"18k": 950},
    })
    assert r.status_code == 201, r.text
    CREATED.append(slug)
    co = requests.post(f"{BASE_URL}/api/checkout/session", json={
        "items": [{"product_slug": slug, "metal_tier": "18k", "carat": "0", "quantity": 2}],
        "origin_url": BASE_URL,
    })
    assert co.status_code == 200, co.text
    assert co.json()["amount"] in (1900, 1900.0)
