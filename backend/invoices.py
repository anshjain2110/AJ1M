"""PDF invoice generation for shop orders (reportlab)."""
from io import BytesIO
from datetime import datetime

from reportlab.lib.pagesizes import LETTER
from reportlab.lib.colors import HexColor
from reportlab.pdfgen import canvas

ACCENT = HexColor("#0F5E4C")
TEXT = HexColor("#1A2520")
MUTED = HexColor("#6B746F")
BORDER = HexColor("#E5E0D7")
SOFT = HexColor("#F7F3EC")

BUSINESS_DEFAULTS = {
    "business_name": "The Local Jewel",
    "business_address": "480 N Orlando Ave, Winter Park, Florida 32771",
    "business_phone": "+1 (585) 710-8292",
    "business_email": "ansh@thelocaljewel.com",
}


async def get_business(db) -> dict:
    """Business details for invoice headers — editable in Admin → Settings."""
    doc = await db.settings.find_one({"_type": "site_settings"}, {"_id": 0}) or {}
    return {k: (doc.get(k) or v) for k, v in BUSINESS_DEFAULTS.items()}


def _variant_text(item: dict) -> str:
    parts = []
    if item.get("metal"):
        parts.append(item["metal"])
    carat = item.get("carat")
    if carat and str(carat) != "0":
        parts.append(f"{carat} ct")
    if item.get("size"):
        parts.append(f"Size {item['size']}")
    return " · ".join(parts)


def _fmt_date(value) -> str:
    if isinstance(value, str):
        try:
            value = datetime.fromisoformat(value.replace("Z", "+00:00"))
        except ValueError:
            return value
    if isinstance(value, datetime):
        return value.strftime("%B %d, %Y")
    return ""


def _money(n, currency="usd") -> str:
    symbol = "$" if (currency or "usd").lower() in ("usd", "") else f"{currency.upper()} "
    return f"{symbol}{float(n or 0):,.2f}"


def build_invoice_pdf(order: dict, business: dict) -> bytes:
    buf = BytesIO()
    c = canvas.Canvas(buf, pagesize=LETTER)
    W, H = LETTER
    M = 54  # margin
    y = H - 64

    # ── Header band ──
    c.setFillColor(ACCENT)
    c.rect(0, H - 8, W, 8, stroke=0, fill=1)

    c.setFillColor(ACCENT)
    c.setFont("Times-Bold", 26)
    c.drawString(M, y, business["business_name"])
    c.setFont("Helvetica", 9)
    c.setFillColor(MUTED)
    c.drawString(M, y - 16, business["business_address"])
    c.drawString(M, y - 29, f"{business['business_phone']}   ·   {business['business_email']}")

    c.setFillColor(TEXT)
    c.setFont("Helvetica-Bold", 22)
    c.drawRightString(W - M, y, "INVOICE")
    c.setFont("Helvetica", 10)
    c.setFillColor(MUTED)
    inv_no = order.get("invoice_number") or order.get("order_id", "")
    c.drawRightString(W - M, y - 18, f"Invoice no. {inv_no}")
    c.drawRightString(W - M, y - 32, f"Date: {_fmt_date(order.get('created_at'))}")

    # PAID badge
    if (order.get("status") or "").lower() == "paid":
        c.setFillColor(ACCENT)
        c.roundRect(W - M - 64, y - 58, 64, 18, 4, stroke=0, fill=1)
        c.setFillColor(HexColor("#FFFFFF"))
        c.setFont("Helvetica-Bold", 9)
        c.drawCentredString(W - M - 32, y - 53, "PAID")

    y -= 84

    # ── Bill to ──
    c.setFillColor(MUTED)
    c.setFont("Helvetica-Bold", 8.5)
    c.drawString(M, y, "BILLED TO")
    c.setFont("Helvetica", 10.5)
    c.setFillColor(TEXT)
    bill_lines = []
    if order.get("customer_name"):
        bill_lines.append(order["customer_name"])
    if order.get("email"):
        bill_lines.append(order["email"])
    if not bill_lines:
        bill_lines.append("Retail customer")
    for i, line in enumerate(bill_lines):
        c.drawString(M, y - 15 - i * 13, line)

    c.setFillColor(MUTED)
    c.setFont("Helvetica-Bold", 8.5)
    c.drawRightString(W - M, y, "ORDER REFERENCE")
    c.setFont("Helvetica", 10.5)
    c.setFillColor(TEXT)
    c.drawRightString(W - M, y - 15, order.get("order_id", ""))

    y -= 60

    # ── Items table ──
    c.setFillColor(SOFT)
    c.rect(M, y - 6, W - 2 * M, 24, stroke=0, fill=1)
    c.setFillColor(MUTED)
    c.setFont("Helvetica-Bold", 8.5)
    c.drawString(M + 10, y + 2, "ITEM")
    c.drawRightString(W - M - 170, y + 2, "QTY")
    c.drawRightString(W - M - 90, y + 2, "UNIT PRICE")
    c.drawRightString(W - M - 10, y + 2, "AMOUNT")
    y -= 24

    currency = order.get("currency", "usd")
    for item in order.get("items", []):
        qty = int(item.get("qty") or 1)
        unit = float(item.get("unit") or 0)
        c.setFillColor(TEXT)
        c.setFont("Helvetica-Bold", 10)
        title = (item.get("title") or item.get("slug") or "Custom piece")[:64]
        c.drawString(M + 10, y, title)
        c.setFont("Helvetica", 10)
        c.drawRightString(W - M - 170, y, str(qty))
        c.drawRightString(W - M - 90, y, _money(unit, currency))
        c.drawRightString(W - M - 10, y, _money(unit * qty, currency))
        variant = _variant_text(item)
        if variant:
            y -= 12
            c.setFillColor(MUTED)
            c.setFont("Helvetica", 8.5)
            c.drawString(M + 10, y, variant)
        y -= 10
        c.setStrokeColor(BORDER)
        c.setLineWidth(0.6)
        c.line(M, y, W - M, y)
        y -= 16
        if y < 200:
            c.showPage()
            y = H - 80

    # ── Totals ──
    y -= 4
    total = float(order.get("amount") or 0)
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 10)
    c.drawRightString(W - M - 110, y, "Subtotal")
    c.setFillColor(TEXT)
    c.drawRightString(W - M - 10, y, _money(total, currency))
    y -= 16
    c.setFillColor(MUTED)
    c.drawRightString(W - M - 110, y, "Shipping (insured)")
    c.setFillColor(TEXT)
    c.drawRightString(W - M - 10, y, "Free")
    y -= 10
    c.setStrokeColor(BORDER)
    c.line(W - M - 230, y, W - M, y)
    y -= 20
    c.setFillColor(ACCENT)
    c.setFont("Helvetica-Bold", 13)
    c.drawRightString(W - M - 110, y, "Total paid")
    c.drawRightString(W - M - 10, y, _money(total, currency))

    # ── Footer ──
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 8.5)
    c.drawCentredString(W / 2, 72, "Every piece is hand-crafted to order. Thank you for supporting an independent jeweler.")
    c.drawCentredString(
        W / 2, 58,
        f"{business['business_name']}  ·  {business['business_address']}  ·  {business['business_phone']}  ·  {business['business_email']}",
    )
    c.setFillColor(ACCENT)
    c.rect(0, 0, W, 6, stroke=0, fill=1)

    c.save()
    return buf.getvalue()
