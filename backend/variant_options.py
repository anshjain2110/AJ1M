"""Shared variant, pricing, and sale helpers for The Local Jewel commerce.

Every Project is a buyable Product. Price is a matrix of metal-tier x carat-weight.
Gold colour (White/Rose/Yellow) is a free style choice and does NOT affect price.
A single site-wide sale (percent off + end time) drives the announcement bar,
countdown timers, and server-side checkout discounting.
"""
from datetime import datetime, timezone

# Five price-bearing metal tiers. Gold karats also carry a free colour choice.
METAL_TIERS = [
    {"id": "silver", "label": "Sterling Silver", "colors": []},
    {"id": "10k", "label": "10K Gold", "colors": ["White", "Rose", "Yellow"]},
    {"id": "14k", "label": "14K Gold", "colors": ["White", "Rose", "Yellow"]},
    {"id": "18k", "label": "18K Gold", "colors": ["White", "Rose", "Yellow"]},
    {"id": "platinum", "label": "Platinum", "colors": []},
]
METAL_TIER_IDS = {m["id"] for m in METAL_TIERS}
METAL_TIER_LABEL = {m["id"]: m["label"] for m in METAL_TIERS}
CARAT_WEIGHTS = ["1", "2", "2.5", "3", "3.5", "4"]  # legacy default
GOLD_COLORS = ["White", "Rose", "Yellow"]

# Sentinel carat key for metal-only product types (wedding bands, stand-alone
# pieces) that are priced by metal alone. Never shown to the buyer as a "carat".
METAL_ONLY_KEY = "0"

# Product types decide which carat variations a piece is sold in (and whether it
# is buyable at all). Carats are stored as STRING keys in the price matrix.
PRODUCT_TYPES = [
    {"id": "engagement_ring",     "label": "Engagement Ring",     "carats": ["1", "1.5", "2", "2.5", "3", "4"],                  "buyable": True,  "has_carat": True},
    {"id": "wedding_band",        "label": "Wedding Band",        "carats": [],                                                 "buyable": True,  "has_carat": False},
    {"id": "engagement_ring_set", "label": "Engagement Ring Set", "carats": ["1", "1.5", "2", "2.5", "3", "4"],                  "buyable": True,  "has_carat": True},
    {"id": "pendant_studs",       "label": "Pendant / Studs",     "carats": ["0.25", "0.5", "1", "2", "3", "4", "5", "8", "10"], "buyable": True,  "has_carat": True},
    {"id": "stand_alone",         "label": "Stand-Alone",         "carats": [],                                                 "buyable": True,  "has_carat": False},
    {"id": "custom_project",      "label": "Custom Project",      "carats": [],                                                 "buyable": False, "has_carat": False},
]
PRODUCT_TYPE_IDS = [p["id"] for p in PRODUCT_TYPES]
PRODUCT_TYPE_MAP = {p["id"]: p for p in PRODUCT_TYPES}
DEFAULT_PRODUCT_TYPE = "engagement_ring"


def _to_float(v) -> float:
    try:
        return float(v)
    except (TypeError, ValueError):
        return 0.0


def carats_for_type(product_type: str) -> list:
    pt = PRODUCT_TYPE_MAP.get(product_type)
    return list(pt["carats"]) if pt else list(CARAT_WEIGHTS)


def type_has_carat(product_type: str) -> bool:
    pt = PRODUCT_TYPE_MAP.get(product_type)
    return bool(pt["has_carat"]) if pt else True


def type_is_buyable(product_type: str) -> bool:
    pt = PRODUCT_TYPE_MAP.get(product_type)
    return bool(pt["buyable"]) if pt else True


def matrix_tiers(project: dict) -> list:
    """Metal tier ids with at least one priced cell (matrix-derived, type-agnostic)."""
    pm = (project or {}).get("price_matrix") or {}
    out = []
    for m in METAL_TIERS:
        row = pm.get(m["id"])
        if isinstance(row, dict) and any(_to_float(v) > 0 for v in row.values()):
            out.append(m["id"])
    return out


def matrix_carats(project: dict) -> list:
    """Distinct real carat keys in the matrix, numerically sorted (excludes the
    metal-only sentinel)."""
    pm = (project or {}).get("price_matrix") or {}
    cset = set()
    for m in METAL_TIERS:
        row = pm.get(m["id"])
        if isinstance(row, dict):
            for c, v in row.items():
                if str(c) != METAL_ONLY_KEY and _to_float(v) > 0:
                    cset.add(str(c))
    return sorted(cset, key=_to_float)


def sanitize_price_matrix(product_type: str, matrix) -> dict:
    """Lenient cleanup used by migrations/back-fill: drops carat cells that aren't
    valid for the product type but KEEPS everything else (never errors, never
    clears the whole matrix). For metal-only types, folds any cell under the
    sentinel key."""
    pt = PRODUCT_TYPE_MAP.get(product_type)
    if not pt or not pt.get("buyable"):
        return {}
    matrix = matrix or {}
    if not isinstance(matrix, dict):
        return {}
    has_carat = pt["has_carat"]
    allowed = set(pt["carats"]) if has_carat else {METAL_ONLY_KEY}
    out = {}
    for tier, row in matrix.items():
        if tier not in METAL_TIER_IDS:
            continue
        if not has_carat and isinstance(row, (int, float)):
            row = {METAL_ONLY_KEY: row}
        if not isinstance(row, dict):
            continue
        clean = {}
        for carat, price in row.items():
            ckey = METAL_ONLY_KEY if not has_carat else str(carat)
            if ckey not in allowed:
                continue
            pv = _to_float(price)
            if pv > 0:
                clean[ckey] = pv
        if clean:
            out[tier] = clean
    return out


def normalize_price_matrix(product_type: str, matrix) -> tuple:
    """Validate + normalize a price matrix for a product type.

    Returns (clean_matrix, error_or_None). For metal-only types a flat
    {tier: price} form is accepted and folded under the sentinel carat key.
    """
    pt = PRODUCT_TYPE_MAP.get(product_type)
    if not pt:
        return {}, f"Unknown product_type '{product_type}'. Allowed: {PRODUCT_TYPE_IDS}"
    if not pt["buyable"]:
        return {}, None  # custom projects carry no price matrix
    matrix = matrix or {}
    if not isinstance(matrix, dict):
        return {}, "price_matrix must be an object keyed by metal tier"
    has_carat = pt["has_carat"]
    allowed = set(pt["carats"]) if has_carat else {METAL_ONLY_KEY}
    out = {}
    for tier, row in matrix.items():
        if tier not in METAL_TIER_IDS:
            return {}, f"Unknown metal tier '{tier}'. Allowed: {sorted(METAL_TIER_IDS)}"
        if not has_carat and isinstance(row, (int, float)):
            row = {METAL_ONLY_KEY: row}
        if not isinstance(row, dict):
            return {}, f"price for tier '{tier}' must be a number or a carat->price object"
        clean = {}
        for carat, price in row.items():
            ckey = METAL_ONLY_KEY if not has_carat else str(carat)
            if ckey not in allowed:
                allowed_str = "metal-only (no carat)" if not has_carat else ", ".join(pt["carats"])
                return {}, f"Carat '{carat}' is not valid for product_type '{product_type}'. Allowed: {allowed_str}"
            pv = _to_float(price)
            if pv > 0:
                clean[ckey] = pv
        if clean:
            out[tier] = clean
    return out, None


def variant_price(project: dict, metal_tier: str, carat: str) -> float:
    """Exact price for one metal-tier x carat cell. 0 means not available."""
    pm = (project or {}).get("price_matrix") or {}
    row = pm.get(metal_tier) or {}
    val = row.get(str(carat))
    try:
        return float(val) if val else 0.0
    except (TypeError, ValueError):
        return 0.0


def project_from_price(project: dict) -> float:
    """Lowest priced cell in the matrix (the 'From $X' price). Falls back to legacy price."""
    pm = (project or {}).get("price_matrix") or {}
    prices = []
    for row in pm.values():
        if isinstance(row, dict):
            for v in row.values():
                try:
                    fv = float(v)
                    if fv > 0:
                        prices.append(fv)
                except (TypeError, ValueError):
                    pass
    if prices:
        return min(prices)
    try:
        return float(project.get("price") or 0.0)
    except (TypeError, ValueError):
        return 0.0


def is_buyable(project: dict) -> bool:
    """A project is buyable once it is in at least one collection and has a price.
    Custom projects are never buyable."""
    p = project or {}
    if p.get("product_type") == "custom_project":
        return False
    return bool(p.get("collections")) and project_from_price(p) > 0


def _parse_dt(val):
    if not val:
        return None
    if isinstance(val, datetime):
        return val if val.tzinfo else val.replace(tzinfo=timezone.utc)
    try:
        s = str(val).replace("Z", "+00:00")
        dt = datetime.fromisoformat(s)
        return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)
    except Exception:
        return None


def normalize_sale(doc: dict):
    """Return a public sale dict if the global sale is currently active, else None."""
    if not doc or not doc.get("enabled"):
        return None
    try:
        pct = float(doc.get("percent") or 0)
    except (TypeError, ValueError):
        pct = 0.0
    if pct <= 0:
        return None
    ends_at = _parse_dt(doc.get("ends_at"))
    if ends_at and datetime.now(timezone.utc) >= ends_at:
        return None
    return {
        "enabled": True,
        "percent": pct,
        "headline": doc.get("headline") or "",
        "ends_at": ends_at.isoformat() if ends_at else None,
    }


def apply_sale(price: float, sale: dict) -> float:
    if not sale or not price:
        return price
    try:
        pct = float(sale.get("percent") or 0)
    except (TypeError, ValueError):
        return price
    return round(price * (1 - pct / 100.0), 2)
