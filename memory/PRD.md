# The Local Jewel — PRD

## Product
High-priority lead-generation + e-commerce site for a custom jewelry business ("The Local Jewel"). FARM stack (FastAPI + React CRA + MongoDB). Custom rings, quotes-to-order, IndexNow SEO pings, dynamic sitemap.

## Architecture (current, stable)
- Frontend: Create React App (Craco overrides) at `/app/frontend` — Client-side rendered.
- Backend: FastAPI at `/app/backend` — exposes SEO `/api/sitemap.xml`, robots, projects, etc.
- DB: MongoDB.
- Build context optimization: `/app/.dockerignore` (keeps deploy context ~26MB vs 818MB).
- **Reverted:** Next.js 15 migration was fully aborted; scaffolding moved to `/root/frontend-next-bak/` outside `/app`. **Do not resume.**

## What's Implemented
- 2026-02: ✅ Deployment fix — moved `@craco/craco`, `@babel/plugin-proposal-private-property-in-object`, `autoprefixer`, `postcss`, `tailwindcss` from `devDependencies` → `dependencies` in `/app/frontend/package.json`. Verified clean `yarn build` (21s) and confirmed `NODE_ENV=production yarn install --production` resolves `node_modules/.bin/craco`. Unblocks production deploy pipeline (Step #34 `craco: not found` error).
- 2026-02: ✅ CRA frontend fully restored (rolled back Next.js migration).
- 2026-02: ✅ `/app/.dockerignore` added — fixes deploy build context bloat.
- 2026-02: ✅ Client-side redirect `/products/:slug` → `/projects/:slug`.
- 2026-02: ✅ Removed crashing Helmet dynamic title that broke Babel visual-edits plugin.

## Backlog

### P1 — Next up
- "Re-ping IndexNow for everything" admin button — force Bing recrawl of full catalog in one click.

### P2 — Future
- Apple Login + Passkeys (blocked on Apple Developer account).
- Quote → Order conversion flow + order management.
- Automated SMS/iMessage customer notifications (Twilio).
- "Failed to load custom IP packs" legacy error — no source found in code; consider closing.

## 3rd Party Integrations
- Google OAuth (`@react-oauth/google`)
- Stripe (payments)
- Twilio (SMS OTP)
- SendGrid (email)

## Key DB
- `projects`: `{slug, title, product_type, collections[], price_matrix, ...}`
- `settings`: business info

## Key Endpoints
- `/api/sitemap.xml` (dynamic)
- `/projects/[slug]` (canonical product URL)
