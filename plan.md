# plan.md

## 1. Objectives
- Deliver a mobile-first, one-question-per-screen lead wizard that reliably captures qualified jewelry leads and stores them in MongoDB.
- Implement branching flow + dynamic progress (Step X of Y) + back navigation + resume on refresh.
- Support inspiration uploads (1–3 images) and/or links.
- Add analytics + attribution capture (UTM/click IDs/cookies) and emit `tlj_*` events.
- Create accounts automatically on lead submit; enable OTP login and a simple dashboard (Quotations/Orders).

## 2. Implementation Steps

### Phase 1: V1 Core Flow (no separate POC)
User stories:
1. As a user, I can start from a landing page and immediately begin the quote wizard.
2. As a user, I see exactly one question at a time with clear choices and a stable progress indicator.
3. As a user, I can go back, change an earlier answer, and the wizard updates to the correct next step.
4. As a user, if I refresh or close the tab, I can resume where I left off.
5. As a user, I can submit my contact details and get a confirmation that my request was received.

Backend (FastAPI + MongoDB):
- Define Mongo collections: `leads`, `wizard_sessions` (autosave), `upload_files` (or store file metadata on lead), `users`, `otp_codes`, `events` (optional: server log).
- Create API endpoints:
  - `POST /api/wizard/start` → mint `lead_id`, persist attribution snapshot + identifiers.
  - `PUT /api/wizard/{lead_id}/autosave` → store partial answers + current step.
  - `POST /api/uploads` (multipart) → save files, return URLs/ids.
  - `POST /api/leads/submit` → validate schema, write lead, create user (if not exists), create session token.
- Implement input validation matching conditional requirements (occasion/deadline/setting/metal/ring_size).

Frontend (React):
- Build wizard shell with persistent header (logo + click-to-call + progress) and floating widget (WhatsApp + chat placeholder).
- Implement step registry (Screen 0–13) + branching rules; compute total steps after Screen 1 then freeze.
- Implement autosave:
  - localStorage: `anonymous_id`, `session_id`, `lead_id`, answers, current_step, frozen_step_total.
  - server autosave via debounced calls.
- Implement Screen 10A upload UI with retry + non-blocking failures.
- Implement Screen 11 value reveal animation (simple counter + delayed reveal, respect reduced motion).
- Implement Screen 12 validation UX (no premature errors; positive validation where useful).
- Apply design tokens globally (CSS variables/theme) + Lucide icons; ensure mobile keyboard scroll-into-view.

Analytics/Attribution (MVP):
- Capture on first load: UTM params, referrer, landing URL, click IDs (`fbclid/gclid/ttclid`), meta cookies (`_fbp/_fbc` if present).
- Emit `tlj_*` events from the frontend; include `{anonymous_id, session_id, lead_id, step_id, step_index}`.
- Add a lightweight backend endpoint `POST /api/events` to log events server-side (optional but useful for debugging).

Checkpoint: End-to-end test (wizard start → branching → upload → submit → thank you) + verify Mongo records.

### Phase 2: Accounts + OTP Login + Dashboard
User stories:
1. As a user, after submitting my lead, I automatically have an account without creating a password.
2. As a returning user, I can request a 6-digit OTP via email/phone to log in.
3. As a user, I can enter the OTP and be redirected to my dashboard.
4. As a user, I can see a list of my quote requests with status and details.
5. As a user, I can see my orders list (even if initially empty) without errors.

Backend:
- Users:
  - Upsert user on lead submit (by email and/or phone); link lead to `user_id`.
- OTP:
  - `POST /api/auth/request-otp` (email/phone) → generate + hash OTP, store with expiry + rate limit.
  - `POST /api/auth/verify-otp` → verify, issue JWT/session cookie.
  - Note: email/SMS delivery mocked/logged for dev; leave production SMTP/SMS as config TODO.
- Dashboard APIs:
  - `GET /api/me` / `GET /api/me/leads` / `GET /api/me/orders`.

Frontend:
- Add login screen (email/phone) + OTP verification screen (auto-submit on 6 digits, resend cooldown).
- Add dashboard routes: My Quotations, My Orders (simple lists).

Checkpoint: Test login + OTP verification + dashboard data isolation.

### Phase 3: Hardening + UX polish + instrumentation completeness
User stories:
1. As a user, the wizard feels fast and premium on mobile (smooth transitions, readable, tappable).
2. As a user, I can abandon mid-flow without losing progress and return later.
3. As a user, failed uploads clearly tell me what happened and let me retry.
4. As an admin/operator, I can trust analytics events to reflect the funnel accurately.
5. As a user, accessibility settings (reduced motion) are respected.

Work items:
- Ensure `tlj_step_abandon` firing on unload/inactivity.
- Add stable event dedupe ids; ensure `tlj_lead_created` fired after successful submit.
- Tighten conditional validation + migrations for lead schema.
- Improve progress stability (freeze total after Screen 1; ensure back/branch recompute doesn’t change total).
- UI polish: spacing, focus states, error/success colors, 44px targets.

Checkpoint: Full regression pass (mobile + desktop) and fix until stable.

## 3. Next Actions
- Confirm: phone number, WhatsApp link target, and chat provider (or leave as placeholder).
- Implement Phase 1 in one integrated pass (backend models/endpoints + frontend wizard screens + autosave + uploads).
- Run end-to-end verification and inspect Mongo documents for correctness.
- Proceed to Phase 2 (OTP + dashboard) once Phase 1 is stable.

## 4. Success Criteria
- Wizard completes with correct branching for all product types; progress indicator is stable after Screen 1.
- Refresh/back navigation reliably restores state and correct next step.
- Lead submission stores a valid lead record in MongoDB with attribution snapshot and any upload metadata.
- File uploads accept 1–3 images, support retry, and never dead-end the user.
- `tlj_*` events fire for landing, start, step view/complete/back, value reveal, submit attempt, upload states, lead created.
- Account auto-creation works; OTP login allows returning users to access dashboard with their leads/orders.
