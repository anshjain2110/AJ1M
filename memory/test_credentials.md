# Test Credentials — The Local Jewel

## Customer Login (/login) — NEW on-screen OTP + Google
- OTP flow: enter ANY email/phone on /login → POST /api/auth/request-otp returns the 6-digit code in the JSON response (`otp` field) AND it is displayed on screen (data-testid="otp-display-code"). Enter it to sign in. First-time identifiers auto-create an account.
- Google login: "Continue with Google" (data-testid="google-login-button") → Emergent-managed auth (auth.emergentagent.com). Backend exchange endpoint: POST /api/auth/google/session with X-Session-ID header.
- Customer JWT stored in localStorage as `tlj_token`, user as `tlj_user`.

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

