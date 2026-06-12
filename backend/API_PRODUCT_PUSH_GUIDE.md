# Pushing Products via API — Dev Handoff (updated 2026‑06‑12)

## What changed (READ THIS FIRST)
Every product push now **requires a `product_type`** field, and the **carat
columns of `price_matrix` depend on that type**. Old payloads without
`product_type` will be **rejected with HTTP 400**.

1. Add `"product_type"` to every create/update payload. It must be one of:
   `engagement_ring`, `wedding_band`, `engagement_ring_set`, `pendant_studs`,
   `stand_alone`, `custom_project`.
2. Use only the carat keys allowed for that type (table below). A wrong carat → 400.
3. Engagement‑ring carats changed: **`3.5` was removed, `1.5` was added.**
   New set = `1, 1.5, 2, 2.5, 3, 4`.
4. Wedding bands & stand‑alone are **metal‑only** — send one price per metal
   (no carat). Custom projects are **not buyable** — no pricing table.

---

## Product type → allowed carat keys

| `product_type`        | Buyable | Carat keys (price_matrix columns) |
|-----------------------|---------|-----------------------------------|
| `engagement_ring`     | yes     | `"1"` `"1.5"` `"2"` `"2.5"` `"3"` `"4"` |
| `engagement_ring_set` | yes     | `"1"` `"1.5"` `"2"` `"2.5"` `"3"` `"4"` |
| `pendant_studs`       | yes     | `"0.25"` `"0.5"` `"1"` `"2"` `"3"` `"4"` `"5"` `"8"` `"10"` |
| `wedding_band`        | yes     | **metal‑only** (no carat) |
| `stand_alone`         | yes     | **metal‑only** (no carat) |
| `custom_project`      | **no**  | none — omit `price_matrix`/`collections` |

Metal tiers (rows, all types): `silver` `10k` `14k` `18k` `platinum`.
Gold colour (White/Rose/Yellow) is a free style choice — it never changes price.
Carat keys are **strings** (`"2.5"`, not `2.5`). Omit a cell to mark it unavailable.
The lowest filled price becomes the “From $X” price on cards.

---

## Auth
Every request needs the header `X-API-Key: <PROJECTS_API_KEY>`.
The key lives in the backend env var `PROJECTS_API_KEY` (rotate from there).
Base URL: production = `https://thelocaljewel.com`.

---

## Endpoints
- Create: `POST  /api/projects/api/create`   (multipart/form-data)
- Update: `PUT   /api/projects/api/{slug}`    (multipart, all fields optional; `price_matrix` replaced wholesale when sent)
- Delete: `DELETE /api/projects/api/{slug}`

The product metadata goes in a single form field called **`payload`** (a JSON
string). Images are separate file fields: `hero`, `gallery` (repeatable),
`renders` (repeatable).

---

## Copy‑paste examples (one per type)

### 1) Engagement ring (metal × carat)
```bash
curl -X POST "https://thelocaljewel.com/api/projects/api/create" \
  -H "X-API-Key: $PROJECTS_API_KEY" \
  -F 'payload={
        "title":"2ct Oval Hidden Halo",
        "product_type":"engagement_ring",
        "collections":["engagement-rings"],
        "price_matrix":{
          "14k":      {"1":1500,"1.5":1700,"2":1900,"2.5":2200,"3":2600,"4":3300},
          "18k":      {"2":2300,"3":3000,"4":3800},
          "platinum": {"3":3400,"4":4200}
        }
      }' \
  -F "hero=@/path/to/hero.jpg" \
  -F "gallery=@/path/to/final1.jpg"
```

### 2) Engagement ring SET — same carats as engagement ring
```bash
-F 'payload={
      "title":"Oval Halo Bridal Set",
      "product_type":"engagement_ring_set",
      "collections":["engagement-rings"],
      "price_matrix":{"14k":{"1":2000,"1.5":2300,"2":2600,"2.5":3000,"3":3500,"4":4400}}
    }'
```

### 3) Pendant / Studs (different carats)
```bash
-F 'payload={
      "title":"Round Lab Diamond Studs",
      "product_type":"pendant_studs",
      "collections":["engagement-rings"],
      "price_matrix":{
        "14k":      {"0.25":400,"0.5":600,"1":1000,"2":1800,"3":2800},
        "18k":      {"1":1200,"2":2000,"5":4500,"10":9000},
        "platinum": {"2":2400,"3":3200}
      }
    }'
```

### 4) Wedding band — METAL‑ONLY (no carat)
Send a flat `{tier: price}` (a plain number per metal). The system stores it
internally under carat `"0"`, which is **never shown** to the buyer.
```bash
-F 'payload={
      "title":"Classic 2mm Wedding Band",
      "product_type":"wedding_band",
      "collections":["engagement-rings"],
      "price_matrix":{"14k":600,"18k":750,"platinum":900}
    }'
```

### 5) Stand‑Alone (other) — METAL‑ONLY (no carat)
Same shape as the wedding band:
```bash
-F 'payload={
      "title":"Hammered Cuff Bracelet",
      "product_type":"stand_alone",
      "collections":["engagement-rings"],
      "price_matrix":{"silver":250,"14k":900}
    }'
```

### 6) Custom Project — NOT buyable (story only, no pricing)
Omit `price_matrix` and `collections`. Page shows the story/journey/quote CTA.
```bash
-F 'payload={
      "title":"Reimagined Family Heirloom",
      "product_type":"custom_project",
      "subtitle":"A bespoke redesign",
      "description":"The full story of the build...",
      "journey":[{"label":"Client brief","description":"..."},{"label":"Final result","description":"..."}],
      "customer_story":{"name":"Eesa","location":"Winter Park, FL","quote":"Blown away."}
    }'
```

---

## Update prices later (PUT)
The matrix is **replaced wholesale** when you send `price_matrix`. To change the
type later, send `product_type` too (matrix is re‑validated against it).
```bash
curl -X PUT "https://thelocaljewel.com/api/projects/api/round-lab-diamond-studs" \
  -H "X-API-Key: $PROJECTS_API_KEY" \
  -F 'payload={"product_type":"pendant_studs","price_matrix":{"14k":{"1":1100,"2":1900}}}'
```

## Error responses to expect
- Missing `product_type` → `400 "product_type is required. One of: ..."`
- Bad `product_type` → `400 "Invalid product_type '...'"`
- Carat not allowed for the type → `400 "Carat '0.25' is not valid for product_type 'engagement_ring'. Allowed: 1, 1.5, 2, 2.5, 3, 4"`
- Duplicate slug → `400 "A project with slug '...' already exists"`
