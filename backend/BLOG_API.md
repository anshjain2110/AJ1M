# The Local Jewel — Blog (Journal) Automation API

Push blog posts, hero images, and inline media into thelocaljewel.com/blog programmatically from your internal HQ, n8n, Make, Zapier, or any cURL-capable system.

---

## 1. Base URL & Authentication

**Production base URL:** `https://thelocaljewel.com`

**All requests require:**
```
X-API-Key: <your blog API key>
```

The key is generated in **Admin → Settings → Blog Automation API Key**. It looks like `tljb_XXXXXXXXXXXXXXXXXXXXXXXXXX`. Save it the moment it's shown — it is not retrievable again. The admin can rotate or revoke it at any time.

If you ever see HTTP 401 with `{"detail":"Invalid or missing X-API-Key header"}` → the key was rotated. Ask the admin for the new one.

---

## 2. Endpoints — Quick Reference

| Method | URL | Purpose |
|---|---|---|
| `POST` | `/api/blog/api/create` | Create a new post (with optional hero + inline media) |
| `PUT`  | `/api/blog/api/{slug}` | Update an existing post (partial — only fields you send) |
| `GET`  | `/api/blog/api/{slug}` | Fetch one post including drafts (for sync) |
| `GET`  | `/api/blog/api/list`   | List all posts (incl. drafts by default) |
| `DELETE` | `/api/blog/api/{slug}` | Delete a post |
| `POST` | `/api/blog/api/upload` | Upload images/videos to R2 and get URLs (use BEFORE inline embedding) |

All write endpoints are **multipart/form-data**, not JSON-body. The metadata goes in a single form field called `payload` as a **JSON string**, and files come in as separate file fields.

---

## 3. The `payload` JSON Schema

| Field | Type | Required? | Notes |
|---|---|---|---|
| `title` | string | ✅ on create | The post headline |
| `slug` | string | optional | URL slug. Auto-derived from title if omitted on create. lowercase-with-hyphens |
| `subtitle` | string | optional | Small caption under title |
| `excerpt` | string | optional | Shown on the `/blog` listing page (~140 chars) |
| `hero_image_url` | string | optional | If you already have a hosted URL. Overridden if `hero` file is also sent |
| `content_html` | string | optional | Pre-formatted HTML (any safe subset) |
| `content_markdown` | string | optional | **Use this for ease** — converted to safe HTML automatically. Supports headings, **bold**, *italic*, lists, blockquotes, code, tables, links, images |
| `category` | string | optional | e.g. `"Diamond Guides"` — shown as a chip on the listing |
| `tags` | string[] | optional | e.g. `["lab_grown","buying_guide"]` |
| `author_name` | string | optional | Defaults to "The Local Jewel" |
| `meta_title` | string | optional | SEO `<title>` override. Defaults to title |
| `meta_description` | string | optional | SEO meta description (~155 chars) |
| `published` | bool | optional | Defaults to `false` (draft). Set `true` to publish immediately |
| `featured` | bool | optional | Pins to top of `/blog` index |
| `position` | int | optional | Sort weight inside listing (lower = first) |

**If you send BOTH `content_html` and `content_markdown`** → `content_html` wins.

**`content_markdown` is sanitized** through `bleach`. Scripts and dangerous attributes are stripped. Allowed tags: headings, paragraphs, lists, blockquotes, images, links, tables, code, hr.

---

## 4. The File Fields (multipart only)

| Form field | What it does |
|---|---|
| `hero` | A single image (PNG/JPG/WebP) uploaded to R2 → set as `hero_image_url` automatically |
| `media` | Zero or more files uploaded to R2. URLs come back in the response under `uploaded_media` so you can embed them in your next call's `content_markdown`/`content_html` |

The response from any write endpoint includes `uploaded_media: [{original_name, url, content_type}, ...]` so your automation can capture the hosted URLs.

---

## 5. Examples

### 5a. Create a published post with markdown + a hero image

```bash
curl -X POST "https://thelocaljewel.com/api/blog/api/create" \
  -H "X-API-Key: $TLJ_BLOG_KEY" \
  -F 'payload={
        "title": "Lab grown vs natural — what your guests actually see",
        "excerpt": "A 4-minute read on the only diamond question that matters.",
        "category": "Diamond Guides",
        "tags": ["lab_grown","education"],
        "content_markdown": "## The honest truth\n\nNo one at the wedding can tell.\n\n- Lab-grown diamonds have **identical** atomic structure\n- They are graded by the same labs (GIA, IGI)\n- They cost 50–70% less\n\n> Save the difference for the honeymoon.\n\nReady to see options? [Get a custom quote](/).",
        "meta_title": "Lab Grown Diamond vs Natural — Real Talk",
        "meta_description": "What actually changes when you go lab-grown. From a working jeweler.",
        "published": true,
        "featured": true
      }' \
  -F "hero=@/path/to/hero.jpg;type=image/jpeg"
```

**Response (201):**
```json
{
  "status": "created",
  "post": {
    "post_id": "post_abc123def456",
    "slug": "lab-grown-vs-natural-what-your-guests-actually-see",
    "title": "Lab grown vs natural — what your guests actually see",
    "hero_image_url": "/api/uploads/cloud/thelocaljewel/blog/abcdef.jpg",
    "content_html": "<h2 id=\"the-honest-truth\">The honest truth</h2><p>No one at the wedding can tell.</p>...",
    "published": true,
    "featured": true,
    "published_at": "2026-05-25T22:14:33.412Z",
    "created_at": "2026-05-25T22:14:33.412Z",
    "updated_at": "2026-05-25T22:14:33.412Z",
    ...
  },
  "uploaded_media": []
}
```

The post is now live at `https://thelocaljewel.com/blog/lab-grown-vs-natural-what-your-guests-actually-see`.

---

### 5b. Two-step: upload inline images first, then post

If your content has inline images (`![alt](url)` in markdown), upload them first to get hosted URLs:

```bash
# Step 1 — upload media
curl -X POST "https://thelocaljewel.com/api/blog/api/upload" \
  -H "X-API-Key: $TLJ_BLOG_KEY" \
  -F "files=@/path/to/inline1.jpg" \
  -F "files=@/path/to/inline2.jpg"
```

**Response:**
```json
{
  "uploaded": [
    {"original_name": "inline1.jpg", "url": "/api/uploads/cloud/thelocaljewel/blog/aaa.jpg", "content_type": "image/jpeg"},
    {"original_name": "inline2.jpg", "url": "/api/uploads/cloud/thelocaljewel/blog/bbb.jpg", "content_type": "image/jpeg"}
  ],
  "count": 2
}
```

Then reference those URLs in your post body:

```bash
curl -X POST "https://thelocaljewel.com/api/blog/api/create" \
  -H "X-API-Key: $TLJ_BLOG_KEY" \
  -F 'payload={
        "title": "Inside the studio",
        "content_markdown": "## A peek behind the loupe\n\n![Setting the head](/api/uploads/cloud/thelocaljewel/blog/aaa.jpg)\n\nThe tweezers in the photo above...\n\n![Polishing](/api/uploads/cloud/thelocaljewel/blog/bbb.jpg)",
        "published": true
      }'
```

> Tip: prefix R2 URLs with the full `https://thelocaljewel.com` domain in `content_markdown` if your automation runs outside the production environment.

---

### 5c. Update an existing post (partial)

Only send the fields you want to change:

```bash
curl -X PUT "https://thelocaljewel.com/api/blog/api/lab-grown-vs-natural-guests" \
  -H "X-API-Key: $TLJ_BLOG_KEY" \
  -F 'payload={"featured": true, "subtitle": "5 minute read"}'
```

To replace the hero image while keeping everything else:

```bash
curl -X PUT "https://thelocaljewel.com/api/blog/api/lab-grown-vs-natural-guests" \
  -H "X-API-Key: $TLJ_BLOG_KEY" \
  -F 'payload={}' \
  -F "hero=@/path/to/new-hero.jpg;type=image/jpeg"
```

---

### 5d. List posts (for sync / dedupe)

```bash
curl "https://thelocaljewel.com/api/blog/api/list?include_drafts=true&limit=100" \
  -H "X-API-Key: $TLJ_BLOG_KEY"
```

**Response:**
```json
{
  "posts": [
    {"post_id":"post_abc","slug":"...","title":"...","published":true,"featured":true,"category":"Diamond Guides","published_at":"..."},
    ...
  ],
  "total": 12
}
```

`content_html` is omitted from the list response to keep it light — use `GET /api/blog/api/{slug}` if you need the full body.

---

### 5e. Delete a post

```bash
curl -X DELETE "https://thelocaljewel.com/api/blog/api/lab-grown-vs-natural-guests" \
  -H "X-API-Key: $TLJ_BLOG_KEY"
```

**Response:** `{"status": "deleted", "slug": "lab-grown-vs-natural-guests"}`

---

## 6. Side Effects (what the API does automatically)

- **Sitemap.xml regenerates** on every create/update/delete — Google picks up new posts within 24-48 hours.
- **published_at timestamp** is auto-set the first time a post flips from `published: false` → `published: true`.
- **R2 storage** — all `hero` and `media` files are uploaded to Cloudflare R2 under `/thelocaljewel/blog/`.
- **Slug auto-derivation** — if you skip `slug`, it's generated from `title`. Special characters and spaces are normalized.
- **Markdown sanitization** — `<script>`, inline event handlers, and dangerous attrs are stripped.

---

## 7. HTTP Status Codes

| Code | When |
|---|---|
| `201` | Post created |
| `200` | Updated / fetched / listed / deleted / media uploaded |
| `400` | Bad JSON in `payload`, missing required field, duplicate slug |
| `401` | Missing or invalid `X-API-Key` |
| `404` | No post with that slug |

---

## 8. Constraints

- Max file size per upload: **15 MB** (set by the server upload limit).
- `payload` must be valid JSON (not form-encoded fields).
- `tags` is a JSON array of strings inside `payload` — not separate form fields.
- The API key gate is global to all `/api/blog/api/*` write endpoints.
- Public read endpoints (`/api/blog`, `/api/blog/{slug}`) **never require a key**, but only return `published: true` posts.

---

## 9. Quick smoke test from your machine

```bash
export TLJ_BLOG_KEY="paste-your-key-here"
curl "https://thelocaljewel.com/api/blog/api/list" -H "X-API-Key: $TLJ_BLOG_KEY" | jq
```

If you get a JSON list back, you're good to go. If you get `401`, the key was rotated.

---

**Questions or breaking-change notifications:** ansh@thelocaljewel.com
