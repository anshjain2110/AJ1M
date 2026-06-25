import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  Hand, MapPin, Gem, Award, BadgeCheck, Sparkles, PenLine, Truck, RotateCcw, ShieldCheck, Clock,
  ChevronRight, Star, Zap, Box, Flame,
} from 'lucide-react';
import StoreLayout from '../../../components/store/StoreLayout';
import ProductBuyBox from '../../../components/store/ProductBuyBox';
import ProductGallery from '../../../components/store/ProductGallery';
import ProductCard from '../../../components/store/ProductCard';
import AccordionBlock from '../../../components/store/AccordionBlock';
import JsonLd from '../../../components/JsonLd';
import { getProject, getPublicSettings } from '../../../lib/api';
import { buildProductSchema, buildBreadcrumbSchema, SITE_BASE_URL } from '../../../lib/seoSchema';

// Per-request SSR for fresh price / availability / schema.
// On-demand revalidation will invalidate this when admin edits the project.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// ── SEO: per-page <title>, description, canonical, OG  ──
export async function generateMetadata({ params }) {
  const { slug } = await params;
  const project = await getProject(slug).catch(() => null);
  if (!project) return { title: 'Piece not found', robots: { index: false } };

  const title = project.meta_title || project.title;
  const description = project.meta_description || project.subtitle || (project.description || '').slice(0, 158);
  const image = project.hero_image_url;
  const url = `${SITE_BASE_URL}/projects/${slug}`;

  return {
    title,
    description,
    alternates: { canonical: `/projects/${slug}` },
    openGraph: {
      title, description, url, type: 'website',
      images: image ? [{ url: image, alt: project.title }] : undefined,
    },
    twitter: { card: 'summary_large_image', title, description, images: image ? [image] : undefined },
  };
}

const money = (n, currency = 'USD') =>
  `${currency === 'USD' ? '$' : `${currency} `}${Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

const cap = (s) => (s ? s.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ') : '');

export default async function ProjectDetailPage({ params }) {
  const { slug } = await params;

  // Parallel fetches — server-side, no client round-trip
  const [project, settings] = await Promise.all([
    getProject(slug).catch(() => null),
    getPublicSettings().catch(() => ({})),
  ]);

  // Real 404 status code — not a 200 with "not found" content
  if (!project) notFound();

  const currency = (project.price_currency || 'USD').toUpperCase();
  const fromPrice = project.from_price || 0;
  const buyable = project.buyable !== false;
  const images = [project.hero_image_url, ...(project.gallery_urls || [])].filter(Boolean);
  const specs = project.specs || {};
  const primaryCollection = (project.collections || [])[0] || '';
  const collectionName = cap(primaryCollection);

  // Admin-editable PDP details
  const shipsFrom = settings.ships_from || 'Winter Park, Florida';
  const leadTime = settings.lead_time || '2–5 business days';
  const returnsPolicy = settings.returns_policy || '30-day exchanges, hassle-free';
  const warrantyText = settings.warranty_text || 'Lifetime warranty on every piece';
  const careText = settings.care_text || 'Clean with warm soapy water and a soft brush. Avoid harsh chemicals.';
  const makerText = settings.maker_text || 'The Local Jewel is an independent custom jewelry studio.';

  // About-this-piece highlights — derived from real data
  const tiers = Object.keys(project.price_matrix || {});
  const highlights = [
    { icon: Hand, label: 'Made by', value: 'The Local Jewel — hand-crafted to order' },
    { icon: MapPin, label: 'Ships from', value: `${shipsFrom} · free insured delivery` },
    tiers.length && { icon: Gem, label: 'Materials', value: [...tiers, 'Lab-grown diamond'].join(', ') },
    specs.shape && { icon: Sparkles, label: 'Gemstone', value: ['Lab-grown diamond', specs.shape, specs.color && `Color ${specs.color}`, specs.clarity].filter(Boolean).join(' · ') },
    specs.setting_style && { icon: Award, label: 'Style', value: specs.setting_style },
    { icon: BadgeCheck, label: 'Certification', value: `${specs.certification || 'IGI'} certified${specs.cert_number ? ` · #${specs.cert_number}` : ''}` },
    { icon: PenLine, label: 'Personalization', value: 'Free engraving & ring sizing on request' },
  ].filter(Boolean);

  // JSON-LD — Product + BreadcrumbList in server HTML
  const productSchema = buildProductSchema({ project, settings });
  const breadcrumb = [
    { name: 'Home', url: '/' },
    { name: 'Shop', url: '/collections' },
    primaryCollection && { name: collectionName, url: `/collections/${primaryCollection}` },
    { name: project.title, url: `/projects/${slug}` },
  ].filter(Boolean);
  const breadcrumbSchema = buildBreadcrumbSchema(breadcrumb);

  return (
    <StoreLayout>
      <JsonLd id="jsonld-product" data={productSchema} />
      <JsonLd id="jsonld-breadcrumb" data={breadcrumbSchema} />

      <main className="store min-h-screen" style={{ background: '#FBF7F0', fontFamily: "'Outfit', Inter, system-ui, sans-serif" }} data-testid="project-detail-v2">
        <div className="max-w-7xl mx-auto px-4 md:px-8 pt-6">
          {/* Visible breadcrumb */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[12px] mb-4 flex-wrap" style={{ color: 'var(--lj-muted)' }}>
            {breadcrumb.map((b, i) => (
              <span key={b.url} className="flex items-center gap-1.5">
                {i < breadcrumb.length - 1
                  ? <Link href={b.url} className="no-underline" style={{ color: 'inherit' }}>{b.name}</Link>
                  : <span style={{ color: 'var(--lj-text)' }}>{b.name}</span>}
                {i < breadcrumb.length - 1 && <ChevronRight size={12} />}
              </span>
            ))}
          </nav>

          {/* Hero + buy */}
          <div className="grid lg:grid-cols-[1.05fr_1fr] gap-8 lg:gap-14 pb-10">
            <div>
              {/* Hero image (server-rendered for SEO; gallery hydrates client-side) */}
              {images.length > 0 && (
                <ProductGallery images={images} title={project.title} />
              )}
            </div>

            <div className="space-y-5">
              {/* Badge row */}
              <div className="flex flex-wrap items-center gap-2" data-testid="v2-urgency-row">
                <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[12px] font-bold uppercase tracking-[0.08em]"
                  style={{ background: 'linear-gradient(135deg, #0F5E4C 0%, #16876B 100%)', color: '#fff', boxShadow: '0 4px 12px rgba(15,94,76,0.25)' }}
                  data-testid="v2-fast-badge">
                  <Zap size={13} fill="#fff" /> Fast · Ships in {leadTime}
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[12px] font-medium" style={{ background: '#FFF3D9', color: '#7A5800' }} data-testid="v2-stock-badge">
                  <Box size={13} /> Only 1 available
                </span>
                {(project.tags || []).includes('igi_certified') && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[12px] font-medium" style={{ background: '#F0EBE0', color: '#3F4A45' }}>
                    <BadgeCheck size={13} /> IGI Certified
                  </span>
                )}
              </div>

              {/* Title + subtitle — visible H1 in raw HTML */}
              <header>
                <h1 className="text-[32px] sm:text-[40px] leading-[1.05] font-semibold" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", color: 'var(--lj-text)' }} data-testid="v2-title">
                  {project.title}
                </h1>
                {project.subtitle && (
                  <p className="text-[15.5px] mt-2 leading-[1.55]" style={{ color: 'var(--lj-muted)' }} data-testid="v2-subtitle">{project.subtitle}</p>
                )}
              </header>

              {/* Price hint — also visible in raw HTML */}
              {fromPrice > 0 && (
                <p className="text-[14px]" style={{ color: 'var(--lj-muted)' }}>
                  From <span className="font-semibold" style={{ color: 'var(--lj-text)' }} data-testid="v2-from-price">{money(fromPrice, currency)}</span>
                </p>
              )}

              {/* Buy box (client component) */}
              {buyable ? (
                <ProductBuyBox project={project} />
              ) : (
                <div className="p-5 rounded-[12px]" style={{ background: '#fff', border: '1px solid var(--lj-border)' }}>
                  <p className="text-[14px]" style={{ color: 'var(--lj-text)' }}>
                    This is a custom piece. <Link href="/" className="font-semibold" style={{ color: 'var(--lj-accent)' }}>Start your own quote →</Link>
                  </p>
                </div>
              )}

              {/* Reassurance */}
              <div className="grid grid-cols-2 gap-2 text-[12px]" style={{ color: '#3F4A45' }}>
                <div className="inline-flex items-center gap-1.5"><Truck size={14} style={{ color: 'var(--lj-accent)' }} /> Ships from {shipsFrom.split(',')[0]}</div>
                <div className="inline-flex items-center gap-1.5"><RotateCcw size={14} style={{ color: 'var(--lj-accent)' }} /> 30-day exchange</div>
                <div className="inline-flex items-center gap-1.5"><ShieldCheck size={14} style={{ color: 'var(--lj-accent)' }} /> Lifetime warranty</div>
                <div className="inline-flex items-center gap-1.5"><Clock size={14} style={{ color: 'var(--lj-accent)' }} /> Ships in {leadTime}</div>
              </div>
            </div>
          </div>

          {/* About this piece — full server-rendered for SEO */}
          <section className="pt-10" data-testid="v2-about-piece">
            <h2 className="text-[24px] font-semibold mb-6" style={{ color: 'var(--lj-text)' }}>About this piece</h2>
            <div className="lg:grid lg:grid-cols-[0.95fr_1.05fr] lg:gap-12 lg:items-start">
              <div className="rounded-[18px] p-5 sm:p-6 mb-7 lg:mb-0" style={{ background: '#fff', border: '1px solid var(--lj-border)' }} data-testid="v2-highlights">
                <div className="text-[11.5px] uppercase tracking-[0.14em] font-semibold mb-4" style={{ color: 'var(--lj-muted)' }}>Highlights</div>
                <ul className="space-y-4">
                  {highlights.map((h, i) => (
                    <li key={i} className="flex items-start gap-3.5" data-testid={`v2-highlight-${i}`}>
                      <span className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#E9F5EE' }}>
                        <h.icon size={16} style={{ color: 'var(--lj-accent)' }} />
                      </span>
                      <span className="pt-0.5 min-w-0">
                        <span className="block text-[11px] uppercase tracking-wider" style={{ color: '#9AA39E' }}>{h.label}</span>
                        <span className="block text-[14px] font-medium leading-snug" style={{ color: 'var(--lj-text)' }}>{h.value}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                {project.description && (
                  <div className="text-[15px] leading-[1.85] whitespace-pre-line" data-testid="v2-about-description" style={{ color: '#3F4A45' }}>
                    {project.description}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Accordions — open by default so bots see content in raw HTML */}
          <section className="pt-10" data-testid="v2-accordions">
            <AccordionBlock title="Shipping & policies" icon={<Truck size={17} style={{ color: 'var(--lj-accent)' }} />} testid="v2-acc-shipping">
              <ul className="space-y-2.5">
                <li className="flex items-center gap-2"><MapPin size={15} style={{ color: 'var(--lj-accent)' }} /> Ships from <strong>{shipsFrom}</strong> — worldwide insured delivery</li>
                <li className="flex items-center gap-2"><Clock size={15} style={{ color: 'var(--lj-accent)' }} /> Made-to-order, hand-crafted: <strong>{leadTime}</strong></li>
                <li className="flex items-center gap-2"><RotateCcw size={15} style={{ color: 'var(--lj-accent)' }} /> {returnsPolicy}</li>
                <li className="flex items-center gap-2"><ShieldCheck size={15} style={{ color: 'var(--lj-accent)' }} /> {warrantyText}</li>
              </ul>
            </AccordionBlock>

            <AccordionBlock title="Care & cleaning" icon={<Sparkles size={17} style={{ color: 'var(--lj-accent)' }} />} testid="v2-acc-care">
              <p>{careText}</p>
            </AccordionBlock>

            <AccordionBlock title="About the maker" icon={<Gem size={17} style={{ color: 'var(--lj-accent)' }} />} testid="v2-acc-maker">
              <p>{makerText}</p>
            </AccordionBlock>
          </section>

          {/* Related products — real anchor links in raw HTML */}
          {project.related && project.related.length > 0 && (
            <section className="pt-16 pb-6" data-testid="v2-related">
              <div className="flex items-end justify-between mb-5 flex-wrap gap-3">
                <div>
                  <h2 className="text-[28px] sm:text-[32px] leading-tight" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", color: 'var(--lj-text)' }}>You may also love</h2>
                  <p className="text-[13.5px] mt-1" style={{ color: 'var(--lj-muted)' }}>Hand-picked pieces in the same spirit.</p>
                </div>
                <Link href="/collections" className="hidden sm:inline-flex items-center gap-1 text-[13.5px] font-semibold no-underline" style={{ color: 'var(--lj-accent)' }}>
                  Browse collections <ChevronRight size={14} />
                </Link>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
                {project.related.slice(0, 4).map((p, i) => <ProductCard key={p.slug} product={p} index={i} />)}
              </div>
            </section>
          )}
        </div>
      </main>
    </StoreLayout>
  );
}
