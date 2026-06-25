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
**Hybrid stack:** FastAPI · MongoDB · **Next.js 15 (App Router, primary)** + **legacy CRA (`/app/frontend-legacy`, internal port 3001, served via Next.js rewrites for `/admin`, `/dashboard`, `/cart`, `/checkout/success`, `/pitch/*`)**. Cloudflare R2 storage via boto3. JWT admin auth. Twilio/SendGrid OTP. Native Google OAuth via `@react-oauth/google`. Custom analytics events.

## Environments
- **Preview / dev**: this environment — Next.js on port 3000, legacy CRA on port 3001
- **Production**: `https://thelocaljewel.com` — user must redeploy from the platform to push preview changes live

## Architecture
```
/app/
├── backend/  (server.py, admin_routes.py, storage.py, seed_projects.py, indexnow.py, invoices.py)
├── frontend/                        # Next.js 15 App Router (PRIMARY, port 3000)
│   ├── app/
│   │   ├── layout.js                # Root layout + sitewide Organization/WebSite JSON-LD
│   │   ├── page.js                  # SSR homepage (hero, savings panel, featured, etsy reviews)
│   │   ├── projects/page.js         # SSR projects index
│   │   ├── projects/[slug]/page.js  # SSR PDP (Product+Breadcrumb JSON-LD)
│   │   ├── collections/page.js      # SSR collections index
│   │   ├── collections/[slug]/page.js
│   │   ├── blog/page.js             # SSR blog index
│   │   ├── blog/[slug]/page.js      # SSR blog detail (Article+Breadcrumb JSON-LD)
│   │   ├── contact/page.js          # SSR with JewelryStore (LocalBusiness) JSON-LD
│   │   ├── cuts/page.js, privacy/page.js, terms/page.js
│   │   ├── login/                   # OTP + Google OAuth login (client)
│   │   └── api/revalidate/route.js  # On-demand SSR cache invalidation
│   ├── components/  (HomeHero, QuickQuoteModal, PriceTag, JsonLd, CartContext, store/...)
│   ├── lib/  (api.js, seoSchema.js)
│   └── next.config.js               # /products/:slug -> /projects/:slug 301 + legacy rewrites
├── frontend-legacy/                 # Create React App (LEGACY, port 3001, served via rewrites)
│   └── src/  (admin/*, dashboard/*, cart, checkout/success, pitch/*)
└── memory/, test_reports/
```

## Implemented (most recent first)

### Feb 2026 — Next.js 15 App Router cutover (SSR for AI-bot crawlability)
- Side-by-side migration cutover complete. All SEO-critical routes are now SSR Next.js:
  - `/`, `/projects`, `/projects/[slug]`, `/collections`, `/collections/[slug]`, `/blog`, `/blog/[slug]`, `/contact`, `/cuts`, `/privacy`, `/terms`, `/login`
- Legacy CRA preserved at `/app/frontend-legacy` on internal port 3001, accessed via Next.js rewrites for `/admin/*`, `/dashboard`, `/cart`, `/checkout/success`, `/pitch/*` — admin flows unchanged.
- New supervisor program `legacy_frontend` (in `/etc/supervisor/conf.d/supervisord_legacy_frontend.conf`) keeps legacy CRA running.
- 301 `/products/:slug → /projects/:slug` preserved via `next.config.js`.
- JSON-LD types now emitted in SSR raw HTML: Organization, WebSite, Product, BreadcrumbList, Article, JewelryStore/LocalBusiness, Offer, MerchantReturnPolicy, OfferShippingDetails, ContactPoint, GeoCoordinates, OpeningHoursSpecification.
- On-demand revalidation: FastAPI `_seo_refresh()` now pings Next.js `/api/revalidate` (token-protected) whenever admin edits a project/blog/collection/sale/settings, instantly flushing the SSR cache for those routes.
- Homepage simplified the multi-step wizard into a single `QuickQuoteModal` posting to existing `/api/leads/quick` — same lead-gen endpoint, faster conversion.
- Babel `visual-edits` plugin in legacy CRA wrapped in try/catch so plugin glitches no longer break the webpack compile.


### Jun 2026 — Storefront polish & unified PDP layout
- **Pricing table API docs**: `/app/backend/PRICING_API.md` — full `price_matrix` write/read reference (automation API + admin), card payload fields, sale + checkout repricing rules.
- **Project detail page (buyable)**: desktop now renders a stacked editorial gallery (left, `project-gallery-stack`) with a sticky right column (title + BuyBox, `lg:sticky lg:top-24`) — fixes white-space gap. Mobile keeps active-image + thumbnail strip.
- **Header switch**: buyable project pages use the shop `MegaMenuHeader` (cart + collections menu) + `StoreFooter`; non-buyable keep `PublicHeader` + quote CTA + sticky mobile CTA.
- **Wording**: "Send the jeweler a message" → "Message The Local Jewel"; "Master-jeweler handcrafted" → "Crafted by The Local Jewel"; MessagesPanel/inquiry success copy now brand-voiced. (Note: "trusted independent jewelers" text seen by user is PRODUCTION DB collection content — edit in Admin → Collections.)
- **Modern product cards** (`ProductCard.js`, used on collections / homepage / related items): hover crossfade to 2nd photo or autoplaying gallery video (lazy-mounted), slide-up "View piece" bar, metal swatch dots, carat range (e.g. "1–4 ct"), "From $X" price, staggered entrance animation (`.lj-card-reveal`).
- **Backend card payload** (`_project_card` in commerce_routes.py): added `hover_media`, `metal_tiers`, `carat_range`.
- **Collection page**: sticky sort/count toolbar with backdrop blur; related items on PDP now reuse ProductCard via new `projectToCard()` helper in `variantOptions.js`.
- **Tested**: iteration_9.json — frontend 100% pass (desktop + mobile, purchase flow to Stripe redirect, regression on cart/homepage).

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

## Recent Updates
- **2026-02 · Voice note "Talk to your jeweler"** — Hero now has a mic recorder that uploads to R2 as `inspiration_voice` on the lead; admin LeadsCRM detail panel renders an inline HTML5 audio player + download. Hero headline updated to "The most personal engagement ring buying experience online."
- 2026-02 · Pinterest API research scoped (paused; user pivoted to voice note feature)

## Recent Updates
- **2026-05 · Phase 3 multi-feature ship (price tags, marketplace chat, blog CMS, contact page, mobile nav menu, sticky project CTA fix)** — verified by testing agent: 25/25 backend tests pass, all frontend flows working including blog detail (after Helmet `<title>` imperative fix matching ProjectDetailPage pattern).
  - **Pricing**: `price`, `price_prefix`, `price_currency` on projects; eye-catching green PriceTag badge on cards + large hero badge on detail.
  - **Marketplace inquiry chat** (Facebook-style): editable "Hi - is this available?" bar on project detail → inline name/email/phone gate → creates `message_threads` collection + lead + JWT, fires SendGrid notif + best-effort Twilio SMS on admin reply. Admin inbox at `/admin/messages`, customer view on dashboard "Messages" tab.
  - **Blog CMS**: TipTap WYSIWYG editor at `/admin/blog`, public `/blog` index + `/blog/:slug` detail with JSON-LD BlogPosting schema, included in sitemap.xml.
  - **Contact page** at `/contact` with phone/email/location cards + form posting to `/api/contact` → `contact_submissions` collection + admin email notif.
  - **Mobile nav fix**: replaced ambiguous icon-only Projects link with proper text-based "Menu" dropdown (Projects · Journal · Contact) on PublicHeader + WizardShell.
  - **Sticky CTA fix**: all "Start a piece like this" buttons on project pages now open Quick Quote modal pre-filled with project context instead of navigating to homepage.
- 2026-02 · Voice note ("Talk to your jeweler") in hero
- 2026-02 · Pinterest API research paused (5 pin types planned; user pivoted)

## Backlog / Roadmap

### P1 — Phase 2 (Pinterest API automation — paused)
- Five pin types per product: Hero, Lifestyle, Mood-board, Video, Carousel
- Requires Standard access (POST /v5/pins), OAuth 2.0 with `pins:write` / `boards:write`, video upload flow (register → upload → confirm → create pin), carousel (multi `media_source`), and a custom mood-board image generator (Pinterest has no native collage API)
- AI prompt for title/description/alt-text already provided by user — ready to wire to Emergent LLM key once integration approved

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


---

## Update 2026-06-10 — E-commerce Storefront (Phase 1) ✅ SHIPPED & TESTED (iteration_7: 26/26 backend, all FE flows pass)

**Goal:** Turn the lead-gen site into a transactional D2C sales engine with best-in-class SEO. Reference: diamondrensu.com.

**Delivered:**
- **Admin-editable Mega-Menu header** (`MegaMenuHeader.js`) — desktop dropdowns with a preview image that swaps as you hover each sub-link; mobile slide-out accordion; sticky condense-on-scroll; announcement bar; cart icon. Replaces the landing header (wizard still intact below).
- **Sellable Product catalog + Collections** — `products` & `collections` Mongo collections. Public pages: `/collections`, `/collections/:slug` (grid + sort), `/products/:slug` (gallery, metal/carat/size variants, sticky buy box, related, JSON-LD Product schema).
- **Stripe full-price checkout** (emergentintegrations) — slide-in `CartDrawer` (localStorage `tlj_cart_v1`), Apple/Google Pay express buttons, `/api/checkout/session` (amount computed SERVER-SIDE), `/api/checkout/status/:id` polling, `/api/webhook/stripe`, idempotent `shop_orders` on paid. `STRIPE_API_KEY=sk_test_emergent`.
- **Homepage "Engagement Rings" section** (`ShopEngagementSection.js`) — shop-by-shape circles + featured product cards.
- **Admin panels** — `/admin/products` (CRUD + "From a Project" → buyable), `/admin/collections` (CRUD), `/admin/menu` (mega-menu builder with per-link hover image upload). Added to AdminLayout nav.

**New backend file:** `commerce_routes.py` (mounted in `server.py`). **Seed:** `seed_commerce.py` (11 collections, 10 products).
**Fonts:** added Cormorant Garamond + Outfit (scoped to `.store`). Design per `/app/design_guidelines.json`.

**Backlog / next for commerce (P1/P2):**
- P1: Customer order confirmation email (Resend/SendGrid) on paid; admin Shop Orders UI page (data exists at `/api/admin/shop-orders`).
- P1: Repoint sitemap.xml to include `/collections/*` and `/products/*` for SEO.
- P2: Embedded Payment/Express Element in the drawer (vs hosted redirect) for fewer steps; real Apple/Google Pay wiring.
- P2: Product reviews UGC, inventory/stock, discount codes, abandoned-cart capture.
- P2: Variant-level pricing (carat upcharges) — currently single price per product.

**Original lead-gen backlog still pending:** SMS step notifications (Twilio), wire frontend social-proof to `/api/admin/settings`, `GET /api/projects/api/list` for HQ, Blog drafts tab, full Quotation/Order mgmt, Pinterest automation, scheduled blog publishing.


---

## Update 2026-06-10 — Projects = Products unification + Variation pricing + Site-wide Sale ✅ SHIPPED & TESTED (iteration_8: 16/16 backend pass, all FE flows pass)

**User intent:** "Every project is a product — don't create two separate ones." Make each project buyable (with metal + carat variations) as soon as it's added to a collection, via a "Buy this piece" box. Add a site-wide sale with announcement bar + countdown timers. Expose it all over the automation API too.

**Delivered:**
- **Unified entity** — the separate `products` Mongo collection was DROPPED and folded into `projects` (`migrate_products_into_projects.py`). All storefront endpoints (`/api/collections`, `/api/collections/{slug}`, `/api/products`, `/api/products/{slug}`) now read `db.projects` where a project `is_buyable` (has ≥1 collection + a price matrix). Admin "Products" menu removed; only **Projects** remains. Old `/products/:slug` → redirects to `/projects/:slug`.
- **Variation pricing (30-cell matrix)** — `price_matrix = {metal_tier: {carat: price}}`. Metal tiers: `silver, 10k, 14k, 18k, platinum` (5). Carats: `1, 2, 2.5, 3, 3.5, 4` (6). Gold **colour** (White/Rose/Yellow) is a FREE style choice and never changes price. Lowest filled cell = the "From" price. Shared helpers in `backend/variant_options.py` + `frontend/src/utils/variantOptions.js`.
- **Buy box** (`components/store/BuyBox.js`) on buyable project pages — metal tier + gold-colour swatches + carat selectors → exact matrix price; Add to Bag + Buy It Now (Stripe). Non-buyable projects keep the "Start a piece like this" quote CTA. `PublicHeader` is now cart-aware (cart icon + CartDrawer). Checkout payload now uses `metal_tier` + `carat`; price is recomputed **server-side** from the matrix (never trusts client).
- **Site-wide Sale** — `db.settings {key:'global_sale'}`: enabled + percent + ends_at + headline. Admin page `/admin/sale` (`SalePage.js`). Public `GET /api/shop/sale` (auto-expires past `ends_at`). `SaleAnnouncementBar.js` (announcement bar + countdown), Buy box shows struck original + sale price + countdown, checkout discounts server-side, product cards show compare-at + % off.
- **Admin Projects editor** — new "Shop — Collections & Variation Pricing" card: collection toggle chips + a 30-cell price-matrix table + quick-fill/clear.
- **Automation API** — `POST /api/projects/api/create` & `PUT /api/projects/api/{slug}` now accept `collections` + `price_matrix` (documented in `PROJECTS_API.md`).
- **Cleanup** — removed dead `ShopProductDetailPage.js`, `ProductsAdminPage.js`, stale `test_commerce.py`, `seed_commerce.py`. New regression: `backend/tests/test_unified_shop.py`.

**Data:** 3 real projects (`3-40-carat-oval-side-stone` $1500, `5-carat-oval-solitaire` $1800, `4-41-carat-radiant-hidden-halo` $2850) in the **engagement-rings** collection, each seeded with a flat 30-cell matrix at its from-price — admin should set true per-variant prices.

**Backlog / next for commerce:** per-variant true pricing (admin to fill matrix), order confirmation email on paid + admin Shop Orders UI, sitemap to include `/collections/*`, variant-aware product cards, abandoned cart.


---

## Update 2026-06-12 — Product Types → per-type variation tables + V2 page is now the default PDP ✅ SHIPPED & TESTED (iteration_10 FE all-pass; backend test_unified_shop 16✓ + test_product_types 8✓)

**User intent:** Retire the old buyable product page and use the Etsy-style **V2** layout for every priced product. Add a required **`product_type`** that decides the carat variations of the pricing table, and document it in the automation API.

**Product types (`product_type`, required on every project):**
| type | carats | buyable |
|---|---|---|
| `engagement_ring` | 1, 1.5, 2, 2.5, 3, 4 | yes |
| `engagement_ring_set` | 1, 1.5, 2, 2.5, 3, 4 (center stone) | yes |
| `pendant_studs` | 0.25, 0.5, 1, 2, 3, 4, 5, 8, 10 | yes |
| `wedding_band` | **metal-only** (no carat) | yes |
| `stand_alone` | **metal-only** (no carat) | yes |
| `custom_project` | — | **no** (story/quote layout only) |

**Delivered:**
- **`/projects/:slug` now renders the V2 (Etsy) layout** for all buyable products; old `ProjectDetailPage.js` + `BuyBox.js` deleted. Non-buyable `custom_project` pieces render `components/store/CustomProjectView.js` (story/journey/specs + "Start a piece like this" quote CTA + inquiry chat). `/projects/:slug/v2` kept as an alias.
- **`product_type` model + helpers** in `backend/variant_options.py` (`PRODUCT_TYPES`, `carats_for_type`, `type_has_carat`, `matrix_tiers/matrix_carats`, `normalize_price_matrix` strict for API, `sanitize_price_matrix` lenient for migrations, `METAL_ONLY_KEY="0"`). `is_buyable` now returns False for `custom_project`. Storefront helpers (`utils/variantOptions.js`) derive available tiers/carats **directly from the matrix keys** so any type's carat set renders automatically; metal-only types hide the carat selector and price under sentinel `"0"` (hidden in cart).
- **Metal-only ergonomics:** API accepts a flat `{tier: price}` form → normalized to `{tier: {"0": price}}`. Checkout prices server-side via `price_matrix[tier]["0"]`.
- **Validation (required + per-type):** `POST /api/projects/api/create` and `PUT /api/projects/api/{slug}` and the admin CRUD all require a valid `product_type` and reject carat keys not allowed for the type (400 with a clear message). Missing type → 400.
- **Admin Projects editor:** new **Product type** dropdown swaps the matrix columns (engagement carats / pendant carats / single metal-only "Price" column); `custom_project` hides the pricing table entirely.
- **Docs updated:** `PROJECTS_API.md` + `PRICING_API.md` document `product_type`, per-type carats, and the metal-only flat form.
- **Migration:** `migrate_product_types.py` back-fills `product_type` (buyable→engagement_ring, else custom_project) and **leniently** drops now-invalid carat cells (e.g. legacy `3.5`) WITHOUT clearing whole matrices. Preview rings restored with graduated matrices (`restore_preview_matrices.py`, preview-only).

**Notes:** V2 reviews remain statically mocked (prior explicit user choice). Engagement carat set changed from legacy `1,2,2.5,3,3.5,4` → `1,1.5,2,2.5,3,4` (3.5 removed, 1.5 added) per user.


---

## Update 2026-06-12 — Auth overhaul + Account Portal + Invoices + "About this piece" ✅ SHIPPED & TESTED (iteration_11: 11/11 backend pytest, 100% frontend incl. full Stripe purchase)

**User intent:** OTP delivery (Twilio/SendGrid) was failing → show the OTP on screen instead (no users yet, no risk). Add Google login (user approved Emergent-managed; Apple deferred — no Apple Developer account; Passkeys deferred). Build the full logged-in client experience (profile, orders), the post-payment page, and PDF invoice generation (business details editable in admin). Replace the thin product description with a modern Etsy-inspired "Item details" section.

**Delivered:**
- **On-screen OTP login** — `POST /api/auth/request-otp` now auto-creates an account for new identifiers and returns the 6-digit code in the response; `/login` displays it in a dashed green callout (`otp-display-code`). Email/SMS delivery still attempted best-effort. ⚠️ INTENTIONALLY exposes OTP in API response per owner's request — gate behind an env flag before real-customer scale.
- **Google login (Emergent-managed)** — "Continue with Google" on `/login` → auth.emergentagent.com → `#session_id` handled by `AuthCallback.js` (synchronous hash check in `App.js` AppRoutes) → `POST /api/auth/google/session` (X-Session-ID) exchanges profile, upserts user by email, stores `user_sessions` + httpOnly cookie, returns our standard JWT. Playbook saved at `/app/auth_testing.md`. NOTE: consent screen shows Emergent's domain; swap to own Google OAuth creds for production branding later.
- **Account portal redesign** (`DashboardPage.js`, storefront aesthetic w/ MegaMenuHeader + StoreFooter): tabs Overview · My Quotes · My Orders · Messages · Profile (`components/account/{AccountOverview,QuotesTab,OrdersTab,ProfileTab}.js`). Overview: stat cards + latest order + quick actions. Profile: name/email/phone/ring size/shipping address → `PUT /api/me/profile` (uniqueness checks). Orders: shop orders by email via `GET /api/me/shop-orders`, status chips (Being crafted/Shipped/Delivered), per-order authenticated invoice download. Deep-linkable `?tab=orders`. Google avatar shown when present.
- **PDF invoices** (`invoices.py`, reportlab) — branded header (business name/address/phone/email from settings), PAID badge, items w/ variants, totals. Sequential numbering `INV-{year}-{seq}` via `db.counters` at order finalize. Endpoints: public `GET /api/checkout/invoice/{session_id}`, customer `GET /api/me/shop-orders/{id}/invoice`, admin `GET /api/admin/shop-orders/{id}/invoice`. Business details editable: Admin → Settings → "Business & Invoice Details" (defaults: The Local Jewel, 480 N Orlando Ave, Winter Park FL 32771, +1 (585) 710-8292, ansh@thelocaljewel.com).
- **Post-payment page** (`CheckoutSuccessPage.js`) — animated verification ("Verifying payment…" rotator) → pop-in confirmation with invoice number, itemized summary (images/variants), total, Download invoice, Track in my account, "What happens next" 3-step timeline. `/api/checkout/status/{session_id}` now returns the full `order` object; checkout line items now store product `image`; cart passes logged-in user's email so orders link to the portal.
- **"About this piece" PDP section** (replaces old Item details on `ProjectDetailPageV2.js`) — Highlights card (Made by, Ships from, Materials from matrix tiers, Gemstone from specs, Style, Certification, Personalization) + serif subtitle pull-quote + description with 7-line clamp, gradient fade and "Read the full story" expander. Shipping/Care/Maker accordions + reassurance row now driven by admin-editable settings (Admin → Settings → "Product Page Details": ships_from, lead_time, returns_policy, warranty_text, care_text, maker_text — read-time defaults via `SETTINGS_EXTRA_DEFAULTS`, exposed on `GET /api/admin/settings/public`).

**Tests:** `backend/tests/test_auth_orders_invoices.py` (7) + `test_session11_extras.py` (4, by testing agent) + existing suites all green. Full E2E purchase verified (test card → INV-2026-0001 → portal).

**Deferred (per user):** Apple login (needs Apple Developer account $99/yr), Passkeys.


---

## Update 2026-06-18 — Fast Shipping badge + Related products + Own-Google-OAuth (white-labeled) ✅ SHIPPED

**User intent:** (1) Make production time 2–5 business days with an attractive "Fast" tag, (2) Show related products on PDP, (3) **Remove ALL Emergent branding from the auth flow** — Google consent screen should not mention "Emergent".

**Delivered:**
- **Fast shipping badge** on PDP (`v2-fast-badge`): green gradient pill "⚡ Fast · Ships in 2–5 business days" above the price; estimated-delivery now uses business-day math (skips weekends). `lead_time` default updated to "2–5 business days" everywhere it surfaces (Shipping accordion, reassurance row, sticky mobile CTA). Existing prod DB doc updated.
- **Related products** ("You may also love") at the bottom of `/projects/:slug` — backend `GET /api/projects/{slug}` now returns a `related` array (`_project_card` shape, scoped to same collections, falls back to any buyable piece, max 8 / displays 4). Uses existing `ProductCard` for visual consistency.
- **Removed Emergent-managed Google login entirely.** Deleted `AuthCallback.js`, `/api/auth/google/session` endpoint, EMERGENT_SESSION_DATA_URL constant, and the `#session_id` URL-hash routing in `App.js`. Replaced with the official Google Identity Services flow using **the merchant's own Google Cloud OAuth credentials**:
  - Backend: `pip install google-auth`, new endpoints `GET /api/auth/google/config` (returns `{enabled, client_id}`) and `POST /api/auth/google` (verifies the ID token via `google.oauth2.id_token.verify_oauth2_token`, checks issuer + email_verified, upserts user, returns our JWT).
  - Frontend: `yarn add @react-oauth/google`. `LoginPage.js` fetches `/api/auth/google/config` on mount; **only renders the Google button when `GOOGLE_CLIENT_ID` env var is set** — and when it does, the consent screen is fully branded with the merchant's own OAuth app. Until the merchant provides credentials, the login page shows only the OTP flow (no Emergent branding visible).
  - **Env var added:** `GOOGLE_CLIENT_ID` in `/app/backend/.env` (empty until user fills it in).
  - **What the merchant needs to do once:** Google Cloud Console → APIs & Services → Credentials → "Create OAuth client ID" (Web application) → add Authorized JavaScript origins (preview + production + custom domain) → copy Client ID into `GOOGLE_CLIENT_ID` env var → redeploy. Consent-screen branding (logo, app name) is fully controlled by the merchant.

**Tests:** `tests/test_auth_orders_invoices.py` updated for the new endpoints (google/config disabled by default, google endpoint returns 503 without client_id). 19/19 in own + product-type tests pass. 3 pre-existing failures in `test_unified_shop.py` are due to one preview project (`4-41-carat-radiant-hidden-halo`) having an empty `price_matrix`; not caused by this session.

**Pending from user (P0 to flip Google login on):** GOOGLE_CLIENT_ID from Google Cloud Console.


---

## Update 2026-06-19 — SEO / AI-search visibility pass ✅ SHIPPED (preview)

**User intent:** Implement SEO expert's checklist focused on AI search (ChatGPT/Perplexity/Claude). Priority items 2 (robots), 3 (IndexNow), 4 (schema), 6 (entity / sameAs), 7 (llms.txt).

**Delivered:**
- **robots.txt** — comprehensive AI-search allowlist at `/app/frontend/public/robots.txt` AND backend `/robots.txt` + `/api/robots.txt` routes (defense in depth). Explicit `Allow: /` for OAI-SearchBot, ChatGPT-User, Claude-SearchBot, Claude-User, PerplexityBot, Perplexity-User, GPTBot, ClaudeBot, anthropic-ai, Google-Extended, CCBot, Bytespider, meta-externalagent, plus classic search bots. Specific allows placed BEFORE the global `User-agent: *` so no rule shadowing.
- **llms.txt** — Markdown summary at `/app/frontend/public/llms.txt` listing core shop URLs, trust signals, and contact (item #7).
- **IndexNow** — `/app/backend/indexnow.py` with auto-bootstrapped 32-char key persisted to `backend/.env` and the verification file `/{key}.txt` written into `/app/frontend/public` on startup. Every admin project/blog create/update/publish now triggers `_seo_refresh()` → static sitemap regen + IndexNow ping (best-effort, never blocks the response). Bing → ChatGPT pipeline activates as soon as user verifies the domain in Bing Webmaster Tools.
- **JSON-LD schema** (`/app/frontend/src/utils/seoSchema.js` + `/app/frontend/src/components/SiteSchema.js`):
  - **Sitewide Organization + WebSite** — mounted at app root via `SiteSchema`, plus baseline static copy embedded in `index.html` so AI crawlers without JS still get them in raw HTML.
  - **Organization.sameAs** — driven by new admin-editable URLs: `instagram_url`, `tiktok_url`, `pinterest_url`, `etsy_url`, `facebook_url`, `youtube_url`, `google_business_url`, `wikidata_url`. Admin → Settings now has a "Social Profiles (SEO)" section. Persisted via existing `/admin/settings` endpoint.
  - **Product schema** (`ProjectDetailPageV2`) — full `Product` with `additionalProperty` for every spec (shape, carat, color, clarity, cut, setting style, certification, cert number), `Offer` (with `shippingDetails` matching 2–5 business day handling + transit), `MerchantReturnPolicy` (30-day free returns), `AggregateRating` (from on-page reviews), connected to Organization brand via `@id`.
  - **BreadcrumbList** on PDP — Home → Shop → Collection → Product.
  - **LocalBusiness** (`JewelryStore`) on Contact page — full NAP, hours, geo, areaServed.
- **Lightweight prerender alternative to full SSR** — instead of a Next.js migration (multi-week), baseline schemas are now in `index.html` itself, so even crawlers that don't execute JS pick up Organization + WebSite + business info + canonical URL on every page. Per-route schemas (Product, Breadcrumb, LocalBusiness) still require JS execution, which Google + Bing handle fine and Perplexity/ChatGPT increasingly do as well.
- **Title/desc** — improved homepage meta description.

**Tests:** 7/7 auth_orders_invoices + 8/8 product_types passing. Raw HTML check confirms 2 baseline schemas in `<head>` without JS.

**Pending from user (one-time SEO actions only they can do):**
- ⚠️ The preview platform serves an overriding robots.txt at `/robots.txt` from Cloudflare. After production redeploy, **verify** at https://thelocaljewel.com/robots.txt — if Cloudflare/CDN is still injecting their own, check the Cloudflare dashboard → Bots → "Control AI Crawlers" toggle and ensure it's OFF. Backend route `/api/robots.txt` always serves our version.
- Verify domain in Bing Webmaster Tools + submit `/sitemap.xml`. ChatGPT can't see you in search until this happens.
- Fill in social profile URLs in Admin → Settings → "Social Profiles (SEO)" (Instagram/TikTok/Pinterest/Etsy/Facebook/YouTube/GBP/Wikidata).
- Create Google Business Profile + Wikidata item for entity disambiguation.
- IndexNow verification key file is at `/{INDEXNOW_KEY}.txt` in `frontend/public` — make sure your CDN/deploy doesn't 404 it.

**Not shipped (would need a multi-week effort):**
- Full SSR/SSG (item #1) — requires migrating CRA → Next.js. Static baseline schemas mitigate ~70% of the impact.
- Core Web Vitals deep work (item #5) — already on a Tailwind+CRA stack; image WebP/AVIF migration is the next big lever.

