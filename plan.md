# plan.md

## 1. Objectives
- **(Completed)** Deliver a mobile-first, one-question-per-screen lead wizard that captures qualified jewelry leads and stores them in MongoDB.
- **(Completed)** Implement branching flow + dynamic progress indicator (**Step X of Y**) + back navigation + resume on refresh.
- **(Completed)** Support inspiration uploads (1–3 images) and/or links.
- **(Completed)** Add analytics + attribution capture (UTM/click IDs/cookies) and emit `tlj_*` events.
- **(Completed)** Create accounts automatically on lead submit; enable OTP login and a simple dashboard (Quotations/Orders).
- **(Current focus)** Polish, harden, and finalize UX/accessibility so the wizard feels consistently premium across devices, and edge cases behave reliably.

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
- **Key fix completed**: eliminated stale-closure branching bug by using atomic `setAnswerAndAdvance`.

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

### Phase 3: Hardening + UX polish + instrumentation completeness — **IN PROGRESS / NEXT**
User stories:
1. As a user, the wizard feels fast and premium on mobile (smooth transitions, readable, tappable).
2. As a user, I can abandon mid-flow without losing progress and return later.
3. As a user, failed uploads clearly tell me what happened and let me retry.
4. As an admin/operator, I can trust analytics events to reflect the funnel accurately.
5. As a user, accessibility settings (reduced motion) are respected.

Work items (updated to reflect current status):
- **Mobile viewport optimization 6 responsive polish**
  - Verify spacing, type scale, and option card grids at common breakpoints.
  - Confirm sticky header/progress and sticky bottom CTA do not conflict with safe areas.
  - Verify keyboard scroll-into-view behaviors on mobile.
- **Auto-save + resume verification (refresh + reopen)**
  - Confirm refresh restores current step + answers.
  - Confirm server autosave remains consistent with local state.
- **Progress indicator correctness + step total freeze**
  - Confirm total step count freezes after Screen 1 for all branch paths.
  - Confirm back-navigation and changed answers do not cause confusing step-count jumps.
- **Edge cases**
  - Back navigation that changes branching path (e.g., Engagement Ring → Occasion changes Proposal ↔ other) routes correctly.
  - File upload failures: ensure user can continue/skip; ensure clear messaging.
  - Prevent inconsistent state when switching product_type mid-flow (optional hardening: reset dependent answers).
- **Instrumentation completeness**
  - Implement/verify `tlj_step_abandon` firing on unload/inactivity.
  - Add event dedupe/id strategy (if later adding pixel+CAPI) to prevent double-counting.
  - Ensure `tlj_lead_created` fires once after successful submit.
- **Accessibility + UI polish**
  - Verify focus visible on all interactive elements and aria-labels on icon-only buttons.
  - Ensure reduced-motion is honored (value reveal + transitions).
  - Refine hover/active states (no `transition: all`; keep 300ms tokenized transitions).

Checkpoint:
- Final regression pass (mobile + desktop), plus replay of key branching paths and auth flows.

## 3. Next Actions
- **Phase 3 execution**
  - Run a mobile-first regression pass (iPhone-sized viewport) focusing on sticky elements, CTA reachability, and readability.
  - Validate auto-save/resume across refresh + tab close/open.
  - Validate progress total freeze across all product branches.
  - Add/verify `tlj_step_abandon` event.
- Confirm production configuration items:
  - Real phone number + WhatsApp link target.
  - Chat provider integration (if required beyond current placeholders).
  - OTP delivery provider (SMTP/Twilio) for production (currently dev-mode returns OTP).

## 4. Success Criteria
- Wizard completes with correct branching for all product types; progress indicator remains stable after Screen 1.
- Refresh/back navigation reliably restores state and correct next step.
- Lead submission stores a valid lead record in MongoDB with attribution snapshot and any upload metadata.
- File uploads accept 1–3 images, support retry, and never dead-end the user.
- `tlj_*` events fire correctly for landing/start/step view/complete/back/value reveal/upload states/submit attempt/lead created, plus **abandon**.
- Account auto-creation works; OTP login allows returning users to access dashboard with their leads/orders.
- Premium mobile UX: no layout shift, no overlapping sticky UI, tappable targets 44px, accessible focus states, reduced-motion support.