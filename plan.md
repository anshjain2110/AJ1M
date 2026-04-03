# plan.md — TLJ Advanced Analytics & Tracking System (POC → V1) — **Completed**

## 1) Objectives (Updated)
- Ship a **founder-level analytics + tracking intelligence suite** for TLJ’s landing page + multi-step wizard.
- Make tracking **verifiable** (coverage + freshness) and analytics **actionable** (funnel leakage, friction, lead quality, attribution, geo, device).
- Rebuild Admin Analytics into a **tabbed dashboard** with global date presets + period comparisons.
- Ensure **operational usefulness** post-submit: lead ops queues, aging, and uncontacted monitoring.

**Current status:** All phases are implemented and verified. System is in V1 production-ready state.

---

## 2) Implementation Steps (Final Record)

### Phase 1 — Core POC: Event Ingestion + Enrichment + Key Aggregates (**COMPLETED**)
**User stories (delivered)**
1. As a founder, I want **step views/completions/abandons with timing** so I can see leakage and slow steps.
2. As a founder, I want **geo + device** auto-attached so I can segment instantly.
3. As a founder, I want **attribution (UTM/referrer/landing)** persisted per session/lead.
4. As a founder, I want an **executive snapshot + trends** to validate tracking matches reality.
5. As an operator, I want an **events health** view so tracking can’t silently break.

**Work delivered (POC scope)**
- Backend `/api/events` (in `server.py`):
  - Expanded/enriched schema:
    - `event_id`, `client_ts`, `server_timestamp`
    - `page_url`, `page_path`, `viewport`
    - `wizard_step`, `field_name`, `error_code`, `step_time_ms`
    - `attribution` snapshot
    - `ip`, `ua_raw`, `ua_parsed {device,browser,os,is_mobile,is_tablet,is_bot}`
    - `geo {country,region,city,timezone,lat,lon,isp}`
    - `visitor_type`, `visit_count`
  - UA parsing via **user-agents** library.
  - IP geo enrichment via **ip-api.com** with **ip+day** in-memory caching and cache trimming.
- Frontend tracking:
  - `analytics.js` rewritten to send enriched payload (url/path/viewport/attribution/visitor type/visit count).
  - Stable `anonymous_id` (localStorage) + `session_id` (sessionStorage).
  - Wizard instrumentation in `WizardContext.js`:
    - `tlj_step_view`, `tlj_step_complete` with timing.
    - `tlj_step_abandon` with timing (deduped).
  - Abandon capture: `visibilitychange` + `beforeunload` listeners.
  - `tlj_session_start` initialization per session.
- Lead scoring v1 (in `server.py` on `/api/leads/submit`):
  - Computes `lead_score` (0–100), `intent_bucket` (high/medium/low), `quality_flags`.
- Admin POC endpoints (in `admin_routes.py`) delivered and expanded beyond POC:
  - `/api/admin/analytics/executive`
  - `/api/admin/analytics/funnel`
  - `/api/admin/analytics/events-health`
- Mongo indexes (in `server.py` lifespan) added for analytics performance:
  - `events`: `event_name`, `server_timestamp`, `session_id`, `anonymous_id`, compound `(event_name, server_timestamp)`, `geo.country`, `ua_parsed.device`, `wizard_step`, `lead_id`
  - `leads`: `lead_score`, `intent_bucket`

**POC exit criteria (achieved)**
- Wizard produces consistent step events and timing (view/complete; abandon starts populating as users leave mid-step).
- Geo + UA/device enrichment present on new events.
- Executive, funnel, and events-health aggregates match observed system behavior.

---

### Phase 2 — V1 App Development: Complete Backend Analytics Engine (**COMPLETED**)
**User stories (delivered)**
1. As a founder, I want **daily/hourly trends** for starts/submits.
2. As a founder, I want **friction analytics** to prioritize fixes.
3. As a founder, I want **quality by source** to scale what works.
4. As a founder, I want **attribution intelligence** (source/medium/campaign/landing).
5. As an operator, I want an **ops overview** (aging leads, uncontacted, priority queue).

**Work delivered**
- Implemented parameterized analytics endpoints (days + optional date range fields):
  - `/api/admin/analytics/executive`
  - `/api/admin/analytics/funnel` (step-level views/completes/abandons + avg time)
  - `/api/admin/analytics/trends` (daily + hourly)
  - `/api/admin/analytics/friction` (top abandons, slowest steps, field errors, back-navigation)
  - `/api/admin/analytics/quality` (score distribution, intent breakdown, quality by source, quality flags)
  - `/api/admin/analytics/geo` (countries/cities/timezones from enriched events; lead geo when present)
  - `/api/admin/analytics/sources` (source/medium, campaigns, referrers, landing pages)
  - `/api/admin/analytics/devices` (device/browser/OS/viewport)
  - `/api/admin/analytics/visitors` (new vs returning, daily uniques, session depth)
  - `/api/admin/analytics/events-health` (coverage + last-seen freshness; fixed tz-aware comparisons)
  - `/api/admin/analytics/lead-ops` (aging buckets, uncontacted counts, high-intent queue)
  - `/api/admin/analytics/smart-insights` (rules-based insights)
- Frontend resilience: analytics dashboard fetch is tolerant to partial endpoint failures (safeGet per endpoint instead of failing whole Promise.all).

**Checkpoint tests (completed)**
- All endpoints validated via admin auth + live curl checks.
- Empty states render safely where new events have not yet accumulated.

---

### Phase 3 — Dashboard UI: Rebuild `AnalyticsDashboard.js` (Tabbed + Global Filters) (**COMPLETED**)
**User stories (delivered)**
1. As a founder, I want a **global date filter** so every module stays in sync.
2. As a founder, I want **period deltas** so I can spot changes fast.
3. As a founder, I want a **funnel view** to identify top drop-offs.
4. As a founder, I want **friction analytics** (abandon/slow steps/errors/back nav).
5. As an operator, I want an **events health tab** to verify tracking is live.
6. As an operator, I want **lead ops** (aging + priority queue) to drive daily action.

**Work delivered**
- Fully rebuilt `AnalyticsDashboard.js` into a 12-tab intelligence suite:
  1. Overview (Executive)
  2. Funnel
  3. Friction
  4. Lead Quality
  5. Attribution
  6. Geo
  7. Devices
  8. Visitors
  9. Trends
  10. Events Health
  11. Lead Ops
  12. Insights
- Global date presets: Today / 7d / 30d / 90d / All + refresh button.
- Visualizations: KPI cards + deltas, bar charts, tables, daily trend list, hourly heatmap, health status list, lead ops priority table, insight cards.
- Verified via screenshots across multiple tabs and time presets.

---

### Phase 4 — Testing & Polish (regression-safe) (**COMPLETED**)
**User stories (validated)**
1. Tracking didn’t regress while shipping dashboard.
2. Dashboard pages load fast with clear empty states.
3. Ops metrics match CRM reality.
4. Core wizard + admin auth remain functional.

**Testing performed**
- Testing agent report: **96% backend**, **100% frontend**, **100% integration**.
- Verified:
  - Admin login
  - Dashboard loads and all tabs function
  - Date presets + refresh
  - Backend analytics endpoints return valid JSON
  - Enhanced `/api/events` ingest works
  - Wizard flow still works

---

## 3) Next Actions (Post-V1 Enhancements)
> The core build is complete. The following are optional V1.1/V2 improvements.

1. **Backfill / migration (optional):** If desired, map legacy events into new fields (e.g., set `wizard_step` from older `event_data.step_id`).
2. **Field-level friction tracking (optional):** Implement `tlj_field_focus` and `tlj_field_error` emission from specific form inputs for richer validation analytics.
3. **Geo accuracy upgrade (optional):** Swap ip-api.com for a paid provider (higher reliability, HTTPS, better ISP/ASN data) and/or add server-side persistent geo cache.
4. **Segmentation filters (optional):** Add UI controls for source/geo/device/intent filters and pass them to endpoints.
5. **Performance hardening (optional):** Add caching for analytics endpoints (per day range), and paginate large tables.

---

## 4) Success Criteria (Achieved)
- **Tracking coverage:** session_start + step_view/complete/abandon available for new sessions; step timing populated.
- **Enrichment:** UA/device + geo attached to new events; attribution snapshot captured per session.
- **Analytics correctness:** executive + funnel + health endpoints consistent with observed sessions and DB contents.
- **Founder utility:** dashboard highlights funnel behavior, back-navigation friction, attribution/source mix, and uncontacted lead operational risk.
- **No regressions:** wizard submission, admin CRM, R2 uploads, and admin auth remain functional.
