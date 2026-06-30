import React from 'react';
import { notFound } from 'next/navigation';
import CollectionDetailPage from '@/views/store/CollectionDetailPage';
import { getCollection } from '@/lib/api';
import { JsonLd, breadcrumbSchema } from '@/lib/seo';

export const revalidate = 300;

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const res = await getCollection(slug);
  if (!res.ok || !res.data || !res.data.collection) return { title: 'Collection not found' };
  const c = res.data.collection;
  return {
    title: c.meta_title ? { absolute: c.meta_title } : c.title,
    description:
      c.meta_description || c.description ||
      `Shop ${c.title} at The Local Jewel — IGI-certified lab-grown diamonds, hand-crafted in Winter Park, FL.`,
    alternates: { canonical: `/collections/${slug}` },
  };
}

export default async function Page({ params }) {
  const { slug } = await params;
  const res = await getCollection(slug);
  if (!res.ok || !res.data || !res.data.collection) notFound();
  const c = res.data.collection;
  const crumbs = [
    { name: 'Home', url: '/' },
    { name: 'Collections', url: '/collections' },
    { name: c.title, url: `/collections/${slug}` },
  ];
  return (
    <>
      <JsonLd id="jsonld-breadcrumb" data={breadcrumbSchema(crumbs)} />
      <CollectionDetailPage initialData={res.data} initialSlug={slug} />
    </>
  );
}
