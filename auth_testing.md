# Auth-Gated App Testing Playbook (Emergent Google Auth)

NOTE - Do not be satisfied until you've tested the app completely especially the auth gated pages.

## App-specific notes (The Local Jewel)
- Customer auth uses BOTH flows:
  1. On-screen OTP: POST /api/auth/request-otp returns the OTP directly in the JSON response (`otp` field) and shows it on screen. POST /api/auth/verify-otp returns `{token, user}` (our own JWT). Frontend stores `tlj_token` + `tlj_user` in localStorage.
  2. Emergent Google Auth: "Continue with Google" on /login redirects to https://auth.emergentagent.com/?redirect={origin}/dashboard. On return, frontend detects `#session_id=` in URL hash and POSTs it to `POST /api/auth/google/session` (header X-Session-ID). Backend exchanges it with Emergent, upserts the user by email, stores a session in `user_sessions`, and returns our JWT (`token`) + user. Frontend stores tlj_token/tlj_user and goes to /dashboard.
- All customer endpoints (/api/me/*) authenticate via `Authorization: Bearer <tlj JWT>`.

## Step 1: Create Test User & Session (for Google-auth simulation)
mongosh --eval "
use('thelocaljewel');
var userId = 'user_test' + Date.now();
db.users.insertOne({
  user_id: userId,
  email: 'test.user.' + Date.now() + '@example.com',
  first_name: 'Test',
  created_at: new Date()
});
print('User ID: ' + userId);
"
Then mint a JWT directly for API testing:
python3 -c "
import jwt, os
from datetime import datetime, timezone, timedelta
from dotenv import load_dotenv; load_dotenv('/app/backend/.env')
secret = os.environ['JWT_SECRET']
print(jwt.encode({'user_id': 'USER_ID_HERE', 'email': 'EMAIL', 'exp': datetime.now(timezone.utc)+timedelta(days=1), 'iat': datetime.now(timezone.utc)}, secret, algorithm='HS256'))
"

## Step 2: Test Backend API
curl -X GET "$API_URL/api/me" -H "Authorization: Bearer YOUR_JWT"
curl -X GET "$API_URL/api/me/shop-orders" -H "Authorization: Bearer YOUR_JWT"
curl -X PUT "$API_URL/api/me/profile" -H "Authorization: Bearer YOUR_JWT" -H "Content-Type: application/json" -d '{"first_name":"Test"}'

## Easiest end-to-end login for browser testing (no Google needed)
1. Go to /login
2. Enter any email -> click Send code
3. The 6-digit code is DISPLAYED ON SCREEN — type it in
4. You land on /dashboard with a full account portal

## Checklist
- [ ] User document has user_id field
- [ ] /api/me returns user data with JWT
- [ ] Dashboard loads (not redirected to /login)
- [ ] OTP shown on screen and login completes
- [ ] Google button redirects to auth.emergentagent.com

## Success Indicators
- /api/me returns user data
- Dashboard loads without redirect
- Orders / profile / quotes tabs work

## Failure Indicators
- "User not found", 401 responses, redirect loops to /login
