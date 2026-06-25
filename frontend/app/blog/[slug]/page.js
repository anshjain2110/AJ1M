import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, BookOpen, ArrowRight } from 'lucide-react';
import StoreLayout from '../../../components/store/StoreLayout';
import JsonLd from '../../../components/JsonLd';
import { getBlogPost, listBlogPosts } from '../../../lib/api';
import { buildArticleSchema, buildBreadcrumbSchema, SITE_BASE_URL } from '../../../lib/seoSchema';

export const revalidate = 60;

const formatDate = (d) => {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
};

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const post = await getBlogPost(slug).catch(() => null);
  if (!post) return { title: 'Article not found', robots: { index: false } };
  const title = (post.meta_title && post.meta_title.trim()) || post.title;
  const description = (post.meta_description && post.meta_description.trim())
    || (post.excerpt && post.excerpt.trim())
    || 'Real advice from working jewelers — diamond buying guides, custom design stories, and behind-the-scenes from The Local Jewel.';
  const url = `${SITE_BASE_URL}/blog/${slug}`;
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: `/blog/${slug}` },
    openGraph: {
      title, description, url, type: 'article',
      images: post.hero_image_url ? [{ url: post.hero_image_url, alt: post.title }] : undefined,
      publishedTime: post.published_at || post.created_at,
      modifiedTime: post.updated_at || post.published_at || post.created_at,
    },
    twitter: { card: 'summary_large_image', title, description, images: post.hero_image_url ? [post.hero_image_url] : undefined },
  };
}

export default async function BlogDetailPage({ params }) {
  const { slug } = await params;
  const post = await getBlogPost(slug).catch(() => null);
  if (!post) notFound();

  const others = await listBlogPosts().catch(() => null);
  const related = ((others && others.posts) || []).filter((p) => p.slug !== slug).slice(0, 3);

  const url = `${SITE_BASE_URL}/blog/${slug}`;
  const articleSchema = buildArticleSchema({ post, url });
  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Journal', url: '/blog' },
    { name: post.title, url: `/blog/${slug}` },
  ]);

  return (
    <StoreLayout>
      <JsonLd id="jsonld-article" data={articleSchema} />
      <JsonLd id="jsonld-breadcrumb" data={breadcrumbSchema} />
      <main className="min-h-screen flex flex-col" style={{ background: 'var(--lj-bg)' }} data-testid="blog-detail-page">
        <article className="max-w-3xl w-full mx-auto px-4 pt-8 pb-12">
          <nav className="mb-6 text-[12px]" style={{ color: 'var(--lj-muted)' }}>
            <Link href="/" className="hover:underline" style={{ color: 'inherit' }}>Home</Link>
            <span className="mx-1.5">·</span>
            <Link href="/blog" className="hover:underline" style={{ color: 'inherit' }}>Journal</Link>
          </nav>

          <div className="text-[11px] uppercase tracking-[0.16em] mb-3" style={{ color: 'var(--lj-accent)' }}>
            {post.category || 'Article'} · {formatDate(post.published_at || post.created_at)}
          </div>
          <h1 className="text-[34px] sm:text-[48px] leading-[1.05] font-semibold tracking-[-0.02em] mb-4"
            style={{ color: 'var(--lj-text)', fontFamily: 'var(--lj-serif, "Cormorant Garamond","Playfair Display",Georgia,serif)' }}>
            {post.title}
          </h1>
          {post.subtitle && (
            <p className="text-[17px] sm:text-[19px] leading-[1.5] mb-6" style={{ color: 'var(--lj-muted)' }}>
              {post.subtitle}
            </p>
          )}
          <div className="flex items-center gap-3 mb-8 text-[13px]" style={{ color: 'var(--lj-muted)' }}>
            <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'rgba(15,94,76,0.08)', color: 'var(--lj-accent)' }}>
              <BookOpen size={15} />
            </div>
            <div>
              <div className="font-medium" style={{ color: 'var(--lj-text)' }}>{post.author_name || 'The Local Jewel'}</div>
              <div className="text-[12px]">Published {formatDate(post.published_at || post.created_at)}</div>
            </div>
          </div>

          {post.hero_image_url && (
            <div className="rounded-[18px] overflow-hidden mb-9" style={{ border: '1px solid var(--lj-border)' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={post.hero_image_url} alt={post.title} className="w-full h-auto block" />
            </div>
          )}

          {post.content_html ? (
            <div data-testid="blog-content" className="prose prose-lg max-w-none blog-content"
              dangerouslySetInnerHTML={{ __html: post.content_html }} />
          ) : (
            <p className="text-[15px]" style={{ color: 'var(--lj-muted)' }}>This article has no content yet.</p>
          )}

          <div className="mt-12 rounded-[18px] p-6" style={{ background: 'rgba(15,94,76,0.04)', border: '1px solid var(--lj-border)' }}>
            <div className="text-[11px] uppercase tracking-[0.16em] mb-2" style={{ color: 'var(--lj-accent)' }}>Custom designed for you</div>
            <h3 className="text-[20px] font-semibold mb-2" style={{ color: 'var(--lj-text)', fontFamily: 'var(--lj-serif, "Cormorant Garamond","Playfair Display",Georgia,serif)' }}>
              Ready to design your piece?
            </h3>
            <p className="text-[14px] leading-[1.55] mb-4" style={{ color: 'var(--lj-muted)' }}>
              Get 3D renders + a written quote within 24-48 hours — no payment required until you love the design.
            </p>
            <Link href="/" data-testid="blog-cta-quote"
              className="inline-flex items-center gap-2 min-h-[48px] px-6 rounded-[12px] font-medium text-[15px] transition-all active:scale-[0.99] no-underline"
              style={{ background: 'var(--lj-accent)', color: '#FFFFFF' }}>
              Start your custom quote <ArrowRight size={16} />
            </Link>
          </div>
        </article>

        {related.length > 0 && (
          <section className="max-w-6xl w-full mx-auto px-4 pb-16" data-testid="blog-related">
            <h2 className="text-[22px] sm:text-[28px] font-semibold mb-5 tracking-[-0.01em]"
              style={{ color: 'var(--lj-text)', fontFamily: 'var(--lj-serif, "Cormorant Garamond","Playfair Display",Georgia,serif)' }}>
              More from the journal
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {related.map((p) => (
                <Link key={p.post_id || p.slug} href={`/blog/${p.slug}`} data-testid={`blog-related-${p.slug}`}
                  className="group block rounded-[16px] overflow-hidden transition-all hover:-translate-y-0.5 no-underline"
                  style={{ background: 'var(--lj-surface)', border: '1px solid var(--lj-border)', color: 'inherit' }}>
                  <div className="aspect-[16/10] overflow-hidden" style={{ background: 'var(--lj-bg)' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {p.hero_image_url && <img src={p.hero_image_url} alt={p.title} loading="lazy" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />}
                  </div>
                  <div className="p-4">
                    <div className="text-[10px] uppercase tracking-[0.14em] mb-1.5" style={{ color: 'var(--lj-accent)' }}>{p.category || 'Journal'}</div>
                    <div className="text-[15px] font-semibold" style={{ color: 'var(--lj-text)', fontFamily: 'var(--lj-serif, "Cormorant Garamond","Playfair Display",Georgia,serif)' }}>
                      {p.title}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </StoreLayout>
  );
}
