# Projects Automation API

Public, key-gated endpoints for creating, updating, and deleting **Projects**
(`/projects/:slug` showcase pages) without using the admin UI.

Perfect for n8n, Zapier, Make, GitHub Actions, custom scripts, etc.

---

## Authentication

Every request must include the header:

```
X-API-Key: <your_PROJECTS_API_KEY>
```

The key is stored in `/app/backend/.env` as `PROJECTS_API_KEY`.
Rotate it any time — just update `.env` and restart the backend.

> Current preview key (do **not** share publicly):
> `tlj_t0t22bDk35g3NzN3Z5_psJ4MR-kuZpF2NiZE802h5Aw`

Wrong/missing key → `401 Unauthorized`.

---

## Endpoints

### 1. Create a project — `POST /api/projects/api/create`

`multipart/form-data` with:

| Field             | Type        | Required | Notes                                                                              |
|-------------------|-------------|----------|------------------------------------------------------------------------------------|
| `payload`         | JSON string | yes      | All metadata (see schema below)                                                    |
| `hero`            | file        | no       | Hero image (max 15 MB)                                                             |
| `gallery`         | files[]     | no       | "Final" photos. Multi-file field — repeat `gallery` for each.                      |
| `renders`         | files[]     | no       | "3D-render" photos. Multi-file field — repeat `renders` for each.                  |

#### `payload` JSON schema

```jsonc
{
  "title": "4.41 Carat Radiant Hidden Halo Engagement Ring",   // required
  "slug": "4-41-carat-radiant-hidden-halo-engagement-ring",     // optional — auto-derived from title
  "subtitle": "Custom designed for a proposal in Winter Park, FL",
  "description": "Short story / SEO copy that appears on the project page.",

  // ─── PRODUCT TYPE (REQUIRED) — decides the variation table ───
  // One of: engagement_ring | wedding_band | engagement_ring_set | pendant_studs | stand_alone | custom_project
  // Missing/invalid → 400 "product_type is required...".
  "product_type": "engagement_ring",

  "specs": {
    "carat": "4.41 ct",
    "shape": "Radiant",
    "setting_style": "Hidden Halo",
    "metal": "14K White Gold",
    "color": "F",
    "clarity": "VS1",
    "certification": "IGI",
    "cert_number": "LG687583822",
    "cert_link": "https://igi.org/..."
  },

  "journey": [
    { "label": "Brief",         "description": "Customer wanted...", "image_url": "" },
    { "label": "3D Render",     "description": "Two revisions...",   "image_url": "" }
    // ...up to as many steps as you like
  ],

  "customer_story": {
    "name": "Eesa",
    "location": "Winter Park, FL",
    "date": "Jun 20, 2025",
    "quote": "Absolutely blown away..."
  },

  "tags": [
    "engagement_ring", "radiant", "hidden_halo", "4ct",
    "lab_grown", "white_gold", "igi_certified"
  ],

  "meta_title": "4.41ct Radiant Hidden Halo Engagement Ring | The Local Jewel",
  "meta_description": "See the full design journey of a 4.41ct radiant hidden halo lab diamond engagement ring.",

  "published": true,    // default true
  "featured":  false,   // default false
  "position":  0,       // smaller number sorts first

  // ─── COMMERCE (makes the piece buyable in the storefront) ───
  // Add the piece to one or more collection slugs. Empty = not buyable (lead-gen only).
  "collections": ["engagement-rings"],
  // Exact price per metal-tier x carat. Gold colour (White/Rose/Yellow) is a free
  // choice and does NOT change price. Metal tiers: silver | 10k | 14k | 18k | platinum.
  // The CARATS DEPEND ON product_type:
  //   engagement_ring / engagement_ring_set : "1" | "1.5" | "2" | "2.5" | "3" | "4"
  //   pendant_studs                         : "0.25" | "0.5" | "1" | "2" | "3" | "4" | "5" | "8" | "10"
  //   wedding_band / stand_alone (METAL-ONLY): no carat — send {tier: price} OR {tier: {"0": price}}
  //   custom_project                        : not buyable — price_matrix is ignored
  // A carat key not allowed for the type → 400. Omit a cell to mark it unavailable.
  // The lowest filled price becomes the "From" price on cards.
  "price_matrix": {
    "silver":   {"1": 900,  "2": 1100, "3": 1400},
    "14k":      {"1": 1500, "1.5": 1700, "2": 1800, "2.5": 2100, "3": 2500, "4": 3300},
    "18k":      {"2": 2200, "3": 2900, "4": 3700},
    "platinum": {"3": 3400, "4": 4200}
  },

  // Optional — captions aligned by index to uploaded files
  "gallery_captions":  ["Final, studio shot", "Hand shot"],
  "render_captions":   ["3D render"]
}
```

#### cURL example

```bash
curl -X POST "https://thelocaljewel.com/api/projects/api/create" \
  -H "X-API-Key: $PROJECTS_API_KEY" \
  -F 'payload={
        "title":"5 Carat Oval Solitaire",
        "product_type":"engagement_ring",
        "subtitle":"Custom statement piece",
        "specs":{"carat":"5.02 ct","shape":"Oval","metal":"Platinum","color":"D","clarity":"VVS2","certification":"IGI"},
        "tags":["engagement_ring","oval","solitaire","5ct","lab_grown","platinum"],
        "collections":["engagement-rings"],
        "price_matrix":{"14k":{"1":1500,"2":1800,"3":2500},"platinum":{"3":3400,"4":4200}},
        "featured": true
      }' \
  -F "hero=@/path/to/hero.jpg" \
  -F "gallery=@/path/to/final1.jpg" \
  -F "gallery=@/path/to/final2.jpg" \
  -F "renders=@/path/to/render1.jpg"
```

Response: `201 Created` with the full project document.

---

### 2. Update a project — `PUT /api/projects/api/{slug}`

Same multipart form. **All fields are optional** — only provided fields are
updated.

Additional form field:

| Field             | Type    | Default | Notes                                                                            |
|-------------------|---------|---------|----------------------------------------------------------------------------------|
| `replace_gallery` | boolean | `false` | If `true`, replaces gallery with newly uploaded files. Otherwise **appends**.   |

```bash
# Update copy only — no files
curl -X PUT "https://thelocaljewel.com/api/projects/api/5-carat-oval-solitaire" \
  -H "X-API-Key: $PROJECTS_API_KEY" \
  -F 'payload={"subtitle":"Updated subtitle","featured":true}'

# Add 2 more renders to the existing gallery
curl -X PUT "https://thelocaljewel.com/api/projects/api/5-carat-oval-solitaire" \
  -H "X-API-Key: $PROJECTS_API_KEY" \
  -F "renders=@/path/to/new_render_1.jpg" \
  -F "renders=@/path/to/new_render_2.jpg"

# Replace the whole gallery with the uploaded files
curl -X PUT "https://thelocaljewel.com/api/projects/api/5-carat-oval-solitaire" \
  -H "X-API-Key: $PROJECTS_API_KEY" \
  -F "replace_gallery=true" \
  -F "gallery=@/path/to/replacement_1.jpg" \
  -F "gallery=@/path/to/replacement_2.jpg"
```

---

### 3. Delete — `DELETE /api/projects/api/{slug}`

```bash
curl -X DELETE "https://thelocaljewel.com/api/projects/api/4-41-carat-radiant-hidden-halo-engagement-ring" \
  -H "X-API-Key: $PROJECTS_API_KEY"
# → {"status":"deleted","slug":"4-41-carat-radiant-hidden-halo-engagement-ring"}
```

---

## Behavior notes

- **Slug**: auto-generated from `title` if not provided. Always lowercased,
  non-alphanumeric → `-`. Must be unique.
- **Files**: max 15 MB each. Uploaded to Cloudflare R2 under
  `projects/<uuid>.<ext>` and the project document stores the public URL
  (`/api/uploads/cloud/...`).
- **`published: false`**: stays in the DB but hidden from the public
  `/projects` index and `/projects/:slug` page. Useful for draft/staging.
- **`featured: true`**: bubbles to the top of the index list.
- **Time fields** (`created_at`, `updated_at`) are managed automatically.

---

## Quick smoke test (already passing)

```
✓ Missing key                  → 401
✓ Wrong key                    → 401
✓ Create w/ file uploads       → 201 + R2 URLs
✓ Public /api/projects/{slug}  → serves it
✓ Duplicate slug               → 400
✓ PUT partial update           → fields updated
✓ DELETE                       → success
✓ GET after delete             → 404
```
