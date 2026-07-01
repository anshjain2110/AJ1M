import React from 'react';
import BlogIndexPage from '@/views/BlogIndexPage';
import { getBlogPosts } from '@/lib/api';
import { JsonLd, breadcrumbSchema } from '@/lib/seo';

export const revalidate = 300;

export const metadata = {
  title: { absolute: 'The Local Jewel Journal — Engagement Ring & Lab Diamond Insights' },
  description:
    'Real advice from working jewelers — diamond buying guides, custom design stories, ring trends and behind-the-scenes from The Local Jewel.',
  alternates: { canonical: '/blog' },
};

export default async function Page() {
  const data = await getBlogPosts();
  const crumbs = [
    { name: 'Home', url: '/' },
    { name: 'Journal', url: '/blog' },
  ];
  return (
    <>
      <JsonLd id="jsonld-breadcrumb" data={breadcrumbSchema(crumbs)} />
      <BlogIndexPage initialPosts={data.posts || []} initialCategories={data.categories || []} />
    </>
  );
}
