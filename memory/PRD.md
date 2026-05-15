# The Local Jewel — PRD

## Original Problem Statement
Build a high-priority, production-ready lead generation application for a custom jewelry business, "The Local Jewel".
- Lead generation wizard with conditional branching logic
- Admin dashboard with analytics, lead/CRM, quotation & order management, configuration panels
- Customer login via OTP (SMS/email) to a personal dashboard
- Dynamic landing page sections (savings proof, Etsy reviews, product grid, custom cuts showcase)
- Cloudflare R2 integration for file storage
- Founder-level Analytics & Tracking suite (funnel, friction, lead quality, geo, attribution)

## Tech Stack
FARM — FastAPI · React · MongoDB. Cloudflare R2 (boto3). JWT admin auth. Twilio/SendGrid OTP. React Router DOM. Custom analytics events.

## Architecture
```
/app/
├── backend/  (server.py, admin_routes.py, models.py, storage.py)
├── frontend/src/
│   ├── components/wizard/screens/   # LandingScreen, HowItWorksScreen, SingleSelect, Diamond, Bracelet, RingSize, Inspiration, ValueReveal, Contact, ThankYou
│   ├── context/ (WizardContext.js, AdminContext.js)
│   ├── pages/   (WizardPage.js, LoginPage, DashboardPage, admin/*)
│   └── utils/   (wizardConfig.js, analytics.js)
└── tests/, test_reports/, memory/
```

## Implemented (most recent first)

### Feb 2026 — "Here's how it works" interstitial
- New `HowItWorksScreen.js` (3-step modern timeline w/ numbered badges, lucide icons in soft frames, staggered fade-up animation, assurances row).
- Inserted as `how_it_works` in the wizard flow between `landing` and `product_type`.
- `startWizard()` now creates the lead and routes to `how_it_works` first; user clicks "Start designing my piece" → `product_type`.
- Excluded from progress bar, back button, step counter, autosave, persisted state and step-view tracking (treated like landing).
- New analytics events: `tlj_howitworks_view`, `tlj_howitworks_continue`.
- Test IDs: `how-it-works-screen`, `how-it-works-step-1/2/3`, `how-it-works-continue-button`.

### Earlier in this session
- ValueRevealScreen: enlarged "Based on what you're looking for…" and "Customers like you typically save" copy hierarchy so savings ≠ final quote.

### Pre-fork (Analytics & Wizard polish)
- 12-tab Advanced Analytics suite in admin (Overview, Funnel, Friction, Lead Quality, Attribution, Geo, Devices, Visitors, Trends, Events Health, Lead Ops, Insights).
- Landing render-to-product showcase slideshow.
- Cloudflare R2 image/CAD uploads.
- Customer OTP login + dashboard, admin JWT login + CRM + showcase + settings + tracking + orders.

## Key DB Schema
- `users {phone, email, name, otp, otp_expiry}`
- `leads {user_id, answers, events, status, stage, comments, inspiration_files, inspiration_links, sms_opt_in}`
- `showcase_pairs {_id, render_url, product_url, title, created_at}`
- `events {event_name, event_data, anonymous_id, session_id, server_timestamp}`
- `settings` (single document)

## Key API Endpoints
- `/api/wizard/start`, `/api/wizard/submit`, `/api/wizard/{lead_id}/autosave`
- `/api/events` (analytics)
- `/api/admin/analytics/*` (12-tab suite)
- `/api/leads/submit`, `/api/auth/request-otp`, `/api/auth/verify-otp`
- `/api/uploads` (R2)
- `/api/admin/settings`, `/api/admin/showcase/*`

## Backlog / Roadmap

### P1 — Next
- Wire `LandingScreen.js` hardcoded values (social proof counts, phone number, location, savings) → `/api/admin/settings`.

### P2
- Full Quotation Management — email sending from admin, status tracking (Sent / Viewed / Accepted / Rejected).
- Full Order Management — convert accepted quote → formal order.
- Dynamic email notification settings → backend logic.

### P3
- IP Geolocation resolution (ip-api.com) to enrich events for Geo Analytics tab.
- Modularize `server.py` / `admin_routes.py` into `/app/backend/routes/*` once they grow.

## Test Credentials
See `/app/memory/test_credentials.md`.

## Integrations
- Twilio (SMS OTP) — user-provided key
- SendGrid (Email OTP) — user-provided key
- Cloudflare R2 (boto3 image/CAD storage) — user-provided key

## Known Risks
- "IP Geolocation" Geo tab shows empty until ip-api.com (or similar) is integrated (planned P3).
