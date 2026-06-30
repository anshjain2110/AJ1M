/**
 * Server-side data access for the FastAPI backend.
 * Uses the in-cluster internal URL for reliability (no external ingress hop).
 * All functions are safe to call from Server Components.
 */
const BASE = (process.env.BACKEND_INTERNAL_URL || process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001').replace(/\/$/, '');

async function getJSON(path, { revalidate = 300, tags } = {}) {
  try {
    const res = await fetch(`${BASE}${path}`, {
      headers: { accept: 'application/json' },
      next: { revalidate, ...(tags ? { tags } : {}) },
    });
    if (!res.ok) return { ok: false, status: res.status, data: null };
    const data = await res.json();
    return { ok: true, status: res.status, data };
  } catch (e) {
    return { ok: false, status: 0, data: null, error: String(e) };
  }
}

export async function getSettings() {
  const r = await getJSON('/api/admin/settings/public', { tags: ['settings'] });
  return r.data || {};
}

export async function getProjects(query = '') {
  const r = await getJSON(`/api/projects${query ? `?${query}` : ''}`, { tags: ['projects'] });
  return r.data || { projects: [], tags: [], total: 0 };
}

// Returns the full result so callers can branch on status (404 -> notFound()).
export async function getProject(slug) {
  return getJSON(`/api/projects/${encodeURIComponent(slug)}`, { tags: ['projects', `project:${slug}`] });
}

export async function getCollections(query = '') {
  const r = await getJSON(`/api/collections${query ? `?${query}` : ''}`, { tags: ['collections'] });
  return r.data || { collections: [], total: 0 };
}

export async function getCollection(slug, sort) {
  const q = sort ? `?sort=${encodeURIComponent(sort)}` : '';
  return getJSON(`/api/collections/${encodeURIComponent(slug)}${q}`, { tags: ['collections', `collection:${slug}`] });
}

export async function getProducts(query = '') {
  const r = await getJSON(`/api/products${query ? `?${query}` : ''}`, { tags: ['products'] });
  return r.data || { products: [], total: 0 };
}

export async function getShowcasePairs() {
  const r = await getJSON('/api/showcase-pairs', { tags: ['showcase'] });
  return r.data || { pairs: [] };
}

export async function getAllSitemapData() {
  const [projects, collections] = await Promise.all([
    getJSON('/api/projects?limit=100', { revalidate: 600, tags: ['projects'] }),
    getJSON('/api/collections?all=true', { revalidate: 600, tags: ['collections'] }),
  ]);
  return {
    projects: (projects.data && projects.data.projects) || [],
    collections: (collections.data && collections.data.collections) || [],
  };
}
