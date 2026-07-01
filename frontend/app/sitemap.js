import { getAllSitemapData } from '@/lib/api';
import { SITE_URL } from '@/lib/seo';

export const revalidate = 600;

export default async function sitemap() {
  const { projects, collections, blog } = await getAllSitemapData();
  const now = new Date();
  const staticRoutes = [
    ['/', 1.0, 'weekly'],
    ['/collections', 0.95, 'weekly'],
    ['/projects', 0.9, 'weekly'],
    ['/blog', 0.85, 'weekly'],
    ['/cuts', 0.6, 'monthly'],
    ['/contact', 0.5, 'monthly'],
    ['/privacy', 0.3, 'yearly'],
    ['/terms', 0.3, 'yearly'],
  ];
  const entries = staticRoutes.map(([path, priority, changeFrequency]) => ({
    url: `${SITE_URL}${path}`, lastModified: now, changeFrequency, priority,
  }));
  for (const c of collections) {
    if (!c || !c.slug) continue;
    entries.push({
      url: `${SITE_URL}/collections/${c.slug}`,
      lastModified: c.updated_at ? new Date(c.updated_at) : now,
      changeFrequency: 'weekly', priority: 0.85,
    });
  }
  for (const p of projects) {
    if (!p || !p.slug) continue;
    entries.push({
      url: `${SITE_URL}/projects/${p.slug}`,
      lastModified: p.updated_at ? new Date(p.updated_at) : now,
      changeFrequency: 'monthly', priority: 0.8,
    });
  }
  for (const b of blog) {
    if (!b || !b.slug) continue;
    entries.push({
      url: `${SITE_URL}/blog/${b.slug}`,
      lastModified: b.updated_at ? new Date(b.updated_at) : (b.published_at ? new Date(b.published_at) : now),
      changeFrequency: 'monthly', priority: 0.7,
    });
  }
  return entries;
}
