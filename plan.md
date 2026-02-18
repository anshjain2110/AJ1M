# plan.md

## 1. Objectives
- **(Completed)** Deliver a mobile-first, one-question-per-screen lead wizard that captures qualified jewelry leads and stores them in MongoDB.
- **(Completed)** Implement branching flow + dynamic progress indicator (**Step X of Y**) + back navigation + resume on refresh.
- **(Completed)** Support inspiration uploads (1–3 images) and/or links.
- **(Completed)** Add analytics + attribution capture (UTM/click IDs/cookies) and emit `tlj_*` events.
- **(Completed)** Create accounts automatically on lead submit; enable OTP login and a simple dashboard (Quotations/Orders).
- **(Completed)** Polish, harden, and finalize UX/accessibility so the wizard feels consistently premium across devices and edge cases behave reliably.
- **(Completed, post-Phase-3 changes)** Remove Emergent branding; make **phone required + first**, and **email optional**.
- **(Current focus / Phase 4)** Build a **founder-only admin system** that turns the wizard into a scalable, data-driven lead acquisition platform:
  - Analytics dashboard (funnel + attribution + performance)
  - Lead CRM (status workflow, notes, export)
  - Quotation management (templates, sending, status lifecycle)
  - Order management (post-acceptance workflow + tracking)
  - Settings/config (site numbers, toggles, pixels)
  - Tracking/verification tools (event verification, pixel IDs)

## 2. Implementation Steps

### Phase 1: V1 Core Flow (no separate POC) — **COMPLETE**
User stories:
1. As a user, I can start from a landing page and immediately begin the quote wizard.
2. As a user, I see exactly one question at a time with clear choices and a stable progress indicator.
3. As a user, I can go back, change an earlier answer, and the wizard updates to the correct next step.
4. As a user, if I refresh or close the tab, I can resume where I left off.
5. As a user, I can submit my contact details and get a confirmation that my request was received.

Backend (FastAPI + MongoDB) — **DONE**:
- Mongo collections implemented: `leads`, `wizard_sessions`, `users`, `otp_codes`, `events` (and `orders` supported for dashboard).
- API endpoints implemented:
  - `POST /api/wizard/start` → mints `lead_id`, persists attribution snapshot + identifiers.
  - `PUT /api/wizard/{lead_id}/autosave` → stores partial answers + current step.
  - `GET /api/wizard/{lead_id}/restore` → restores autosave session.
  - `POST /api/uploads` (multipart) → stores files and returns served URLs.
  - `POST /api/leads/submit` → writes lead, links/creates user, returns JWT.
  - `POST /api/events` → logs `tlj_*` events.
- File hosting via static mount: `/api/uploads/files/...`.

Frontend (React) — **DONE**:
- Landing page (Screen 0): hero + trust chips + CTA + social proof + testimonials.
- Wizard screens (Screen 1–13): **14+ screens** implemented with correct branching.
- Dynamic progress indicator (Step X of Y) with step total freeze after Screen 1.
- Back navigation.
- Auto-save:
  - localStorage: wizard state + answers + leadId + frozen step total
  - server-side debounced autosave.
- Screen 10A inspiration: upload (1–3) + link input; retry on failure.
- Screen 11 value reveal: animated savings counter with reduced-motion fallback.
- Screen 12 contact: calm validation rules.
- Floating WhatsApp + phone widget visible on wizard pages.

Analytics/Attribution (MVP) — **DONE**:
- Capture on first load: UTM params, referrer, landing URL, click IDs (`fbclid/gclid/ttclid`), Meta cookies (`_fbp/_fbc` when present), device/browser basics.
- Emit/log `tlj_*` events (server logging via `/api/events`).

Checkpoint — **PASSED**:
- End-to-end test: wizard start → branching → optional upload → contact submit → thank you; Mongo records validated.

### Phase 2: Accounts + OTP Login + Dashboard — **COMPLETE**
User stories:
1. As a user, after submitting my lead, I automatically have an account without creating a password.
2. As a returning user, I can request a 6-digit OTP via email/phone to log in.
3. As a user, I can enter the OTP and be redirected to my dashboard.
4. As a user, I can see a list of my quote requests with status and details.
5. As a user, I can see my orders list (even if initially empty) without errors.

Backend — **DONE**:
- Users created/upserted on lead submission; leads linked to `user_id`.
- OTP:
  - `POST /api/auth/request-otp` → generate + hash OTP, store with expiry + rate limiting. (Dev: OTP returned/logged)
  - `POST /api/auth/verify-otp` → verify + issue JWT.
- Dashboard APIs:
  - `GET /api/me` / `GET /api/me/leads` / `GET /api/me/orders` with JWT auth.

Frontend — **DONE**:
- Login page: email/phone input → OTP entry → verify → redirect.
- Dashboard page: tabs for My Quotations + My Orders; empty states + CTA.

Checkpoint — **PASSED**:
- OTP + JWT + data isolation verified.

### Phase 3: Hardening + UX polish + instrumentation completeness — **COMPLETE**
Key fixes and improvements applied:
- Atomic `SET_ANSWER_AND_ADVANCE` to prevent stale state reads during auto-advance.
- Improved localStorage save/restore reliability and debounced server autosave.
- Rapid click protection to prevent double-advance.
- Unicode/icon fixes, hydration warnings addressed.
- Dashboard value formatting for readability.

Post-Phase-3 production fixes — **DONE**:
- Removed Emergent badge/branding.
- Contact capture updated:
  - **Phone is required** and asked first.
  - **Email is optional** (validated only if present).
- Backend updated:
  - Phone is the primary identifier for user creation.
  - Email can be null.
  - Fixed Mongo unique index behavior for empty phones using a partial index.

Checkpoint — **PASSED**:
- Wizard can submit successfully with phone-only (no email) without server errors.

---

### Phase 4: Full Admin System (Founder-only) — **PLANNED / NEXT**

#### Phase 4A — Admin Authentication + Foundations
User stories:
1. As the founder, I can access a private admin panel at `/admin` with no public registration.
2. As the founder, I can securely log in and remain authenticated.

Backend:
- Create `admins` collection (or env-based single admin) with password hashing (bcrypt) and JWT sessions.
- Add middleware/dependency: `require_admin`.
- Add endpoints:
  - `POST /api/admin/auth/login`
  - `POST /api/admin/auth/logout` (optional)
  - `GET /api/admin/me`

Frontend:
- `/admin/login` page.
- `/admin` layout shell (navigation + logout).

Security/ops:
- Restrict admin CORS if needed.
- Rate-limit login.
- Store secrets in env vars (ADMIN_EMAIL/ADMIN_PASSWORD_HASH or bootstrap endpoint).

Checkpoint:
- Founder can log in and access `/admin` routes; non-admins redirected.

#### Phase 4B — Admin Analytics Dashboard (Funnel + Attribution)
User stories:
1. As the founder, I can see total leads for today/week/month/all-time.
2. As the founder, I can see funnel drop-off at each step.
3. As the founder, I can see source/device/geo/campaign performance.

Data/analytics approach:
- Use `events` collection as the source of truth for step views/completions/back/abandon.
- Augment leads with:
  - `started_at`, `completed_at`, `time_to_complete_seconds`
  - `drop_off_screen` (if abandoned)
  - `device_type`
  - `utm_*`, `referrer_url`, `landing_url`
  - `ip` + derived `geo` (country/region/city)

Backend endpoints (aggregations):
- `GET /api/admin/analytics/overview` (totals by period, avg completion time)
- `GET /api/admin/analytics/funnel` (step views → completes → drop-off)
- `GET /api/admin/analytics/sources` (utm_source/utm_medium/referrer)
- `GET /api/admin/analytics/campaigns` (utm_campaign/utm_content/utm_term)
- `GET /api/admin/analytics/devices`
- `GET /api/admin/analytics/geo`
- `GET /api/admin/analytics/abandonment` (rate by step)

Frontend:
- Cards: totals + avg time.
- Funnel chart (bar/step).
- Tables: top campaigns/creatives.
- Source/device/geo breakdown views.

Checkpoint:
- Admin can view accurate funnel + attribution metrics for selected date ranges.

#### Phase 4C — Lead Management (CRM)
User stories:
1. As the founder, I can search/filter leads by status/date/product/budget/source.
2. As the founder, I can open a lead and see all answers + attribution + geo/device + timestamps.
3. As the founder, I can change lead status: New → Contacted → Quoted → Won/Lost.
4. As the founder, I can add internal notes.
5. As the founder, I can export leads to CSV.

Backend:
- Extend `leads` schema:
  - `status` (enum)
  - `internal_notes[]` (author, text, timestamp)
  - `tags[]` (optional)
- Endpoints:
  - `GET /api/admin/leads` (pagination, filters, search)
  - `GET /api/admin/leads/{lead_id}`
  - `PATCH /api/admin/leads/{lead_id}` (status updates)
  - `POST /api/admin/leads/{lead_id}/notes`
  - `GET /api/admin/leads/export.csv` (server-side CSV stream)

Frontend:
- Lead list table with filters.
- Lead detail drawer/page.
- Status workflow UI.
- Notes editor.
- Export button.

Checkpoint:
- Founder can operate the system day-to-day: triage leads, track progress, export.

#### Phase 4D — Quotation Management
User stories:
1. As the founder, I can create a quote for a lead using templates.
2. As the founder, I can send the quote to the customer.
3. As the founder, I can track quote status: Sent/Viewed/Accepted/Rejected.
4. As the founder, I can see quote history per lead.

Backend:
- New collections: `quotes`, `quote_templates`.
- Quote fields: `quote_id`, `lead_id`, line items, totals, currency, status, sent_at, viewed_at, accepted_at.
- Endpoints:
  - `POST /api/admin/leads/{lead_id}/quotes`
  - `GET /api/admin/leads/{lead_id}/quotes`
  - `PATCH /api/admin/quotes/{quote_id}` (status)
  - `POST /api/admin/quotes/{quote_id}/send` (email integration)
  - `GET /q/{quote_id}` public view (tracks "viewed")

Email:
- Integrate transactional email provider (SendGrid/Postmark/SES) for sending quotes.

Frontend:
- Quote composer (template → customize).
- Quote timeline on lead detail.
- Send UI + status badges.

Checkpoint:
- Quotes can be created, sent, and tracked end-to-end.

#### Phase 4E — Order Management
User stories:
1. As the founder, I can convert an accepted quote into an order.
2. As the founder, I can update order statuses and tracking details.

Backend:
- Extend `orders` schema:
  - `order_id`, `lead_id`, `quote_id`, status, tracking_number, shipping_provider_url
- Endpoints:
  - `POST /api/admin/orders` (from accepted quote)
  - `PATCH /api/admin/orders/{order_id}` (status/tracking)
  - `GET /api/admin/orders` / `GET /api/admin/orders/{order_id}`

Frontend:
- Orders list + filters.
- Order detail.
- Status progression UI.

Checkpoint:
- Founder can manage fulfillment lifecycle.

#### Phase 4F — Settings + Tracking/Analytics Configuration (No-code controls)
User stories:
1. As the founder, I can update site phone number, WhatsApp link, and toggle chat.
2. As the founder, I can change GIA/IGI visibility and social proof numbers.
3. As the founder, I can manage pixel IDs and verify events are firing.

Backend:
- New collection: `settings` (single doc) + `tracking_settings`.
- Endpoints:
  - `GET/PATCH /api/admin/settings` (phone, whatsapp, chat toggle, logos visibility, social proof)
  - `GET/PATCH /api/admin/tracking` (meta pixel, tiktok pixel, google ads tag, GA id)
  - `GET /api/admin/tracking/verify` (recent event samples; last seen timestamps)

Frontend:
- Settings forms with live preview.
- Tracking config form + pixel verification view:
  - Show last N events seen for each `tlj_*` event.
  - Show whether lead conversions (`tlj_lead_created`) are arriving.

Checkpoint:
- Founder can control key marketing + trust elements without code changes.

---

## 3. Next Actions
- Implement **Phase 4A** (admin auth + `/admin` route structure).
- Implement **Phase 4B** analytics aggregations using existing `events` + enhanced lead fields.
- Implement **Phase 4C** lead CRM workflows (status, notes, export).
- Then implement Phase 4D/4E (quotes/orders) and Phase 4F (settings/tracking config).

## 4. Success Criteria
- Existing wizard system remains stable (no regressions): branching, autosave, lead creation, phone-first contact capture.
- Founder-only admin panel exists at `/admin` and is secure.
- Admin analytics provides:
  - Leads totals by period
  - Funnel step drop-offs
  - Abandonment rates by screen
  - Source/campaign/device/geo breakdown
  - Avg time to complete
- Lead CRM supports search, filtering, detail view, status workflow, notes, and CSV export.
- Quotes can be created/sent and tracked; orders can be created and tracked.
- Site settings and tracking codes are editable via admin without code changes.
- Tracking verification view confirms required `tlj_*` events are firing and recent.
