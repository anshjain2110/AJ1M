import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

// Hooked to FastAPI admin _seo_refresh() -> _ping_nextjs_revalidate().
// Backend POSTs { paths: [...] } with header x-revalidate-token.
export async function POST(request) {
  const token = request.headers.get('x-revalidate-token');
  if (!process.env.REVALIDATE_TOKEN || token !== process.env.REVALIDATE_TOKEN) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  let body = {};
  try { body = await request.json(); } catch (e) { /* ignore */ }
  const paths = Array.isArray(body.paths) ? body.paths : [];
  const revalidated = [];
  for (const p of paths) {
    if (typeof p === 'string' && p.startsWith('/')) {
      try { revalidatePath(p); revalidated.push(p); } catch (e) { /* ignore */ }
    }
  }
  // These aggregate pages should refresh on any product/collection change.
  try { revalidatePath('/'); } catch (e) { /* ignore */ }
  try { revalidatePath('/collections'); } catch (e) { /* ignore */ }
  try { revalidatePath('/sitemap.xml'); } catch (e) { /* ignore */ }
  return NextResponse.json({ revalidated: true, paths: revalidated, now: Date.now() });
}

export async function GET() {
  return NextResponse.json({ ok: true, hint: 'POST { paths: [...] } with header x-revalidate-token' });
}
