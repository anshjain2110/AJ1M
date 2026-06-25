import { revalidatePath, revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';

/**
 * On-demand revalidation endpoint.
 *
 * Backend calls this whenever admin saves a project, blog post, collection, sale or settings —
 * so the Next.js SSR cache for that resource is immediately invalidated and the next request
 * re-fetches fresh data from FastAPI.
 *
 * Auth: shared secret in `x-revalidate-token` header, matched against REVALIDATE_TOKEN env var.
 *
 * Body shape (POST JSON):
 *   { "paths": ["/projects/4-radiant", "/collections/engagement-rings"] }
 *   or { "tags": ["project:4-radiant", "menu"] }
 *   or both. Anything missing is ignored.
 */
export async function POST(request) {
  const token = request.headers.get('x-revalidate-token');
  const expected = process.env.REVALIDATE_TOKEN;
  if (!expected || token !== expected) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  let body = {};
  try { body = await request.json(); } catch { /* allow empty */ }

  const revalidatedPaths = [];
  const revalidatedTags = [];

  for (const p of body.paths || []) {
    if (typeof p === 'string' && p.startsWith('/')) {
      try { revalidatePath(p); revalidatedPaths.push(p); } catch {}
    }
  }
  for (const t of body.tags || []) {
    if (typeof t === 'string' && t.length) {
      try { revalidateTag(t); revalidatedTags.push(t); } catch {}
    }
  }

  return NextResponse.json({
    revalidated: true,
    paths: revalidatedPaths,
    tags: revalidatedTags,
    now: Date.now(),
  });
}

export async function GET() {
  return NextResponse.json({ ok: true, hint: 'POST with paths/tags + x-revalidate-token header' });
}
