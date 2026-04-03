# plan.md — TLJ Advanced Analytics & Tracking System (POC → V1)

## 1) Objectives
- Ship a **founder-level analytics + tracking suite** for TLJ’s landing + multi-step wizard.
- Make tracking **verifiable** (coverage + freshness) and analytics **actionable** (funnel leakage, friction, lead quality, attribution, geo, device).
- Rebuild Admin Analytics into a **tabbed dashboard** with global filters + period comparisons.

## 2) Implementation Steps

### Phase 1 — Core POC: Event Ingestion + Enrichment + 3 Key Aggregates (must pass)
**User stories**
1. As a founder, I want **step views/completions/abandons with timing** so I can see leakage and slow steps.
2. As a founder, I want **geo + device** auto-attached so I can segment instantly.
3. As a founder, I want **attribution (UTM/referrer/landing)** persisted per session/lead.
4. As a founder, I want an **executive snapshot + trends** to validate tracking matches reality.
5. As an operator, I want an **events health** view so tracking can’t silently break.

**Work (POC scope)**
- Web best-practices pass (quick): event naming, step timing, abandon detection, attribution fields.
- Backend `/api/events` (in `server.py`):
  - Expand schema: `event_id`, `client_ts`, `server_ts`, `page_url/path`, `viewport`, `wizard_step`, `field_name`, `error_code`, `attribution`, `ua_raw` + parsed `{device,browser,os}`, `ip`, `geo {country,region,city,timezone,lat,lon}`, `visitor_type`.
  - Add UA parsing + IP geo enrichment (cache by `ip+day`), store enriched event.
- Frontend tracking POC (minimal but correct):
  - `analytics.js`: send `client_ts`, `page_url`, `path`, `viewport`, attribution snapshot; ensure `anonymous_id` + `session_id` stable.
  - `WizardContext.js`: emit `tlj_step_view`, `tlj_step_complete`, `tlj_step_abandon` with step timing.
  - Abandon capture: `visibilitychange` + `beforeunload` (dedupe with a flag).
- Add lead scoring v1 (in `server.py` on `/api/leads/submit`): compute `lead_score` (0–100), `intent_bucket`, `quality_flags`; persist on lead.
- Admin POC endpoints (in `admin_routes.py`):
  - `/api/admin/analytics/executive` (sessions, wizard starts, submits, completion rate, avg step time)
  - `/api/admin/analytics/funnel` (step leakage table: views → completes → abandons + median time)
  - `/api/admin/analytics/events-health` (last_seen + counts for critical events, stale warnings)
- Mongo indexes (in `server.py` lifespan):
  - `events`: `event_name`, `server_timestamp`, `session_id`, `lead_id`, `event_data.step_id` (or `wizard_step`), `geo.country`, `ua_parsed.device`.

**POC exit criteria (blocker gate)**
- In a real browser run, wizard produces consistent: step_view/complete/abandon + timing.
- Geo + UA buckets present on >90% of new events.
- Executive + funnel aggregates match expected counts for a controlled test session.

---

### Phase 2 — V1 App Development: Complete Backend Analytics Engine
**User stories**
1. As a founder, I want **daily/hourly trends** for starts/submits/high-intent leads.
2. As a founder, I want **friction analytics** (top error fields/steps) to prioritize fixes.
3. As a founder, I want **quality by source/geo/device** to scale what works.
4. As a founder, I want **attribution intelligence** (source/medium/campaign/landing) for spend decisions.
5. As an operator, I want an **ops overview** (aging leads, uncontacted, priority queue).

**Work**
- Expand admin analytics endpoints (parameterized by date range + filters):
  - `trends` (daily + hourly)
  - `friction` (field errors, step errors, abandon impact)
  - `quality` (score distribution, by segments)
  - `geo` (country/region/city)
  - `attribution` (UTM/referrer/landing)
  - `device` (device/browser/OS/viewport buckets)
  - `visitors` (new vs returning, session_seq)
  - `lead-ops` (aging buckets, status breakdown, uncontacted)
- Ensure endpoints share a common filter builder (date_from/date_to, source, geo, device, new/returning, intent_bucket).

**Checkpoint tests**
- Curl test each endpoint with small date ranges; verify empty states and performance.

---

### Phase 3 — Dashboard UI: Rebuild `AnalyticsDashboard.js` (Tabbed + Global Filters)
**User stories**
1. As a founder, I want a **global filter bar** so every module stays in sync.
2. As a founder, I want **period deltas** so I can spot changes fast.
3. As a founder, I want a **funnel leakage table** to identify the top drop-off step.
4. As a founder, I want a **friction leaderboard** to see top failing fields/steps.
5. As an operator, I want an **events health tab** to verify tracking is live.

**Work**
- Replace `AnalyticsDashboard.js` with modular tabs (separate components):
  - Executive, Funnel, Friction, Quality, Geo, Attribution, Device, Visitors, Events Health, Smart Insights.
- Global filter bar (persist in URL): presets + custom range; key segment filters.
- V1 visualizations: KPI cards + deltas, line chart (daily), hourly heatmap table (MVP), leakage table, top segments tables.
- Smart Insights v1: rules-based callouts (biggest drop step, worst device, top error field, best hour for high-intent).

---

### Phase 4 — Testing & Polish (regression-safe)
**User stories**
1. As a founder, I want confidence that **tracking didn’t regress** while shipping the dashboard.
2. As an admin, I want dashboard pages to **load fast with clear empty states**.
3. As an operator, I want lead ops metrics to **match CRM reality**.
4. As a founder, I want segmentation filters to **produce consistent results** across tabs.
5. As a developer, I want quick scripts to **re-verify the core flow** after changes.

**Work**
- Backend: curl-based verification checklist for P0 endpoints + event ingest.
- Frontend: screenshot verification of each tab + filter interactions.
- Regression: wizard submit flow, uploads (R2), admin auth, CRM.

## 3) Next Actions (start here)
1. Implement **enhanced `/api/events`**: UA parse + IP geo enrichment + enriched schema write.
2. Add **wizard step_view + step timing + step_abandon** (visibilitychange/beforeunload) in `WizardContext.js` + `analytics.js` payload.
3. Add **lead scoring v1** on `/api/leads/submit` and persist to `leads`.
4. Ship POC endpoints: **executive, funnel, events-health**.
5. Run POC validation: one controlled wizard run → verify DB events → verify aggregates.

## 4) Success Criteria
- **Tracking coverage:** step_view/complete/abandon present for nearly all wizard sessions; step timing populated.
- **Enrichment:** geo + device/browser/OS present on the majority of events; attribution captured.
- **Analytics correctness:** executive + funnel + health endpoints consistent with observed test sessions.
- **Founder utility:** dashboard identifies top drop-off step + top friction field + top high-intent sources.
- **No regressions:** wizard submission, admin CRM, R2 uploads, auth remain functional.
