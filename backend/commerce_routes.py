"""
Commerce module for The Local Jewel — sellable product catalog, collections,
admin-editable mega-menu, and Stripe full-price checkout.

Reuses db / serialize_doc / require_admin from admin_routes to stay consistent
with the rest of the backend and avoid circular imports with server.py.
"""
import os
import uuid
import logging
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any

from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel, Field

from admin_routes import db, serialize_doc, require_admin
from variant_options import (
    METAL_TIERS, CARAT_WEIGHTS, GOLD_COLORS, PRODUCT_TYPES,
    variant_price, project_from_price, is_buyable, normalize_sale, apply_sale,
    matrix_tiers, matrix_carats,
)

logger = logging.getLogger(__name__)
router = APIRouter(tags=["commerce"])

STRIPE_API_KEY = os.environ.get("STRIPE_API_KEY", "")


# ---- Helpers ----

def _now():
    return datetime.now(timezone.utc)


def _slugify(text: str) -> str:
    out = "".join(c.lower() if c.isalnum() else "-" for c in (text or "").strip())
    while "--" in out:
        out = out.replace("--", "-")
    return out.strip("-")


async def _get_sale():
    """Active site-wide sale (or None) from the settings collection."""
    doc = await db.settings.find_one({"key": "global_sale"}, {"_id": 0})
    return normalize_sale(doc)


def _project_card(p: dict, sale: Optional[dict]) -> dict:
    """Map a Project document into the product-card shape the storefront expects.

    Price is the lowest matrix cell ("from"); when a sale is active the sale price
    becomes `price` and the original becomes `compare_at_price` (strike-through).
    """
    base = project_from_price(p)
    on_sale = bool(sale) and base > 0
    price = apply_sale(base, sale) if on_sale else base
    gallery = p.get("gallery") or []
    images = [
        {"url": g.get("url"), "alt": g.get("caption", "")}
        for g in gallery
        if g.get("url") and g.get("media_type", "image") != "video"
    ]
    # Hover media for cards: prefer the first gallery video, else the first
    # gallery image that differs from the hero shot.
    hero_url = p.get("hero_image_url", "")
    video = next((g for g in gallery if g.get("url") and g.get("media_type") == "video"), None)
    alt_img = next(
        (g for g in gallery if g.get("url") and g.get("media_type", "image") != "video" and g.get("url") != hero_url),
        None,
    )
    hover_media = (
        {"url": video["url"], "media_type": "video"} if video
        else ({"url": alt_img["url"], "media_type": "image"} if alt_img else None)
    )
    # Variant summary for cards (metal swatch dots + carat range), matrix-derived
    # so any product type's carat set is reflected automatically.
    tiers = matrix_tiers(p)
    carats = matrix_carats(p)
    return {
        "slug": p.get("slug"),
        "title": p.get("title"),
        "subtitle": p.get("subtitle", ""),
        "hero_image_url": p.get("hero_image_url", ""),
        "images": images,
        "price": price,
        "compare_at_price": base if on_sale else None,
        "currency": p.get("price_currency", "USD"),
        "on_sale": on_sale,
        "badge": p.get("badge", ""),
        "rating": p.get("rating"),
        "review_count": p.get("review_count", 0),
        "featured": bool(p.get("featured")),
        "collections": p.get("collections") or [],
        "tags": p.get("tags") or [],
        "from_price": base,
        "hover_media": hover_media,
        "metal_tiers": tiers,
        "carat_range": [carats[0], carats[-1]] if carats else None,
    }


# ---- Models ----

class ProductImage(BaseModel):
    url: str
    alt: Optional[str] = ""


class ProductPayload(BaseModel):
    slug: str
    title: str
    subtitle: Optional[str] = ""
    description_html: Optional[str] = ""
    price: float = 0.0
    compare_at_price: Optional[float] = None
    currency: str = "USD"
    hero_image_url: str = ""
    images: List[ProductImage] = []
    metals: List[str] = []
    carats: List[str] = []
    sizes: List[str] = []
    specs: Dict[str, Any] = Field(default_factory=dict)
    collections: List[str] = []            # collection slugs
    tags: List[str] = []
    badge: Optional[str] = ""              # "Best Seller" | "New" | "Sale" | ""
    rating: Optional[float] = None
    review_count: int = 0
    in_stock: bool = True
    published: bool = True
    featured: bool = False
    position: int = 0
    meta_title: Optional[str] = ""
    meta_description: Optional[str] = ""
    source_project_id: Optional[str] = None


class CollectionPayload(BaseModel):
    slug: str
    title: str
    subtitle: Optional[str] = ""
    description: Optional[str] = ""
    parent_slug: Optional[str] = ""        # for sub-collections (e.g. under "engagement-rings")
    hero_image_url: str = ""
    image_url: str = ""
    published: bool = True
    featured: bool = False
    position: int = 0
    meta_title: Optional[str] = ""
    meta_description: Optional[str] = ""


class MenuLink(BaseModel):
    label: str
    href: str = ""
    hover_image_url: str = ""


class MenuColumn(BaseModel):
    heading: Optional[str] = ""
    links: List[MenuLink] = []


class MenuItem(BaseModel):
    id: Optional[str] = None
    label: str
    href: str = ""
    type: str = "link"                     # "link" | "mega"
    columns: List[MenuColumn] = []
    featured_image_url: str = ""
    featured_label: str = ""
    featured_href: str = ""


class MenuPayload(BaseModel):
    items: List[MenuItem] = []


class CartLine(BaseModel):
    product_slug: str
    quantity: int = 1
    metal_tier: Optional[str] = ""        # silver | 10k | 14k | 18k | platinum
    metal_color: Optional[str] = ""       # White | Rose | Yellow (gold only)
    carat: Optional[str] = ""             # "1" | "2" | "2.5" | "3" | "3.5" | "4"
    metal: Optional[str] = ""             # display label, e.g. "14K Yellow Gold"
    size: Optional[str] = ""


class CheckoutRequest(BaseModel):
    items: List[CartLine]
    origin_url: str
    email: Optional[str] = ""


# ---- Default mega-menu (used until an admin customizes it) ----

DEFAULT_MENU = {
    "items": [
        {
            "id": "engagement", "label": "Engagement Rings", "href": "/collections/engagement-rings",
            "type": "mega",
            "columns": [{
                "heading": "Shop", "links": [
                    {"label": "All Engagement Rings", "href": "/collections/engagement-rings", "hover_image_url": ""},
                ],
            }],
            "featured_image_url": "", "featured_label": "Shop all Engagement Rings", "featured_href": "/collections/engagement-rings",
        },
        {"id": "collections", "label": "Collections", "href": "/collections", "type": "link", "columns": []},
        {"id": "custom", "label": "Custom Design", "href": "/", "type": "link", "columns": []},
        {"id": "journal", "label": "Journal", "href": "/blog", "type": "link", "columns": []},
        {"id": "contact", "label": "Contact", "href": "/contact", "type": "link", "columns": []},
    ]
}


# ============================================================
# PUBLIC: Menu
# ============================================================

@router.get("/api/menu")
async def get_public_menu():
    doc = await db.menu_config.find_one({"_type": "main_menu"}, {"_id": 0})
    if not doc or not doc.get("items"):
        return DEFAULT_MENU
    return {"items": doc.get("items", [])}


@router.get("/api/admin/menu")
async def admin_get_menu(admin=Depends(require_admin)):
    doc = await db.menu_config.find_one({"_type": "main_menu"}, {"_id": 0})
    if not doc or not doc.get("items"):
        return DEFAULT_MENU
    return {"items": doc.get("items", [])}


@router.put("/api/admin/menu")
async def admin_update_menu(req: MenuPayload, admin=Depends(require_admin)):
    items = []
    for it in req.dict()["items"]:
        if not it.get("id"):
            it["id"] = _slugify(it.get("label", "")) or uuid.uuid4().hex[:8]
        items.append(it)
    await db.menu_config.update_one(
        {"_type": "main_menu"},
        {"$set": {"_type": "main_menu", "items": items, "updated_at": _now()}},
        upsert=True,
    )
    return {"items": items}


# ============================================================
# PUBLIC: Collections
# ============================================================

async def _collection_product_count(slug: str) -> int:
    count = 0
    async for p in db.projects.find(
        {"published": True, "collections": slug},
        {"_id": 0, "price_matrix": 1, "collections": 1, "price": 1},
    ):
        if is_buyable(p):
            count += 1
    return count


@router.get("/api/collections")
async def get_public_collections(featured: Optional[bool] = None, parent: Optional[str] = None, all: Optional[bool] = None):
    query = {"published": True}
    if featured is True:
        query["featured"] = True
    if parent is not None:
        query["parent_slug"] = parent
    elif not all:
        # default: only top-level collections (no parent)
        query["$or"] = [{"parent_slug": {"$in": ["", None]}}, {"parent_slug": {"$exists": False}}]
    cursor = db.collections.find(query, {"_id": 0}).sort([("featured", -1), ("position", 1), ("created_at", -1)])
    items = []
    async for doc in cursor:
        clean = serialize_doc(doc)
        clean["product_count"] = await _collection_product_count(doc.get("slug", ""))
        items.append(clean)
    return {"collections": items, "total": len(items)}


@router.get("/api/collections/{slug}")
async def get_public_collection(slug: str, sort: Optional[str] = None):
    doc = await db.collections.find_one({"slug": slug, "published": True}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Collection not found")
    sale = await _get_sale()
    pcursor = db.projects.find(
        {"published": True, "collections": slug}, {"_id": 0}
    ).sort([("featured", -1), ("position", 1), ("created_at", -1)])
    cards = [_project_card(p, sale) async for p in pcursor if is_buyable(p)]
    if sort == "price_asc":
        cards.sort(key=lambda c: c["from_price"])
    elif sort == "price_desc":
        cards.sort(key=lambda c: c["from_price"], reverse=True)
    # sub-collections (children)
    ccursor = db.collections.find({"published": True, "parent_slug": slug}, {"_id": 0}).sort([("position", 1), ("created_at", -1)])
    children = []
    async for c in ccursor:
        cc = serialize_doc(c)
        cc["product_count"] = await _collection_product_count(c.get("slug", ""))
        children.append(cc)
    return {"collection": serialize_doc(doc), "products": cards, "children": children, "total": len(cards)}


# ============================================================
# PUBLIC: Products
# ============================================================

@router.get("/api/products")
async def get_public_products(
    collection: Optional[str] = None,
    tag: Optional[str] = None,
    featured: Optional[bool] = None,
    search: Optional[str] = None,
    limit: int = 60,
):
    query = {"published": True, "collections": {"$exists": True, "$ne": []}}
    if collection:
        query["collections"] = collection
    if tag:
        query["tags"] = tag
    if featured is True:
        query["featured"] = True
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"subtitle": {"$regex": search, "$options": "i"}},
            {"tags": {"$regex": search, "$options": "i"}},
        ]
    cursor = db.projects.find(query, {"_id": 0}).sort(
        [("featured", -1), ("position", 1), ("created_at", -1)]
    ).limit(min(limit, 200))
    sale = await _get_sale()
    items = [_project_card(p, sale) async for p in cursor if is_buyable(p)]
    return {"products": items, "total": len(items)}


@router.get("/api/products/{slug}")
async def get_public_product(slug: str):
    p = await db.projects.find_one({"slug": slug, "published": True}, {"_id": 0})
    if not p:
        raise HTTPException(404, "Product not found")
    sale = await _get_sale()
    card = _project_card(p, sale)
    card["price_matrix"] = p.get("price_matrix") or {}
    card["description_html"] = f"<p>{p.get('description', '')}</p>" if p.get("description") else ""
    card["meta_title"] = p.get("meta_title", "")
    card["meta_description"] = p.get("meta_description", "")
    related = []
    cols = p.get("collections") or []
    if cols:
        rcursor = db.projects.find(
            {"published": True, "slug": {"$ne": slug}, "collections": {"$in": cols}}, {"_id": 0}
        ).limit(8)
        async for r in rcursor:
            if is_buyable(r):
                related.append(_project_card(r, sale))
            if len(related) >= 4:
                break
    card["related"] = related
    return card


# ============================================================
# ADMIN: Products CRUD
# ============================================================

@router.get("/api/admin/products")
async def admin_list_products(admin=Depends(require_admin)):
    cursor = db.products.find({}, {"_id": 0}).sort([("position", 1), ("created_at", -1)])
    items = [serialize_doc(p) async for p in cursor]
    return {"products": items}


@router.get("/api/admin/products/{product_id}")
async def admin_get_product(product_id: str, admin=Depends(require_admin)):
    doc = await db.products.find_one({"product_id": product_id}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Product not found")
    return serialize_doc(doc)


@router.post("/api/admin/products")
async def admin_create_product(req: ProductPayload, admin=Depends(require_admin)):
    existing = await db.products.find_one({"slug": req.slug})
    if existing:
        raise HTTPException(400, "A product with this slug already exists")
    doc = req.dict()
    doc["product_id"] = f"prod_{uuid.uuid4().hex[:12]}"
    doc["created_at"] = _now()
    doc["updated_at"] = _now()
    await db.products.insert_one(doc)
    return serialize_doc({k: v for k, v in doc.items() if k != "_id"})


@router.put("/api/admin/products/{product_id}")
async def admin_update_product(product_id: str, req: ProductPayload, admin=Depends(require_admin)):
    existing = await db.products.find_one({"product_id": product_id})
    if not existing:
        raise HTTPException(404, "Product not found")
    if req.slug != existing.get("slug"):
        clash = await db.products.find_one({"slug": req.slug, "product_id": {"$ne": product_id}})
        if clash:
            raise HTTPException(400, "A product with this slug already exists")
    update = req.dict()
    update["updated_at"] = _now()
    await db.products.update_one({"product_id": product_id}, {"$set": update})
    doc = await db.products.find_one({"product_id": product_id}, {"_id": 0})
    return serialize_doc(doc)


@router.delete("/api/admin/products/{product_id}")
async def admin_delete_product(product_id: str, admin=Depends(require_admin)):
    result = await db.products.delete_one({"product_id": product_id})
    if result.deleted_count == 0:
        raise HTTPException(404, "Product not found")
    return {"status": "deleted"}


@router.post("/api/admin/products/from-project/{project_id}")
async def admin_create_product_from_project(project_id: str, admin=Depends(require_admin)):
    """Turn an existing custom Project into a buyable Product (one-click)."""
    proj = await db.projects.find_one({"project_id": project_id}, {"_id": 0})
    if not proj:
        raise HTTPException(404, "Project not found")
    base_slug = proj.get("slug") or _slugify(proj.get("title", "project"))
    slug = base_slug
    if await db.products.find_one({"slug": slug}):
        slug = f"{base_slug}-{uuid.uuid4().hex[:4]}"
    gallery = proj.get("gallery") or []
    images = [{"url": g.get("url", ""), "alt": g.get("caption", "")} for g in gallery if g.get("url")]
    specs = proj.get("specs") or {}
    doc = {
        "product_id": f"prod_{uuid.uuid4().hex[:12]}",
        "slug": slug,
        "title": proj.get("title", "Custom Piece"),
        "subtitle": proj.get("subtitle", ""),
        "description_html": f"<p>{proj.get('description', '')}</p>",
        "price": float(proj.get("price") or 0.0),
        "compare_at_price": None,
        "currency": proj.get("price_currency", "USD"),
        "hero_image_url": proj.get("hero_image_url", ""),
        "images": images,
        "metals": [specs.get("metal")] if specs.get("metal") else [],
        "carats": [specs.get("carat")] if specs.get("carat") else [],
        "sizes": [],
        "specs": specs,
        "collections": [],
        "tags": proj.get("tags") or [],
        "badge": "",
        "rating": None,
        "review_count": 0,
        "in_stock": True,
        "published": False,
        "featured": False,
        "position": 0,
        "meta_title": proj.get("meta_title", ""),
        "meta_description": proj.get("meta_description", ""),
        "source_project_id": project_id,
        "created_at": _now(),
        "updated_at": _now(),
    }
    await db.products.insert_one(doc)
    return serialize_doc({k: v for k, v in doc.items() if k != "_id"})


# ============================================================
# ADMIN: Collections CRUD
# ============================================================

@router.get("/api/admin/collections")
async def admin_list_collections(admin=Depends(require_admin)):
    cursor = db.collections.find({}, {"_id": 0}).sort([("position", 1), ("created_at", -1)])
    items = []
    async for doc in cursor:
        clean = serialize_doc(doc)
        clean["product_count"] = await _collection_product_count(doc.get("slug", ""))
        items.append(clean)
    return {"collections": items}


@router.get("/api/admin/collections/{collection_id}")
async def admin_get_collection(collection_id: str, admin=Depends(require_admin)):
    doc = await db.collections.find_one({"collection_id": collection_id}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Collection not found")
    return serialize_doc(doc)


@router.post("/api/admin/collections")
async def admin_create_collection(req: CollectionPayload, admin=Depends(require_admin)):
    existing = await db.collections.find_one({"slug": req.slug})
    if existing:
        raise HTTPException(400, "A collection with this slug already exists")
    doc = req.dict()
    doc["collection_id"] = f"col_{uuid.uuid4().hex[:12]}"
    doc["created_at"] = _now()
    doc["updated_at"] = _now()
    await db.collections.insert_one(doc)
    return serialize_doc({k: v for k, v in doc.items() if k != "_id"})


@router.put("/api/admin/collections/{collection_id}")
async def admin_update_collection(collection_id: str, req: CollectionPayload, admin=Depends(require_admin)):
    existing = await db.collections.find_one({"collection_id": collection_id})
    if not existing:
        raise HTTPException(404, "Collection not found")
    old_slug = existing.get("slug")
    if req.slug != old_slug:
        clash = await db.collections.find_one({"slug": req.slug, "collection_id": {"$ne": collection_id}})
        if clash:
            raise HTTPException(400, "A collection with this slug already exists")
    update = req.dict()
    update["updated_at"] = _now()
    await db.collections.update_one({"collection_id": collection_id}, {"$set": update})
    # Keep product references in sync if slug changed
    if req.slug != old_slug and old_slug:
        await db.products.update_many(
            {"collections": old_slug},
            {"$set": {"collections.$": req.slug}},
        )
        await db.collections.update_many({"parent_slug": old_slug}, {"$set": {"parent_slug": req.slug}})
    doc = await db.collections.find_one({"collection_id": collection_id}, {"_id": 0})
    return serialize_doc(doc)


@router.delete("/api/admin/collections/{collection_id}")
async def admin_delete_collection(collection_id: str, admin=Depends(require_admin)):
    existing = await db.collections.find_one({"collection_id": collection_id})
    if not existing:
        raise HTTPException(404, "Collection not found")
    slug = existing.get("slug")
    await db.collections.delete_one({"collection_id": collection_id})
    if slug:
        await db.products.update_many({"collections": slug}, {"$pull": {"collections": slug}})
        await db.collections.update_many({"parent_slug": slug}, {"$set": {"parent_slug": ""}})
    return {"status": "deleted"}


# ============================================================
# PUBLIC + ADMIN: Site-wide Sale & Variant options
# ============================================================

class SalePayload(BaseModel):
    enabled: bool = False
    percent: float = 0.0
    headline: str = ""
    ends_at: Optional[str] = ""


@router.get("/api/shop/sale")
async def public_get_sale():
    return {"sale": await _get_sale()}


@router.get("/api/shop/variant-options")
async def public_variant_options():
    return {
        "metal_tiers": METAL_TIERS,
        "carat_weights": CARAT_WEIGHTS,
        "gold_colors": GOLD_COLORS,
        "product_types": PRODUCT_TYPES,
    }


@router.get("/api/admin/sale")
async def admin_get_sale(admin=Depends(require_admin)):
    doc = await db.settings.find_one({"key": "global_sale"}, {"_id": 0})
    if not doc:
        return {"enabled": False, "percent": 0, "headline": "", "ends_at": ""}
    return {
        "enabled": bool(doc.get("enabled")),
        "percent": doc.get("percent", 0),
        "headline": doc.get("headline", ""),
        "ends_at": doc.get("ends_at", ""),
    }


@router.put("/api/admin/sale")
async def admin_update_sale(req: SalePayload, admin=Depends(require_admin)):
    update = {
        "key": "global_sale",
        "enabled": bool(req.enabled),
        "percent": float(req.percent or 0),
        "headline": req.headline or "",
        "ends_at": req.ends_at or "",
        "updated_at": _now(),
    }
    await db.settings.update_one({"key": "global_sale"}, {"$set": update}, upsert=True)
    return {"enabled": req.enabled, "percent": req.percent, "headline": req.headline, "ends_at": req.ends_at}


# ============================================================
# STRIPE CHECKOUT
# ============================================================

def _stripe(request: Request):
    from emergentintegrations.payments.stripe.checkout import StripeCheckout
    host_url = str(request.base_url)
    webhook_url = f"{host_url}api/webhook/stripe"
    return StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)


@router.post("/api/checkout/session")
async def create_checkout_session(req: CheckoutRequest, request: Request):
    from emergentintegrations.payments.stripe.checkout import CheckoutSessionRequest
    if not req.items:
        raise HTTPException(400, "Cart is empty")
    if not STRIPE_API_KEY:
        raise HTTPException(503, "Payments are not configured")

    # Server-side price computation — never trust the client.
    # Price = exact metal-tier x carat matrix cell, then the active site-wide sale.
    total = 0.0
    currency = "usd"
    line_summary = []
    sale = await _get_sale()
    for line in req.items:
        project = await db.projects.find_one({"slug": line.product_slug, "published": True}, {"_id": 0})
        if not project:
            raise HTTPException(400, f"Product not available: {line.product_slug}")
        qty = max(1, int(line.quantity or 1))
        unit = variant_price(project, line.metal_tier or "", line.carat or "")
        if unit <= 0:
            unit = project_from_price(project)
        if unit <= 0:
            raise HTTPException(400, f"Price unavailable for {line.product_slug}")
        if sale:
            unit = apply_sale(unit, sale)
        total += unit * qty
        currency = (project.get("price_currency") or "USD").lower()
        line_summary.append({
            "slug": line.product_slug,
            "title": project.get("title", ""),
            "qty": qty,
            "unit": unit,
            "metal": line.metal or "",
            "metal_tier": line.metal_tier or "",
            "metal_color": line.metal_color or "",
            "carat": line.carat or "",
            "size": line.size or "",
        })

    total = round(total, 2)
    if total <= 0:
        raise HTTPException(400, "Invalid cart total")

    origin = (req.origin_url or str(request.base_url)).rstrip("/")
    success_url = f"{origin}/checkout/success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{origin}/cart"

    metadata = {
        "source": "storefront",
        "email": (req.email or "")[:120],
        "item_count": str(sum(line.quantity for line in req.items)),
    }

    stripe_checkout = _stripe(request)
    checkout_request = CheckoutSessionRequest(
        amount=float(total),
        currency=currency,
        success_url=success_url,
        cancel_url=cancel_url,
        metadata=metadata,
    )
    session = await stripe_checkout.create_checkout_session(checkout_request)

    await db.payment_transactions.insert_one({
        "session_id": session.session_id,
        "amount": float(total),
        "currency": currency,
        "email": req.email or "",
        "items": line_summary,
        "metadata": metadata,
        "payment_status": "pending",
        "status": "initiated",
        "order_created": False,
        "created_at": _now(),
        "updated_at": _now(),
    })

    return {"url": session.url, "session_id": session.session_id, "amount": total, "currency": currency}


async def _finalize_order_if_paid(txn: dict):
    """Idempotently create a shop_order once a transaction is paid."""
    if not txn or txn.get("order_created"):
        return
    order = {
        "order_id": f"so_{uuid.uuid4().hex[:12]}",
        "session_id": txn.get("session_id"),
        "email": txn.get("email", ""),
        "items": txn.get("items", []),
        "amount": txn.get("amount", 0.0),
        "currency": txn.get("currency", "usd"),
        "status": "paid",
        "fulfillment_status": "processing",
        "created_at": _now(),
    }
    await db.shop_orders.insert_one(order)
    await db.payment_transactions.update_one(
        {"session_id": txn.get("session_id")},
        {"$set": {"order_created": True, "updated_at": _now()}},
    )


@router.get("/api/checkout/status/{session_id}")
async def get_checkout_status(session_id: str, request: Request):
    txn = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
    if not txn:
        raise HTTPException(404, "Session not found")

    # Already finalized — return cached state, do not re-process.
    if txn.get("payment_status") == "paid":
        return {"payment_status": "paid", "status": "complete", "amount": txn.get("amount"), "currency": txn.get("currency")}

    stripe_checkout = _stripe(request)
    status = await stripe_checkout.get_checkout_status(session_id)

    await db.payment_transactions.update_one(
        {"session_id": session_id},
        {"$set": {"payment_status": status.payment_status, "status": status.status, "updated_at": _now()}},
    )

    if status.payment_status == "paid":
        fresh = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
        await _finalize_order_if_paid(fresh)

    return {
        "payment_status": status.payment_status,
        "status": status.status,
        "amount": status.amount_total / 100.0 if status.amount_total else txn.get("amount"),
        "currency": status.currency or txn.get("currency"),
    }


@router.post("/api/webhook/stripe")
async def stripe_webhook(request: Request):
    body = await request.body()
    sig = request.headers.get("Stripe-Signature", "")
    try:
        stripe_checkout = _stripe(request)
        event = await stripe_checkout.handle_webhook(body, sig)
    except Exception as e:
        logger.error(f"stripe webhook error: {e}")
        raise HTTPException(400, "Invalid webhook")
    if event.payment_status == "paid" and event.session_id:
        await db.payment_transactions.update_one(
            {"session_id": event.session_id},
            {"$set": {"payment_status": "paid", "status": "complete", "updated_at": _now()}},
        )
        txn = await db.payment_transactions.find_one({"session_id": event.session_id}, {"_id": 0})
        if txn:
            await _finalize_order_if_paid(txn)
    return {"received": True}


# ============================================================
# ADMIN: Shop Orders
# ============================================================

@router.get("/api/admin/shop-orders")
async def admin_list_shop_orders(admin=Depends(require_admin)):
    cursor = db.shop_orders.find({}, {"_id": 0}).sort("created_at", -1).limit(300)
    items = [serialize_doc(o) async for o in cursor]
    return {"orders": items, "total": len(items)}
