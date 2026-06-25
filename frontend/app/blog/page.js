import Link from 'next/link';
import { BookOpen, ChevronRight } from 'lucide-react';
import StoreLayout from '../../components/store/StoreLayout';
import BlogCategoryFilter from './BlogCategoryFilter';
import { listBlogPosts } from '../../lib/api';
import { SITE_BASE_URL } from '../../lib/seoSchema';

export const revalidate = 60;

export const metadata = {
  title: 'The Local Jewel Journal — Engagement Ring & Lab Diamond Insights',
  description: 'Real advice from real jewelers — diamond buying guides, custom design stories, ring trends and behind-the-scenes from The Local Jewel.',
  alternates: { canonical: '/blog' },
  openGraph: {
    title: 'The Local Jewel Journal',
    description: 'Diamond buying guides, custom design stories, and ring trends.',
    url: `${SITE_BASE_URL}/blog`,
    type: 'website',
  },
};

const formatDate = (d) => {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
};

export default async function BlogIndexPage() {
  const data = await listBlogPosts().catch(() => null);
  const posts = (data && data.posts) || [];
  const categories = (data && data.categories) || [];
  const featured = posts.find((p) => p.featured) || posts[0];
  const rest = posts.filter((p) => p !== featured);

  return (
    <StoreLayout>
      <main className="min-h-screen flex flex-col" style={{ background: 'var(--lj-bg)' }} data-testid="blog-index-page">
        <section className="px-4 pt-12 pb-8 text-center">
          <div className="max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4" style={{ background: 'rgba(15,94,76,0.08)', border: '1px solid rgba(15,94,76,0.15)' }}>
              <BookOpen size={13} style={{ color: 'var(--lj-accent)' }} />
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: 'var(--lj-accent)' }}>The Journal</span>
            </div>
            <h1 className="text-[32px] sm:text-[48px] leading-[1.05] font-semibold tracking-[-0.02em] mb-4"
              style={{ color: 'var(--lj-text)', fontFamily: 'var(--lj-serif, "Cormorant Garamond","Playfair Display",Georgia,serif)' }}>
              Notes from the studio.
            </h1>
            <p className="text-[15px] sm:text-[17px] leading-[1.55] max-w-xl mx-auto" style={{ color: 'var(--lj-muted)' }}>
              Honest advice from working jewelers — diamond buying, custom design stories, and behind-the-scenes from our Winter Park studio.
            </p>
          </div>
        </section>

        {/* Render the featured post via SSR (raw HTML for crawlers); category filter is client-side */}
        <section className="px-4 pb-16 flex-1 max-w-6xl mx-auto w-full">
          {posts.length === 0 ? (
            <div className="py-20 text-center" style={{ color: 'var(--lj-muted)' }}>
              <p className="text-[16px] mb-2">No posts yet — check back soon.</p>
              <p className="text-[13px]">We&apos;re cooking up some great content.</p>
            </div>
          ) : (
            <>
              {featured && (
                <Link href={`/blog/${featured.slug}`} data-testid={`blog-featured-${featured.slug}`}
                  className="group block mb-12 rounded-[20px] overflow-hidden transition-all hover:-translate-y-0.5 no-underline"
                  style={{ background: 'var(--lj-surface)', border: '1px solid var(--lj-border)', boxShadow: '0 10px 30px rgba(15,94,76,0.06)', color: 'inherit' }}>
                  <div className="grid lg:grid-cols-[1.1fr_1fr]">
                    <div className="relative aspect-[16/10] lg:aspect-auto overflow-hidden" style={{ background: 'var(--lj-bg)' }}>
                      {featured.hero_image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={featured.hero_image_url} alt={featured.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center" style={{ color: 'var(--lj-muted)' }}>
                          <BookOpen size={48} style={{ opacity: 0.2 }} />
                        </div>
                      )}
                    </div>
                    <div className="p-7 sm:p-10 flex flex-col justify-center">
                      <div className="text-[11px] uppercase tracking-[0.16em] mb-3" style={{ color: 'var(--lj-accent)' }}>
                        {featured.category || 'Featured'} · {formatDate(featured.published_at || featured.created_at)}
                      </div>
                      <h2 className="text-[28px] sm:text-[36px] leading-[1.1] font-semibold tracking-[-0.02em] mb-3"
                        style={{ color: 'var(--lj-text)', fontFamily: 'var(--lj-serif, "Cormorant Garamond","Playfair Display",Georgia,serif)' }}>
                        {featured.title}
                      </h2>
                      {featured.excerpt && <p className="text-[14.5px] sm:text-[15.5px] leading-[1.6] mb-5" style={{ color: 'var(--lj-muted)' }}>{featured.excerpt}</p>}
                      <div className="inline-flex items-center gap-1.5 text-[13.5px] font-medium" style={{ color: 'var(--lj-accent)' }}>
                        Read article <ChevronRight size={15} className="transition-transform group-hover:translate-x-1" />
                      </div>
                    </div>
                  </div>
                </Link>
              )}

              <BlogCategoryFilter posts={rest} categories={categories} />
            </>
          )}
        </section>
      </main>
    </StoreLayout>
  );
}
