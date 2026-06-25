/**
 * Server-side API client — used by Next.js server components to fetch from the
 * FastAPI backend at /api/*. In dev, calls go through the Next.js rewrite to
 * http://localhost:8001. In production, the same hostname serves both via the
 * Kubernetes ingress, so internal absolute calls also work.
 *
 * IMPORTANT: this file is for SERVER components only (no 'use client'). For
 * client-side fetches use the existing axios pattern with NEXT_PUBLIC_* env.
 */

const INTERNAL_BACKEND =
  process.env.BACKEND_URL_INTERNAL || 'http://localhost:8001';

/**
 * Fetch JSON from the FastAPI backend with sensible Next.js cache defaults.
 * @param {string} path - path starting with /api/...
 * @param {RequestInit & { revalidate?: number, tags?: string[] }} [opts]
 */
export async function apiGet(path, opts = {}) {
  if (!path.startsWith('/api/')) {
    throw new Error(`apiGet path must start with /api/, got: ${path}`);
  }
  const url = `${INTERNAL_BACKEND}${path}`;
  const { revalidate, tags, ...rest } = opts;
  const next = {};
  if (revalidate !== undefined) next.revalidate = revalidate;
  if (tags && tags.length) next.tags = tags;
  const res = await fetch(url, {
    ...rest,
    next: Object.keys(next).length ? next : undefined,
    cache: revalidate === 0 ? 'no-store' : rest.cache,
  });
  if (!res.ok) {
    if (res.status === 404) return null;
    const body = await res.text().catch(() => '');
    throw new Error(`API ${res.status} ${path}: ${body.slice(0, 200)}`);
  }
  return res.json();
}

/** Fetch the public site settings (business + product-page details + socials). */
export async function getPublicSettings() {
  return (await apiGet('/api/admin/settings/public', { revalidate: 60 })) || {};
}

/** Fetch a single project (product) by slug. Returns null on 404. */
export async function getProject(slug) {
  return apiGet(`/api/projects/${encodeURIComponent(slug)}`, { revalidate: 0, tags: [`project:${slug}`] });
}

/** Fetch the menu definition (mega menu) used in the header. */
export async function getMenu() {
  return apiGet('/api/menu', { revalidate: 300, tags: ['menu'] });
}

/** Fetch a collection + its products. Accepts optional sort key. */
export async function getCollection(slug, { sort } = {}) {
  const qs = sort ? `?sort=${encodeURIComponent(sort)}` : '';
  return apiGet(`/api/collections/${encodeURIComponent(slug)}${qs}`, { revalidate: 0, tags: [`collection:${slug}`] });
}

/** List collections. */
export async function listCollections() {
  return apiGet('/api/collections', { revalidate: 60, tags: ['collections'] });
}

/** Fetch products list, optionally scoped by collection. */
export async function listProducts({ collection, limit } = {}) {
  const qs = new URLSearchParams();
  if (collection) qs.set('collection', collection);
  if (limit) qs.set('limit', String(limit));
  const path = `/api/products${qs.toString() ? `?${qs}` : ''}`;
  return apiGet(path, { revalidate: 60 });
}

/** Fetch global sale config (for sticky countdown / sale badges). */
export async function getSale() {
  return apiGet('/api/shop/sale', { revalidate: 60, tags: ['sale'] });
}

/** Blog list (published only). */
export async function listBlogPosts() {
  return apiGet('/api/blog', { revalidate: 60, tags: ['blog'] });
}

/** Single blog post by slug. */
export async function getBlogPost(slug) {
  return apiGet(`/api/blog/${encodeURIComponent(slug)}`, { revalidate: 60, tags: [`blog:${slug}`] });
}
