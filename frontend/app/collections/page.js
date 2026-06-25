import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import StoreLayout from '../../components/store/StoreLayout';
import { listCollections } from '../../lib/api';
import { SITE_BASE_URL } from '../../lib/seoSchema';

// Refresh every 60s so admin edits surface promptly.
export const revalidate = 60;

export const metadata = {
  title: 'Shop All Collections',
  description: 'Browse all collections of hand-crafted lab-grown diamond engagement rings and wedding bands at The Local Jewel.',
  alternates: { canonical: '/collections' },
  openGraph: {
    title: 'Shop All Collections — The Local Jewel',
    description: 'Browse all collections of hand-crafted lab-grown diamond engagement rings and wedding bands.',
    url: `${SITE_BASE_URL}/collections`,
    type: 'website',
  },
};

export default async function CollectionsIndexPage() {
  const data = await listCollections().catch(() => null);
  const collections = (data && data.collections) || [];

  return (
    <StoreLayout>
      <main className="store min-h-screen" style={{ background: 'var(--lj-bg)' }} data-testid="collections-page">
        <section className="max-w-7xl mx-auto px-4 md:px-8 pt-12 md:pt-16 pb-4">
          <p className="text-[11px] uppercase tracking-[0.22em] mb-3" style={{ color: 'var(--lj-muted)' }}>The Collections</p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl tracking-tight leading-none" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", color: 'var(--lj-accent)' }} data-testid="collections-title">
            Find the one.
          </h1>
          <p className="mt-4 max-w-xl text-[15px] leading-relaxed" style={{ color: 'var(--lj-muted)' }}>
            Each piece is hand-crafted to order with IGI-certified lab-grown diamonds. Explore by style and shape.
          </p>
        </section>

        <section className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12">
          {collections.length === 0 ? (
            <div className="py-20 text-center" style={{ color: 'var(--lj-muted)' }}>
              <p className="text-[15px]">No collections yet — check back soon.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-8" data-testid="collections-grid">
              {collections.map((c) => (
                <Link key={c.slug} href={`/collections/${c.slug}`} className="group text-left no-underline" style={{ color: 'inherit' }} data-testid={`collection-card-${c.slug}`}>
                  <div className="relative overflow-hidden" style={{ aspectRatio: '3/4', background: 'var(--lj-surface)' }}>
                    {c.image_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.image_url} alt={c.title} loading="lazy" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    )}
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0) 45%, rgba(0,0,0,0.55) 100%)' }} />
                    <div className="absolute left-0 right-0 bottom-0 p-4 md:p-5">
                      <h2 className="text-xl md:text-2xl text-white" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>{c.title}</h2>
                      <div className="flex items-center gap-1.5 mt-1 text-[12px] text-white/85">
                        {c.product_count} {c.product_count === 1 ? 'piece' : 'pieces'} <ChevronRight size={13} className="transition-transform group-hover:translate-x-1" />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
    </StoreLayout>
  );
}
