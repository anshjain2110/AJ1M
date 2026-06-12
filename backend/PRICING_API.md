# Pricing Table (Price Matrix) — API Documentation

Every Project becomes a **buyable product** once it (a) has a `product_type`,
(b) belongs to at least one collection, and (c) has at least one priced cell in
its `price_matrix`.

`product_type` is **required** on every project and decides the carat columns of
the pricing table. Gold colour (White / Rose / Yellow) is a **free style choice** —
it never changes the price.

---

## Product types → carat columns

| `product_type`         | Buyable | Carat keys (price-matrix columns) |
|------------------------|---------|-----------------------------------|
| `engagement_ring`      | yes     | `"1"` `"1.5"` `"2"` `"2.5"` `"3"` `"4"` |
| `engagement_ring_set`  | yes     | `"1"` `"1.5"` `"2"` `"2.5"` `"3"` `"4"` (center-stone carat) |
| `pendant_studs`        | yes     | `"0.25"` `"0.5"` `"1"` `"2"` `"3"` `"4"` `"5"` `"8"` `"10"` |
| `wedding_band`         | yes     | **metal-only** — one price per metal (no carat) |
| `stand_alone`          | yes     | **metal-only** — one price per metal (no carat) |
| `custom_project`       | **no**  | not buyable — no pricing table, just the story/details |

A carat key that isn't allowed for the chosen `product_type` is rejected with
`400`.

---

## The matrix shape

Metal tiers (rows): `silver` · `10k` · `14k` · `18k` · `platinum`.

**Carat types** (engagement / set / pendant-studs) — `{tier: {carat: price}}`:

```jsonc
"product_type": "engagement_ring",
"price_matrix": {
  "silver":   { "1": 900,  "2": 1100, "3": 1400 },
  "14k":      { "1": 1500, "1.5": 1700, "2": 1800, "2.5": 2100, "3": 2500, "4": 3300 },
  "18k":      { "2": 2200, "3": 2900, "4": 3700 },
  "platinum": { "3": 3400, "4": 4200 }
}
```

**Metal-only types** (wedding band / stand-alone) — send a flat `{tier: price}`
(folded server-side under the `"0"` carat key) **or** the explicit nested form:

```jsonc
"product_type": "wedding_band",
"price_matrix": { "14k": 1200, "18k": 1500, "platinum": 1800 }
// stored & returned as: {"14k": {"0": 1200}, "18k": {"0": 1500}, "platinum": {"0": 1800}}
```

Rules:
- **Omit a cell** (or set `0`) → that combination is shown as *unavailable*.
- **Omit a whole tier** → that metal doesn't appear as an option.
- Carat keys are **strings** (`"2.5"`, not `2.5`).
- The **lowest filled price** becomes the "From $X" price on cards.
- Prices are in USD, plain numbers (no `$`, no commas).
- `custom_project`: any `price_matrix` is ignored — the piece is never buyable.

---

## Writing the matrix

### A) Automation API (n8n / scripts) — key-gated

Send `price_matrix` (and `collections`) inside the `payload` JSON field.
Header: `X-API-Key: <PROJECTS_API_KEY>` (see `/app/backend/.env`).

**Create** — `POST /api/projects/api/create`

```bash
curl -X POST "https://thelocaljewel.com/api/projects/api/create" \
  -H "X-API-Key: $PROJECTS_API_KEY" \
  -F 'payload={
        "title": "2ct Pear Bezel Solitaire",
        "product_type": "engagement_ring",
        "collections": ["engagement-rings"],
        "price_matrix": {
          "silver":   {"1": 900,  "2": 1100},
          "14k":      {"1": 1500, "2": 1800, "3": 2500},
          "platinum": {"3": 3400, "4": 4200}
        }
      }' \
  -F "hero=@/path/to/hero.jpg"
```

**Update prices only** — `PUT /api/projects/api/{slug}`
(the matrix is replaced wholesale when provided)

```bash
curl -X PUT "https://thelocaljewel.com/api/projects/api/2ct-pear-bezel-solitaire" \
  -H "X-API-Key: $PROJECTS_API_KEY" \
  -F 'payload={
        "price_matrix": {
          "14k": {"1": 1600, "2": 1900, "3": 2600},
          "18k": {"2": 2300, "3": 3000}
        }
      }'
```

**Remove all pricing (back to lead-gen quote CTA)** — send an empty matrix and/or
empty collections:

```bash
curl -X PUT ".../api/projects/api/{slug}" -H "X-API-Key: $PROJECTS_API_KEY" \
  -F 'payload={"price_matrix": {}, "collections": []}'
```

### B) Admin CMS

`Admin → Projects → edit a project → Shop` shows a **Product type** picker that
swaps the matrix columns (engagement carats, pendant carats, or a single
metal-only "Price" column). Custom projects hide the table entirely. Leave a cell
blank to mark it unavailable.

---

## Reading prices

### `GET /api/projects/{slug}` (public)

Returns the full project plus commerce fields:

```jsonc
{
  "slug": "2ct-pear-bezel-solitaire",
  "product_type": "engagement_ring",  // drives the variation table
  "buyable": true,              // has product_type, in ≥1 collection AND ≥1 priced cell
  "from_price": 900,            // lowest matrix cell
  "price_matrix": { ... },      // the full matrix
  "collections": ["engagement-rings"],
  "sale": {                     // null when no site-wide sale is active
    "enabled": true, "percent": 15,
    "headline": "Summer Sale", "ends_at": "2026-07-01T00:00:00+00:00"
  }
}
```

### `GET /api/collections/{slug}` (public)

Each product card includes:

```jsonc
{
  "slug": "...", "title": "...",
  "price": 765,                 // from-price AFTER sale discount (if active)
  "compare_at_price": 900,      // original from-price when on sale, else null
  "from_price": 900,            // always the raw lowest cell
  "on_sale": true,
  "metal_tiers": ["silver", "14k", "platinum"],   // tiers with ≥1 priced cell
  "carat_range": ["1", "4"],                       // min / max available carat
  "hover_media": { "url": "...", "media_type": "video" }  // card hover preview
}
```

### `GET /api/shop/variant-options` (public)

Returns the canonical lists of metal tiers (with free colour choices) and carat
weights — use this to stay in sync instead of hardcoding them.

### `GET /api/shop/sale` (public)

The active site-wide sale config (or `null`). Managed in `Admin → Sale`.

---

## How checkout uses the matrix

`POST /api/shop/checkout` re-prices every line item **server-side**:

1. Looks up `price_matrix[metal_tier][carat]` for the project — the client can
   never set its own price.
2. Applies the active site-wide sale percent (if any).
3. Creates the Stripe session with the verified totals.

A combination not present in the matrix is rejected.
