# The Local Jewel — Projects Automation API Handoff

**Everything your automation contractor needs.** Send them this single document.

---

## 1. What this API does

Programmatically create, update and delete entries on the **Past Projects** section
of `thelocaljewel.com` (the pages at `/projects/:slug`). Designed for:

- n8n / Make / Zapier flows
- Python or Node scripts
- Bulk imports from a Google Sheet / Notion / Airtable
- AI agents (e.g. an OpenAI tool-calling pipeline that generates listings)

Real binary file uploads are supported — **no need to host images first** —
files go to Cloudflare R2 and the project doc references the resulting URL.

---

## 2. Base URL

| Environment       | Base URL                                                |
|-------------------|---------------------------------------------------------|
| **Production**    | `https://thelocaljewel.com`                             |
| Preview (testing) | `https://custom-jewelry-gen.preview.emergentagent.com`     |

> Test on **preview first**, then switch the base URL when ready.

---

## 3. Authentication

Every request must include the header:

```
X-API-Key: <your_key>
```

The key starts with `tlj_`.

- Created/rotated by the founder at: `/admin/settings → "Projects Automation API Key"`.
- Shown **once** at rotation. Save it in your secrets manager immediately.
- Rotate any time — the old key stops working instantly.
- Missing or wrong key → `401 Unauthorized`.

---

## 4. Endpoints

### 4.1 — Create a project · `POST /api/projects/api/create`

`multipart/form-data` body.

| Field    | Type        | Required | Notes                                                                          |
|----------|-------------|----------|--------------------------------------------------------------------------------|
| payload  | JSON string | yes      | All metadata — see schema below.                                               |
| hero     | file        | no       | Single hero image (max 15 MB).                                                 |
| gallery  | files[]     | no       | "Final" photos — repeat the field for each file.                              |
| renders  | files[]     | no       | "3D-render" photos — repeat the field for each file.                          |
| render_files | files[] | no       | **Alias of `renders`** — accepted for back-compat. Use either.                |
| client_brief_image | file | no    | iMessage screenshot / initial client message. Auto-attached to "Client brief" journey step + added to gallery. |

**`payload` schema** (`?` = optional):

```jsonc
{
  "title": "4.41 Carat Radiant Hidden Halo Engagement Ring",   // required
  "slug?": "4-41-carat-radiant-hidden-halo-engagement-ring",    // auto from title if omitted
  "subtitle?": "Custom designed for a proposal in Winter Park, FL",
  "description?": "Story / SEO copy shown on the project page.",

  "specs?": {
    "carat":         "4.41 ct",
    "shape":         "Radiant",
    "setting_style": "Hidden Halo",
    "metal":         "14K White Gold",
    "color":         "F",
    "clarity":       "VS1",
    "certification": "IGI",
    "cert_number":   "LG687583822",
    "cert_link":     "https://www.igi.org/..."
  },

  "journey?": [
    { "label": "Brief",       "description": "Customer wanted...", "image_url": "" },
    { "label": "3D Render",   "description": "Two revisions...",   "image_url": "" },
    { "label": "Setting",     "description": "...",                "image_url": "" }
  ],

  "customer_story?": {
    "name":     "Eesa",
    "location": "Winter Park, FL",
    "date":     "Jun 20, 2025",
    "quote":    "Absolutely blown away..."
  },

  "tags?": [
    "engagement_ring", "radiant", "hidden_halo", "4ct",
    "lab_grown", "white_gold", "igi_certified"
  ],

  "meta_title?":       "4.41ct Radiant Hidden Halo Engagement Ring | The Local Jewel",
  "meta_description?": "See the full design journey of a 4.41ct radiant hidden halo lab diamond engagement ring.",

  "published?": true,    // default true
  "featured?":  false,   // default false
  "position?":  0,       // smaller = sorts first

  // Optional — captions aligned by index to uploaded files
  "gallery_captions?": ["Final, studio shot", "Hand shot"],
  "render_captions?":  ["3D render top-down"]
}
```

**Response (201 Created)** — the full project document, including the public R2 URLs.

#### cURL example

```bash
curl -X POST "https://thelocaljewel.com/api/projects/api/create" \
  -H "X-API-Key: $TLJ_API_KEY" \
  -F 'payload={
        "title":"5 Carat Oval Solitaire",
        "subtitle":"Custom statement piece",
        "specs":{"carat":"5.02 ct","shape":"Oval","metal":"Platinum","color":"D","clarity":"VVS2","certification":"IGI"},
        "tags":["engagement_ring","oval","solitaire","5ct","lab_grown","platinum"],
        "featured": true,
        "description":"A statement 5.02ct D/VVS2 oval lab-grown diamond..."
      }' \
  -F "hero=@/path/to/hero.jpg" \
  -F "gallery=@/path/to/final1.jpg" \
  -F "gallery=@/path/to/final2.jpg" \
  -F "renders=@/path/to/render1.jpg"
```

#### Python (requests)

```python
import json, requests

BASE = "https://thelocaljewel.com"
KEY  = "tlj_xxxxxxxxxxxx"

payload = {
    "title": "5 Carat Oval Solitaire",
    "subtitle": "Custom statement piece",
    "specs": {"carat": "5.02 ct", "shape": "Oval", "metal": "Platinum",
              "color": "D", "clarity": "VVS2", "certification": "IGI"},
    "tags": ["engagement_ring", "oval", "solitaire", "5ct", "lab_grown", "platinum"],
    "featured": True,
}

files = [
    ("hero",    ("hero.jpg",    open("hero.jpg",    "rb"), "image/jpeg")),
    ("gallery", ("final1.jpg",  open("final1.jpg",  "rb"), "image/jpeg")),
    ("gallery", ("final2.jpg",  open("final2.jpg",  "rb"), "image/jpeg")),
    ("renders", ("render1.jpg", open("render1.jpg", "rb"), "image/jpeg")),
]

r = requests.post(
    f"{BASE}/api/projects/api/create",
    headers={"X-API-Key": KEY},
    data={"payload": json.dumps(payload)},
    files=files,
    timeout=60,
)
print(r.status_code, r.json())
```

#### Node.js (axios + form-data)

```javascript
import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';

const BASE = 'https://thelocaljewel.com';
const KEY  = process.env.TLJ_API_KEY;

const fd = new FormData();
fd.append('payload', JSON.stringify({
  title: '5 Carat Oval Solitaire',
  specs: { carat: '5.02 ct', shape: 'Oval', metal: 'Platinum',
           color: 'D', clarity: 'VVS2', certification: 'IGI' },
  tags: ['engagement_ring', 'oval', 'solitaire', '5ct', 'lab_grown', 'platinum'],
  featured: true,
}));
fd.append('hero',    fs.createReadStream('./hero.jpg'));
fd.append('gallery', fs.createReadStream('./final1.jpg'));
fd.append('gallery', fs.createReadStream('./final2.jpg'));
fd.append('renders', fs.createReadStream('./render1.jpg'));

const { data } = await axios.post(`${BASE}/api/projects/api/create`, fd, {
  headers: { 'X-API-Key': KEY, ...fd.getHeaders() },
  maxBodyLength: 50 * 1024 * 1024,
});
console.log(data);
```

#### n8n flow

1. **HTTP Request** node →
   - Method: `POST`
   - URL: `{{ $env.BASE }}/api/projects/api/create`
   - Authentication: *Header Auth* — name `X-API-Key`, value `{{ $env.TLJ_API_KEY }}`
   - Send Body: ON · Body Content Type: **Multipart-Form-Data**
   - Fields:
     - `payload` (text) → `={{ JSON.stringify($json.payload) }}`
     - `hero` (file) → bind to a binary property from an earlier "Download File" node
     - `gallery` (file) → multiple-file binary property
     - `renders` (file) → multiple-file binary property

---

### 4.1.1 — Project story / journey shapes (HQ FAQ)

The "project story" on the public page (Client Brief → Stone Selection → Setting → Final Result) lives in the `journey[]` array of the project document. **The API accepts three input shapes — pick whichever is easiest for your pipeline. The server normalizes all three into the same `journey[]` structure.**

#### Shape A — Canonical `journey[]` (full control)

```jsonc
{
  "title": "...",
  "journey": [
    {
      "label": "Client brief",
      "description": "She sent us a Pinterest screenshot saying 'I want vintage but modern'...",
      "image_url": "https://...",
      "media": [
        { "url": "https://...", "media_type": "image", "caption": "iMessage from client" }
      ]
    },
    { "label": "Stone selection", "description": "..." },
    { "label": "Setting design",  "description": "..." },
    { "label": "Final result",    "description": "..." }
  ]
}
```

Use this when you want non-standard step labels or multiple media items per step.

#### Shape B — Nested `project_story` (recommended for HQ)

```jsonc
{
  "title": "...",
  "project_story": {
    "client_brief":    "She sent us a Pinterest screenshot...",
    "stone_selection": "We hand-picked two pear lab diamonds, 1.2ct + 1.0ct, F/VS.",
    "setting":         "East-west toi et moi with a fine claw setting in 14K yellow gold.",
    "final_result":    "She cried."
  }
}
```

Each value can also be a `{text, image_url}` object if you want to attach a specific image per step:

```jsonc
{
  "project_story": {
    "client_brief":    { "text": "She wanted vintage but modern.", "image_url": "https://..." },
    "stone_selection": "We hand-picked two pear lab diamonds.",
    "setting":         { "text": "East-west toi et moi.", "image_url": "https://..." },
    "final_result":    "She cried."
  }
}
```

#### Shape C — Flat `*_text` fields (simplest for templated systems)

```jsonc
{
  "title": "...",
  "client_brief_text":    "She sent us a Pinterest screenshot...",
  "stone_selection_text": "We hand-picked two pear lab diamonds.",
  "setting_text":         "East-west toi et moi.",
  "final_result_text":    "She cried."
}
```

Optional per-step image URLs: `client_brief_image_url`, `stone_selection_image_url`, `setting_image_url`, `final_result_image_url`.

#### How file uploads auto-link to story steps

| Multipart file field | Auto-attached to | Also added to |
|---|---|---|
| `hero` | (not a step) | `hero_image_url` |
| `gallery` | (not a step) | `gallery[]` with `type: "final"` |
| `renders` / `render_files` | **"Setting design" step** (created if missing) | `gallery[]` with `type: "render"` |
| `client_brief_image` | **"Client brief" step** (created if missing) | `gallery[]` with `type: "journey"` |

→ Send the iMessage screenshot as `client_brief_image` and the 3D render(s) as `renders` — the story sections render with the right images automatically. **No need to host images yourself first.**

#### Testimonial

Same flexibility — three input shapes, all normalized to `customer_story`:

```jsonc
// A — canonical
{ "customer_story": { "name": "Jess", "location": "Boston, MA", "quote": "...", "date": "Jun 2025" } }
// B — object alias
{ "testimonial":    { "name": "Jess", "location": "Boston, MA", "quote": "...", "date": "Jun 2025" } }
// C — plain string
{ "testimonial":    "The Local Jewel literally read her mind." }
```

#### SEO keywords

- `meta_keywords` (array of strings) is **accepted** as a convenience and mapped to `seo_phrases` on save.
- You can also send `seo_phrases` directly. Both work — `seo_phrases` is the canonical field name.

---

### 4.1.2 — Full HQ example (everything in one call)

```bash
curl -X POST "https://thelocaljewel.com/api/projects/api/create" \
  -H "X-API-Key: $TLJ_API_KEY" \
  -F 'payload={
        "title": "Vintage Toi et Moi for Jess",
        "subtitle": "From DM to finished ring in 5 weeks",
        "description": "An east-west toi et moi engagement ring with two pear lab diamonds.",
        "specs": {
          "carat": "1.2 + 1.0 ct",
          "shape": "Pear (Toi et Moi)",
          "setting_style": "East-West Claw",
          "metal": "14K Yellow Gold",
          "color": "F",
          "clarity": "VS"
        },
        "tags": ["engagement_ring","toi_et_moi","pear","lab_grown","yellow_gold"],
        "meta_keywords": ["toi et moi","vintage ring","lab grown engagement ring","pear cut"],

        "project_story": {
          "client_brief":    "She sent us a Pinterest screenshot saying I want vintage but modern.",
          "stone_selection": "We hand-picked two pear lab diamonds, 1.2ct + 1.0ct, F/VS.",
          "setting":         "East-west toi et moi with a fine claw setting in 14K yellow gold.",
          "final_result":    "She cried."
        },

        "testimonial": {
          "name": "Jess M.",
          "location": "Boston, MA",
          "quote": "The Local Jewel literally read her mind.",
          "date": "Jun 2026"
        },

        "price": 4850,
        "price_prefix": "Starting at",
        "published": true,
        "featured": true
      }' \
  -F "hero=@/path/to/hero.jpg;type=image/jpeg" \
  -F "client_brief_image=@/path/to/imessage-screenshot.png;type=image/png" \
  -F "renders=@/path/to/3d-render-front.jpg;type=image/jpeg" \
  -F "renders=@/path/to/3d-render-side.jpg;type=image/jpeg" \
  -F "gallery=@/path/to/final-1.jpg;type=image/jpeg" \
  -F "gallery=@/path/to/final-2.jpg;type=image/jpeg"
```

This single call produces a fully-rendered project page at `https://thelocaljewel.com/projects/vintage-toi-et-moi-for-jess` with:
- Hero image set
- 4-step journey rendered (Client brief → Stone selection → Setting design → Final result)
- iMessage screenshot attached to "Client brief"
- 3D renders attached to "Setting design"
- Final photos in the gallery
- Testimonial card with quote + name + location
- Price tag "Starting at $4,850" on cards and detail hero
- SEO keywords stored under `seo_phrases`

---


### 4.2 — Update a project · `PUT /api/projects/api/{slug}`

Same multipart shape. **All fields are optional** — only what you send gets updated.

Extra flags:

| Field            | Type    | Default | Notes                                                                                                                |
|------------------|---------|---------|----------------------------------------------------------------------------------------------------------------------|
| replace_gallery  | boolean | `false` | `true` = replace existing gallery with newly uploaded files. Else **append**.                                        |
| replace_journey  | boolean | `false` | `true` = replace existing journey[] with the one derived from the payload. Else **merge** (existing labels preserved, new media appended). |

```bash
# Toggle "featured" and update copy — no files
curl -X PUT "https://thelocaljewel.com/api/projects/api/5-carat-oval-solitaire" \
  -H "X-API-Key: $TLJ_API_KEY" \
  -F 'payload={"subtitle":"Updated subtitle","featured":true}'

# Append 2 more renders to existing gallery (also adds to "Setting design" journey step media)
curl -X PUT "https://thelocaljewel.com/api/projects/api/5-carat-oval-solitaire" \
  -H "X-API-Key: $TLJ_API_KEY" \
  -F "renders=@/path/to/new_render_1.jpg" \
  -F "renders=@/path/to/new_render_2.jpg"

# Replace the gallery entirely
curl -X PUT "https://thelocaljewel.com/api/projects/api/5-carat-oval-solitaire" \
  -H "X-API-Key: $TLJ_API_KEY" \
  -F "replace_gallery=true" \
  -F "gallery=@/path/to/new.jpg"

# Update the project story copy without touching media
curl -X PUT "https://thelocaljewel.com/api/projects/api/5-carat-oval-solitaire" \
  -H "X-API-Key: $TLJ_API_KEY" \
  -F 'payload={
        "project_story": {
          "client_brief":    "She came in knowing exactly what she wanted.",
          "stone_selection": "Pulled a 5.02ct D/VVS2 oval from our lab inventory.",
          "setting":         "Classic solitaire on a knife-edge band.",
          "final_result":    "Proposed on the Charles Bridge in Prague."
        }
      }' \
  -F "replace_journey=true"

# Attach an iMessage screenshot to an EXISTING project (Client brief step)
curl -X PUT "https://thelocaljewel.com/api/projects/api/5-carat-oval-solitaire" \
  -H "X-API-Key: $TLJ_API_KEY" \
  -F "client_brief_image=@/path/to/imessage.png"
```

---

### 4.3 — Delete · `DELETE /api/projects/api/{slug}`

```bash
curl -X DELETE "https://thelocaljewel.com/api/projects/api/5-carat-oval-solitaire" \
  -H "X-API-Key: $TLJ_API_KEY"
# → {"status": "deleted", "slug": "5-carat-oval-solitaire"}
```

---

### 4.4 — Read (public, no auth needed)

Useful for "does the slug already exist?" checks in your automation.

```bash
# List all published projects
GET /api/projects

# Filter by tag
GET /api/projects?tag=oval

# Get one
GET /api/projects/{slug}
```

---

## 5. Field reference (cheatsheet)

### Specs (the spec card on the project page)

| Field           | Example                |
|-----------------|------------------------|
| carat           | `4.41 ct`              |
| shape           | `Radiant`, `Oval`, `Round`, `Emerald`, `Cushion`, `Princess`, `Pear`, `Asscher`, `Marquise`, `Heart` |
| setting_style   | `Solitaire`, `Hidden Halo`, `Halo`, `Side Stones`, `Three Stone`, `Pavé` |
| metal           | `14K White Gold`, `14K Yellow Gold`, `14K Rose Gold`, `Platinum` |
| color           | `D`, `E`, `F`, `G`, `H` |
| clarity         | `VVS1`, `VVS2`, `VS1`, `VS2`, `SI1` |
| certification   | `IGI`, `GIA`            |
| cert_number     | `LG687583822`           |
| cert_link       | URL to the certificate PDF |

### Recommended tags (used by the SEO landing pages later)

```
engagement_ring, wedding_band, tennis_bracelet, necklace, earrings,
oval, radiant, emerald, cushion, princess, pear, round, asscher, marquise, heart,
hidden_halo, solitaire, side_stones, three_stone, pave,
lab_grown, natural,
igi_certified, gia_certified,
white_gold, yellow_gold, rose_gold, platinum,
1ct, 2ct, 3ct, 4ct, 5ct
```

> Use any combination — pick the ones that genuinely apply. Tag presets help SEO grouping later.

---

## 6. Error responses

| Status | Meaning                                   | Typical fix                                                      |
|--------|-------------------------------------------|------------------------------------------------------------------|
| 401    | Missing/invalid `X-API-Key`               | Ask founder for a fresh key from admin panel                     |
| 400    | Bad request (missing title, dup slug, …)  | Read `detail` from the response body                             |
| 404    | Project not found (PUT/DELETE)            | Verify the slug                                                  |
| 500    | Server error                              | Retry in 30s; if persists, contact founder                       |

---

## 7. Limits

- **15 MB per file** (server enforced)
- **No rate limit** today — please don't hammer; use exponential backoff on 5xx
- Files persist on **Cloudflare R2** (no expiry)

---

## 8. Testing checklist

Before flipping your automation to production:

- [ ] Test on **preview** URL with the **preview key**.
- [ ] Create one project — verify it appears on `/projects/{slug}`.
- [ ] PUT-update it without files — verify the change.
- [ ] DELETE — verify it 404s.
- [ ] Then switch base URL + key to production.

---

## 9. Contact

- Founder: **Ansh Jain** — `ansh@thelocaljewel.com` · `+1 585 710 8292`
- Key rotation: `/admin/settings` (founder access only)
