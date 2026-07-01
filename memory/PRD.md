# The Local Jewel — PRD

## Product
Lead-generation + e-commerce site for a custom jewelry business ("The Local Jewel").
Custom lab-grown diamond rings, quote-to-order wizard, shoppable PDPs, blog, admin CRM.
Primary goal of the current phase: **SEO + AI-crawler visibility via true SSR/ISR**.

## Architecture (CURRENT — post Next.js cutover, 2026-06)
> NOTE: An earlier 2026-02 PRD note said "Next.js migration aborted, do not resume."
> That is **STALE**. The Next.js 15 migration was later completed, tested, and
> **cut over live**. This section is the source of truth.

- **Public site = Next.js 15 (App Router)** at `/app/frontend`, served by the
  `frontend` supervisor program (`yarn start` = `next start -H 0.0.0.0`, PORT 3000).
  SSR/ISR for all public routes (revalidate 300s). Real HTML before JS.
- **Legacy CRA = `/app/frontend-legacy`** (production build), served by the
  `legacy-cra` supervisor program via `serve -s .../build -l 3002` on internal port 3002.
- **Reverse proxy:** `/app/frontend/next.config.js` `beforeFiles` rewrites proxy the
  non-migrated routes to the legacy CRA (`http://localhost:3002`):
  `/admin`, `/admin/*`, `/pitch`, `/pitch/*`, `/thank-you`, `/privacy`, `/terms`,
  `/cuts`, `/products/*`, `/projects` (index), `/projects/:slug/v2`, and `/static/*`
  (CRA JS/CSS assets).
- **Backend:** FastAPI at `/app/backend` (port 8001). `/api/*` routed by ingress to backend.
- **DB:** MongoDB.
- **Canonical host:** `www.thelocaljewel.com`. `middleware.js` 301s apex→www (inert on preview).
- **ISR revalidation:** backend `NEXT_REVALIDATE_URL=http://localhost:3000/api/revalidate`
  (+ `NEXT_REVALIDATE_TOKEN`). Admin publish actions ping it.

### Route ownership
- **Next.js (SSR/ISR):** `/`, `/collections`, `/collections/[slug]`, `/projects/[slug]`,
  `/blog`, `/blog/[slug]`, `/contact`, `/cart`, `/checkout/success`, `/login`, `/dashboard`,
  `/sitemap.xml`, `/robots.txt`, `/api/revalidate`.
- **Legacy CRA (static shell served from Next `public/legacy.html`, same process):**
  `/admin/*`, `/pitch`, `/privacy`, `/terms`, `/cuts`, `/products/:slug` (redirect),
  `/projects` (index), `/projects/:slug/v2`. No proxy, no second service.

### PDP behavior (important)
`ProjectDetailPageV2` branches on `project.buyable` (`if (!project.buyable)` → lead-gen
"Start a piece like this" showcase). `is_buyable` = product_type != `custom_project`
AND has ≥1 collection AND price>0 (from `price_matrix`). Buyable PDPs emit full
Product/ProductGroup/Offer/Brand/Shipping schema; showcases emit CreativeWork.
NOTE: the LIST endpoint `/api/projects` returns `buyable=None` (not computed there);
the SINGLE endpoint `/api/projects/{slug}` computes it. Use the single endpoint to check.

### Rollback (cutover) — if Next.js needs to be reverted
```
sudo supervisorctl stop frontend legacy-cra
mv /app/frontend /app/frontend-next
mv /app/frontend-legacy /app/frontend
rm /etc/supervisor/conf.d/legacy-cra.conf
# restore backend/.env NEXT_REVALIDATE_URL back to :3001 if desired
sudo supervisorctl reread && sudo supervisorctl update && sudo supervisorctl restart frontend
```

## What's Implemented
- 2026-06: ✅ **DEPLOY HARDENING — legacy CRA made self-contained (no 2nd service).**
  Root cause of prior deploy failures: the standard Emergent deploy runs only `frontend`
  (Next) + `backend`, but the app secretly depended on a hand-added `legacy-cra` service
  (:3002) + a `serve` binary + `.dockerignore`d `build/` for /admin & other legacy routes,
  so those 502'd in prod. Also the CRA bundle had a STALE preview host hardcoded at build
  time. FIX: baked CRA build into Next `public/` (legacy.html + static/*), switched
  next.config.js rewrites from :3002 proxy to the static `/legacy.html` shell, rebuilt CRA
  with empty REACT_APP_BACKEND_URL (same-origin relative `/api`), and removed the
  `legacy-cra` supervisor conf. Verified live with legacy-cra STOPPED: all legacy routes
  200, CRA admin SPA boots, admin login token via same-origin /api/admin/auth/login,
  authed /api/admin/leads + /api/admin/projects = 200. deployment_agent = GREEN (accurate).
- 2026-06: ✅ **Next.js cutover EXECUTED & VERIFIED (live).** Folder swap
  (`/app/frontend`=Next, `/app/frontend-legacy`=CRA) + new `legacy-cra` supervisor
  program (serve on :3002) + `beforeFiles` reverse-proxy of all non-migrated routes.
  Backend `NEXT_REVALIDATE_URL` repointed to :3000. Verified on the live external URL:
  SSR homepage/collections/projects/blog/contact, www canonical, robots+sitemap,
  Product/ProductGroup/Offer schema on buyable PDPs, /admin login→dashboard through
  proxy, OTP customer login→dashboard, cart→Stripe checkout (real cs_test_ session),
  and all legacy public pages render (no 404s).
- 2026-06: ✅ **Deployment readiness = GREEN (deployment_agent PASS).** Fixes:
  `CORS_ORIGINS="*"` in backend/.env + removed hardcoded CORS fallback in server.py
  (now `os.environ.get("CORS_ORIGINS","*")`); leads CSV export bounded with
  `.limit(50000)`; `.gitignore` rewritten/cleaned so `.env` files deploy.
  Verified live: per-page unique titles/descriptions (real, not placeholders),
  apex→www 301 fires (Host: thelocaljewel.com → 301 www, path preserved; www → 200),
  and a real admin `meta_title` edit auto-flushed the Next ISR cache (SSR `<title>`
  updated with no manual revalidate) then reverted.
  Deploy caveats to monitor: pipeline must `next build` before `next start`, and must
  start the `legacy-cra` service (recognized in supervisor config) for the /admin proxy.
- 2026 (pre-cutover): Waves 1–3 Next migration built + tested on :3001 (see test_result.md).
- 2026-02: CRA deploy fix (craco deps), `.dockerignore`, `/products→/projects` redirect.

## Backlog
### P1 — Next up
- "Re-ping IndexNow for everything" admin button (force Bing recrawl of full catalog).
- ✅ RESOLVED (2026-06): deploy no longer needs a second service. The CRA is served as a
  static SPA from Next `public/` with same-origin relative API calls, so the standard
  single-frontend Emergent deploy (`next build` -> `next start` on :3000 + FastAPI) is
  fully sufficient. deployment_agent = GREEN.
### P2 — Future
- Migrate remaining legacy routes (`/admin/*`, `/pitch`, `/privacy`, `/terms`, `/cuts`) to Next.js to retire the CRA entirely.
- Optional: add `data-testid="product-type-screen"` wrapper on wizard step 2 (QA nicety).
- Apple Login + Passkeys (blocked on Apple Developer account).
- Quote → Order conversion flow; Twilio SMS notifications.

## 3rd Party Integrations
- Google OAuth (`@react-oauth/google`) · Stripe (test mode: `sk_test_emergent`) · Twilio (SMS OTP) · SendGrid (email)

## Key DB
- `projects`: `{slug, title, product_type, collections[], price_matrix, buyable(computed), sale, ...}`
- `collections`, `leads`, `payment_transactions`, `settings`.

## Key Endpoints
- `/api/projects`, `/api/projects/{slug}`, `/api/collections*`, `/api/leads/quick`
- `/api/checkout/session` (Stripe) · `/api/auth/request-otp` · `/api/revalidate` (Next, internal)
- `/api/sitemap.xml` (dynamic), robots
e the CRA entirely.
- Optional: add `data-testid="product-type-screen"` wrapper on wizard step 2 (QA nicety).
- Apple Login + Passkeys (blocked on Apple Developer account).
- Quote → Order conversion flow; Twilio SMS notifications.

## 3rd Party Integrations
- Google OAuth (`@react-oauth/google`) · Stripe (test mode: `sk_test_emergent`) · Twilio (SMS OTP) · SendGrid (email)

## Key DB
- `projects`: `{slug, title, product_type, collections[], price_matrix, buyable(computed), sale, ...}`
- `collections`, `leads`, `payment_transactions`, `settings`.

## Key Endpoints
- `/api/projects`, `/api/projects/{slug}`, `/api/collections*`, `/api/leads/quick`
- `/api/checkout/session` (Stripe) · `/api/auth/request-otp` · `/api/revalidate` (Next, internal)
- `/api/sitemap.xml` (dynamic), robots
