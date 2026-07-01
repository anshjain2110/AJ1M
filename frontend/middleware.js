import { NextResponse } from 'next/server';

/**
 * Enforce a single canonical host in production: 301 the bare apex
 * (thelocaljewel.com) to the chosen canonical host (www.thelocaljewel.com).
 * This is intentionally inert for preview / localhost hosts — it only fires on
 * the exact apex domain, so it does nothing until the production cutover.
 */
export function middleware(request) {
  const host = (request.headers.get('host') || '').toLowerCase();
  if (host === 'thelocaljewel.com') {
    const url = request.nextUrl.clone();
    url.protocol = 'https:';
    url.host = 'www.thelocaljewel.com';
    url.port = '';
    return NextResponse.redirect(url, 301);
  }
  return NextResponse.next();
}

export const config = {
  // Run on everything except Next internals & static assets.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|ico|txt|xml|webp|woff2?)$).*)'],
};
