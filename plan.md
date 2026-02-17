# plan.md

## 1. Objectives
- **(Completed)** Deliver a mobile-first, one-question-per-screen lead wizard that captures qualified jewelry leads and stores them in MongoDB.
- **(Completed)** Implement branching flow + dynamic progress indicator (**Step X of Y**) + back navigation + resume on refresh.
- **(Completed)** Support inspiration uploads (1–3 images) and/or links.
- **(Completed)** Add analytics + attribution capture (UTM/click IDs/cookies) and emit `tlj_*` events.
- **(Completed)** Create accounts automatically on lead submit; enable OTP login and a simple dashboard (Quotations/Orders).
- **(Completed)** Polish, harden, and finalize UX/accessibility so the wizard feels consistently premium across devices and edge cases behave reliably.

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
- File hosting implemented via static mount: `/api/uploads/files/...`.

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
- Screen 12 contact: calm validation rules (no premature errors; clears on change).
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
- Users: created/upserted on lead submission; leads linked to `user_id`.
- OTP:
  - `POST /api/auth/request-otp` → generate + hash OTP, store with expiry + rate limiting. (Dev: OTP returned/logged)
  - `POST /api/auth/verify-otp` → verify + issue JWT.
- Dashboard APIs:
  - `GET /api/me` / `GET /api/me/leads` / `GET /api/me/orders` with JWT auth.

Frontend — **DONE**:
- Login page: email/phone input → OTP entry → verify → redirect to dashboard.
- Dashboard page: tabs for My Quotations + My Orders; empty states + CTA.

Checkpoint — **PASSED**:
- OTP + JWT + data isolation verified.

### Phase 3: Hardening + UX polish + instrumentation completeness — **COMPLETE**
User stories:
1. As a user, the wizard feels fast and premium on mobile (smooth transitions, readable, tappable).
2. As a user, I can abandon mid-flow without losing progress and return later.
3. As a user, failed uploads clearly tell me what happened and let me retry.
4. As an admin/operator, I can trust analytics events to reflect the funnel accurately.
5. As a user, accessibility settings (reduced motion) are respected.

Key fixes and improvements applied:
- **Branching correctness / stale closure fix**
  - Implemented atomic `SET_ANSWER_AND_ADVANCE` reducer action (`setAnswerAndAdvance`) to prevent stale state reads during auto-advance.
- **Session persistence hardening**
  - Improved localStorage save/restore reliability (restore only when `leadId` + meaningful screen exist; cleared corrupted storage).
  - Debounced server autosave only for active wizard screens (not landing/thank you).
- **Rapid click protection**
  - Added `isClickPending` guard in `SingleSelectScreen` and `isAdvancing` state in context to prevent double-advances and mid-transition state glitches.
- **Unicode rendering polish**
  - Replaced literal escapes (`\u2013`, `\u2014`, `\u2190`) with actual characters (–, —, ←) where needed to prevent visible escape text.
- **Icon correctness**
  - Fixed missing Lucide icons in product type list (`Ring` → `Gem`, `Rings` → `CircleDot`).
- **Hydration warning fix**
  - Removed inline styles from `<option>` elements to avoid React hydration warnings.
- **Dashboard UX improvement**
  - Added human-readable formatting for stored enum/id values (e.g., `1.0_1.4` → `1.0 – 1.4 ct`, `5000_10000` → `$5,000 – $10,000`).

Testing status — **PASSED**:
- Backend: **100%** passing (wizard start/autosave/restore, uploads, leads submit, auth OTP, dashboard APIs, events).
- Frontend: **85%+** regression coverage; no bugs found in tested flows.

## 3. Next Actions
- **Production configuration (recommended next step, not required for current completion):**
  - Replace placeholder phone number (`+1234567890`) and WhatsApp link with real business contact info.
  - Decide on and integrate a live chat provider (Crisp/Intercom/Tidio) if required beyond current phone/WhatsApp widget.
  - Replace dev OTP delivery (currently returned/logged) with production email/SMS provider (SMTP/Twilio) and remove `otp_dev` from responses.
  - Lock down CORS origins and JWT secret via environment variables.
- **Optional analytics upgrade (future):**
  - Add `tlj_step_abandon` on unload/inactivity (if required for performance marketing).
  - Add pixel/CAPI integration with event de-duplication IDs (Meta CAPI / TikTok Events API).

## 4. Success Criteria
- Wizard completes with correct branching for all product types; progress indicator remains stable after Screen 1.
- Refresh/back navigation reliably restores state and correct next step.
- Lead submission stores a valid lead record in MongoDB with attribution snapshot and any upload metadata.
- File uploads accept 1–3 images, support retry, and never dead-end the user.
- `tlj_*` events fire correctly for landing/start/step view/complete/back/value reveal/upload states/submit attempt/lead created.
- Account auto-creation works; OTP login allows returning users to access dashboard with their leads/orders.
- Premium mobile UX: no layout shift, no overlapping sticky UI, tappable targets ≥44px, accessible focus states, reduced-motion support.
