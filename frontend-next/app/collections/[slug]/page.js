import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import StoreLayout from '../../../components/store/StoreLayout';
import ProductCard from '../../../components/store/ProductCard';
import JsonLd from '../../../components/JsonLd';
import { getCollection } from '../../../lib/api';
import { buildBreadcrumbSchema, SITE_BASE_URL } from '../../../lib/seoSchema';
import CollectionSort from './CollectionSort';

// Per-request SSR so price + availability stay live.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const data = await getCollection(slug).catch(() => null);
  if (!data || !data.collection) return { title: 'Collection not found', robots: { index: false } };
  const col = data.collection;
  const title = col.meta_title || `${col.title} | The Local Jewel`;
  const description = col.meta_description || col.description || `Shop ${col.title} at The Local Jewel — IGI-certified lab-grown diamonds, hand-crafted in Winter Park, FL.`;
  return {
    title: col.meta_title ? col.meta_title.replace(' | The Local Jewel', '') : col.title,
    description,
    alternates: { canonical: `/collections/${slug}` },
    openGraph: {
      title,
      description,
      url: `${SITE_BASE_URL}/collections/${slug}`,
      type: 'website',
      images: col.image_url ? [{ url: col.image_url, alt: col.title }] : undefined,
    },
  };
}

export default async function CollectionDetailPage({ params, searchParams }) {
  const { slug } = await params;
  const sp = (await searchParams) || {};
  const sort = typeof sp.sort === 'string' ? sp.sort : '';

  // Re-fetch the collection with the right sort if provided.
  const data = await getCollection(slug, { sort }).catch(() => null);
  if (!data || !data.collection) notFound();

  const col = data.collection;
  const products = data.products || [];
  const children = data.children || [];

  const breadcrumbItems = [
    { name: 'Home', url: '/' },
    { name: 'Collections', url: '/collections' },
    { name: col.title, url: `/collections/${slug}` },
  ];
  const breadcrumbSchema = buildBreadcrumbSchema(breadcrumbItems);

  return (
    <StoreLayout>
      <JsonLd id="jsonld-breadcrumb" data={breadcrumbSchema} />
      <main className="store min-h-screen" style={{ background: 'var(--lj-bg)' }} data-testid="collection-detail-page">
        <section className="relative" style={{ background: 'var(--lj-surface)' }}>
          <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 md:py-16">
            <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[12px] mb-4" style={{ color: 'var(--lj-muted)' }}>
              <Link href="/collections" data-testid="breadcrumb-collections" className="no-underline" style={{ color: 'inherit' }}>Collections</Link>
              <ChevronRight size={13} /> <span style={{ color: 'var(--lj-text)' }}>{col.title}</span>
            </nav>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl tracking-tight leading-none" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", color: 'var(--lj-accent)' }} data-testid="collection-title">
              {col.title}
            </h1>
            {col.subtitle && <p className="mt-3 text-[16px]" style={{ color: 'var(--lj-text)' }}>{col.subtitle}</p>}
            {col.description && <p className="mt-3 max-w-2xl text-[14px] leading-relaxed" style={{ color: 'var(--lj-muted)' }}>{col.description}</p>}
          </div>
        </section>

        {children.length > 0 && (
          <section className="max-w-7xl mx-auto px-4 md:px-8 pt-8" data-testid="collection-children">
            <div className="text-[11px] uppercase tracking-[0.2em] mb-4" style={{ color: 'var(--lj-muted)' }}>Explore</div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-5">
              {children.map((c) => (
                <Link key={c.slug} href={`/collections/${c.slug}`} className="group text-center no-underline" style={{ color: 'inherit' }} data-testid={`child-collection-${c.slug}`}>
                  <div className="relative overflow-hidden rounded-full mx-auto" style={{ aspectRatio: '1', width: '100%', maxWidth: 140, background: 'var(--lj-surface)' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {c.image_url && <img src={c.image_url} alt={c.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />}
                  </div>
                  <span className="block mt-2.5 text-[13px] font-medium" style={{ color: 'var(--lj-text)' }}>{c.title}</span>
                  <span className="block text-[11px]" style={{ color: 'var(--lj-muted)' }}>{c.product_count} {c.product_count === 1 ? 'piece' : 'pieces'}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="sticky z-30" style={{ top: 57, background: 'rgba(253,251,247,0.88)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderBottom: '1px solid var(--lj-border)' }}>
          <div className="max-w-7xl mx-auto px-4 md:px-8 py-2.5 flex items-center justify-between">
            <span className="text-[12px] uppercase tracking-[0.14em]" style={{ color: 'var(--lj-muted)' }} data-testid="collection-count">{products.length} {products.length === 1 ? 'piece' : 'pieces'}</span>
            <CollectionSort initialSort={sort} />
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-10">
          {products.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-[15px] mb-4" style={{ color: 'var(--lj-muted)' }}>No pieces in this collection yet.</p>
              <Link href="/collections" className="px-6 py-3 text-[13px] font-medium inline-block no-underline" style={{ background: 'var(--lj-accent)', color: '#fff' }}>Browse all collections</Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-x-8 md:gap-y-12" data-testid="collection-products-grid">
              {products.map((p, i) => <ProductCard key={p.slug} product={p} index={i} />)}
            </div>
          )}
        </section>
      </main>
    </StoreLayout>
  );
}
