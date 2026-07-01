import React from 'react';
import { notFound } from 'next/navigation';
import BlogDetailPage from '@/views/BlogDetailPage';
import { getBlogPost, getBlogPosts } from '@/lib/api';
import { JsonLd, blogPostingSchema, breadcrumbSchema, SITE_URL } from '@/lib/seo';

export const revalidate = 300;

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const res = await getBlogPost(slug);
  if (!res.ok || !res.data) return { title: 'Article not found' };
  const p = res.data;
  const desc = p.meta_description || p.excerpt || 'Real advice from working jewelers at The Local Jewel.';
  return {
    title: p.meta_title ? { absolute: p.meta_title } : p.title,
    description: desc,
    alternates: { canonical: `/blog/${slug}` },
    openGraph: {
      title: p.meta_title || p.title,
      description: desc,
      url: `${SITE_URL}/blog/${slug}`,
      images: p.hero_image_url ? [{ url: p.hero_image_url }] : [],
      type: 'article',
    },
  };
}

export default async function Page({ params }) {
  const { slug } = await params;
  const res = await getBlogPost(slug);
  if (!res.ok || !res.data) notFound();
  const post = res.data;
  const listed = await getBlogPosts('limit=6');
  const related = (listed.posts || []).filter((p) => p.slug !== slug).slice(0, 3);
  const crumbs = [
    { name: 'Home', url: '/' },
    { name: 'Journal', url: '/blog' },
    { name: post.title, url: `/blog/${slug}` },
  ];
  return (
    <>
      <JsonLd id="jsonld-blogposting" data={blogPostingSchema(post)} />
      <JsonLd id="jsonld-breadcrumb" data={breadcrumbSchema(crumbs)} />
      <BlogDetailPage key={slug} initialPost={post} initialRelated={related} initialSlug={slug} />
    </>
  );
}
