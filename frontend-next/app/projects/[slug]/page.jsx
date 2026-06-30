import React from 'react';
import { notFound } from 'next/navigation';
import ProjectDetailPageV2 from '@/views/ProjectDetailPageV2';
import { getProject, getSettings } from '@/lib/api';
import { JsonLd, productSchema, productGroupSchema, breadcrumbSchema, SITE_URL } from '@/lib/seo';

export const revalidate = 300;

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const res = await getProject(slug);
  if (!res.ok || !res.data) return { title: 'Piece not found' };
  const p = res.data;
  const desc = p.meta_description || p.subtitle || (p.description || '').slice(0, 160) || p.title;
  return {
    title: p.meta_title ? { absolute: p.meta_title } : p.title,
    description: desc,
    alternates: { canonical: `/projects/${slug}` },
    openGraph: {
      title: p.title,
      description: desc,
      url: `${SITE_URL}/projects/${slug}`,
      images: p.hero_image_url ? [{ url: p.hero_image_url }] : [],
      type: 'website',
    },
  };
}

export default async function Page({ params }) {
  const { slug } = await params;
  const [res, settings] = await Promise.all([getProject(slug), getSettings()]);
  if (!res.ok || !res.data) notFound();
  const p = res.data;

  const primaryCollection = (p.collections || [])[0] || '';
  const collectionName = primaryCollection
    ? primaryCollection.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    : '';
  const crumbs = [
    { name: 'Home', url: '/' },
    { name: 'Shop', url: '/collections' },
    primaryCollection && { name: collectionName, url: `/collections/${primaryCollection}` },
    { name: p.title, url: `/projects/${slug}` },
  ].filter(Boolean);

  const pg = p.buyable ? productGroupSchema(p, settings) : null;

  return (
    <>
      {p.buyable && <JsonLd id="jsonld-product" data={productSchema(p, settings)} />}
      {pg && <JsonLd id="jsonld-productgroup" data={pg} />}
      <JsonLd id="jsonld-breadcrumb" data={breadcrumbSchema(crumbs)} />
      <ProjectDetailPageV2
        key={slug}
        initialProject={p}
        initialSale={p.sale || null}
        initialInfo={settings}
        initialSlug={slug}
      />
    </>
  );
}
