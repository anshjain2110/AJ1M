# Test Credentials — The Local Jewel

## Customer Login (/login) — On-screen OTP + Own Google OAuth
- **OTP flow**: enter ANY email/phone on /login → POST /api/auth/request-otp returns the 6-digit code in the JSON response (`otp` field) AND it is displayed on screen (data-testid="otp-display-code"). Enter it to sign in. First-time identifiers auto-create an account.
- **Google login (white-labeled)**: only renders when `GOOGLE_CLIENT_ID` env var is set in `/app/backend/.env`. Uses the merchant's own Google Cloud OAuth credentials — no Emergent branding. Frontend uses `@react-oauth/google` <GoogleLogin>; backend verifies the ID token at POST /api/auth/google and returns our JWT.
- Customer JWT stored in localStorage as `tlj_token`, user as `tlj_user`.

## To enable Google login (one-time setup by merchant)
1. Google Cloud Console → APIs & Services → Credentials → Create OAuth client ID → Web application.
2. Authorized JavaScript origins: add `https://local-jewel-v2.preview.emergentagent.com`, `https://thelocaljewel.com`, and any other custom domains.
3. Authorized redirect URIs: not needed for this Identity-Services flow (we use ID token only), but harmless to add the same origins.
4. Copy the Client ID, set `GOOGLE_CLIENT_ID=<id>` in `/app/backend/.env`, then redeploy.

## Admin Panel (/admin/login)
- ansh@thelocaljewel.com / Rakesh@2709
- nayan@thelocaljewel.com / Nayan@123

## Investor Pitch Page (/pitch/login)
- Password: TLJ@2026

## Stripe (test mode)
- STRIPE_API_KEY=sk_test_emergent (in /app/backend/.env)
- Test card for checkout: 4242 4242 4242 4242, any future expiry, any CVC, any ZIP

## Notes
- External automation APIs use X-API-Key (PROJECTS_API_KEY / BLOG_API_KEY in backend/.env).
- Invoice PDFs: GET /api/checkout/invoice/{session_id} (public), GET /api/me/shop-orders/{order_id}/invoice (customer JWT), GET /api/admin/shop-orders/{order_id}/invoice (admin).

