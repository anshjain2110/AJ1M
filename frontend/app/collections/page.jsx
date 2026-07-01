import React from 'react';
import CollectionsIndexPage from '@/views/store/CollectionsIndexPage';
import { getCollections } from '@/lib/api';
import { JsonLd, breadcrumbSchema } from '@/lib/seo';

export const revalidate = 300;

export const metadata = {
  title: 'Shop All Collections',
  description:
    'Browse all collections of hand-crafted lab-grown diamond engagement rings and wedding bands at The Local Jewel.',
  alternates: { canonical: '/collections' },
};

export default async function Page() {
  const data = await getCollections();
  const crumbs = [
    { name: 'Home', url: '/' },
    { name: 'Collections', url: '/collections' },
  ];
  return (
    <>
      <JsonLd id="jsonld-breadcrumb" data={breadcrumbSchema(crumbs)} />
      <CollectionsIndexPage initialCollections={data.collections || []} />
    </>
  );
}
