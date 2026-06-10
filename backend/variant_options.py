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
CARAT_WEIGHTS = ["1", "2", "2.5", "3", "3.5", "4"]
GOLD_COLORS = ["White", "Rose", "Yellow"]


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
    """A project is buyable once it is in at least one collection and has a price."""
    return bool((project or {}).get("collections")) and project_from_price(project) > 0


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
