# The Local Jewel — PRD

## Original Problem Statement
Production-ready lead-generation app for The Local Jewel custom-jewelry brand.
- Lead generation wizard with conditional branching
- Admin dashboard: analytics, lead CRM, quotation & order management, config panels
- Customer OTP login (SMS/email) + personal dashboard
- Dynamic landing-page sections (savings proof, Etsy reviews, product grid, custom-cut showcase)
- Cloudflare R2 file storage
- Founder-level analytics & tracking suite

## Tech Stack
FARM stack — FastAPI · React (CRA) · MongoDB. Cloudflare R2 storage via boto3. JWT admin auth. Twilio/SendGrid OTP. React Router DOM. Custom analytics events. `react-helmet-async` for per-page SEO.

## Environments
- **Preview / dev**: this environment
- **Production**: `https://thelocaljewel.com` — user must redeploy from the platform to push preview changes live

## Architecture
```
/app/
├── backend/  (server.py, admin_routes.py, storage.py, seed_projects.py)
├── frontend/src/
│   ├── components/
│   │   ├── PublicHeader.js              # Shared header for /projects routes
│   │   ├── RenderShowcase.js
│   │   └── wizard/ (WizardShell, screens/...)
│   ├── context/  (WizardContext, AdminContext)
│   ├── pages/
│   │   ├── WizardPage / LoginPage / DashboardPage
│   │   ├── ProjectsIndexPage / ProjectDetailPage   ← NEW
│   │   └── admin/  (Analytics, LeadsCRM, OrdersPage, ProjectsAdminPage, ShowcasePage, SettingsPage, TrackingPage)
│   └── utils/  (wizardConfig, analytics)
└── memory/, test_reports/
```

## Implemented (most recent first)

### Feb 2026 — Phase 1: Past Projects (SEO foundation)
- **Public routes**: `/projects` (index w/ tag filter chips) and `/projects/:slug` (detail w/ gallery, specs, 5-step journey timeline, customer story, related projects, sticky mobile CTA).
- **Backend**: `GET /api/projects` (filterable list), `GET /api/projects/{slug}` (public), full admin CRUD at `/api/admin/projects/*`. Mongo `projects` collection with indexes on slug/published/tags.
- **SEO**: `react-helmet-async` integrated; per-page `<title>` set via `document.title` (sidesteps strict-mode helmet quirk); meta description, canonical, OG, Twitter, Schema.org `CreativeWork` JSON-LD (dangerouslySetInnerHTML).
- **Admin Projects CRUD**: new sidebar item "Projects" with full form — basics, slug auto-gen, hero image R2 upload, gallery (final + 3D-render variants), specs (carat/shape/setting/metal/color/clarity/cert), journey timeline builder, customer story, tag preset picker, SEO fields, publish/featured/position.
- **Landing nav**: added "Projects" link in WizardShell header (only on landing) and in landing footer.
- **Seed data**: `/app/backend/seed_projects.py` inserts 3 sample projects so the design verifies end-to-end.

### Earlier in this session
- **"Here's how it works"** wizard interstitial (3-step timeline + assurances + back button + mobile size tune-up).
- **Landing comparison panel**: removed dropdown, made highlighted side-by-side panel with VS badge + savings bar.
- **CTA microcopy**: small "Takes about 90 seconds · No payment required" reassurance line under every wizard-starting CTA.

### Pre-fork
- 12-tab Advanced Analytics suite, render→product showcase, Cloudflare R2 uploads, customer OTP auth + dashboard, admin JWT login + CRM + showcase + settings + tracking + orders.

## Key DB Schema
- `users {phone, email, name, otp, otp_expiry}`
- `leads {user_id, answers, events, status, stage, comments, inspiration_files, inspiration_links, sms_opt_in}`
- `showcase_pairs {pair_id, title, render_image, product_image, order}`
- `events {event_name, event_data, anonymous_id, session_id, server_timestamp}`
- `settings` (single doc)
- **`projects` (NEW)** `{project_id, slug (unique), title, subtitle, hero_image_url, gallery[], specs{carat,shape,setting_style,metal,color,clarity,certification,cert_number,cert_link}, journey[{label,description,image_url}], customer_story{name,location,quote,date}, tags[], description, meta_title, meta_description, published, featured, position, created_at, updated_at}`

## Key API Endpoints
- `/api/wizard/start`, `/api/wizard/submit`, `/api/wizard/{lead_id}/autosave`
- `/api/events` (analytics)
- `/api/admin/analytics/*` (12-tab suite)
- `/api/showcase-pairs` (public)
- **`/api/projects`** (public list w/ tag filter), **`/api/projects/{slug}`** (public detail)
- **`/api/admin/projects`** (admin CRUD)
- `/api/uploads` (R2)

## Backlog / Roadmap

### P1 — Phase 2 (SEO landing pages)
- Build template SEO landing pages: `/custom-engagement-rings`, `/oval-lab-diamond-engagement-rings`, `/orlando-custom-engagement-rings`, `/hidden-halo-engagement-rings`, etc.
- One reusable template (code-config, per user choice) that auto-pulls matching projects by tag, adds FAQ schema, internal linking.

### P1 — Phase 3 (SEO polish)
- Dynamic `/sitemap.xml` (FastAPI endpoint pulling projects + SEO landing slugs) + `/robots.txt`
- Schema.org `FAQPage` on SEO landing pages
- Open Graph image generation per project

### Other P1
- Wire `LandingScreen.js` hardcoded social-proof counts / phone / location → `/api/admin/settings`

### P2
- Quotation email sending + status tracking (Sent/Viewed/Accepted/Rejected)
- Order management — convert accepted quote → formal order
- Dynamic email notification settings → backend logic

### Refactor candidates
- Modularize `server.py` / `admin_routes.py` into `/app/backend/routes/*` once they grow further

## Test Credentials
See `/app/memory/test_credentials.md`

## Integrations
- Twilio (SMS OTP), SendGrid (Email OTP), Cloudflare R2 (boto3)
