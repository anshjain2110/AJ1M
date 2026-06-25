import Link from 'next/link';
import { Star, Users, ArrowRight, ChevronRight, ExternalLink, Sparkles, MapPin, Phone, Globe } from 'lucide-react';
import StoreLayout from '../components/store/StoreLayout';
import ProductCard from '../components/store/ProductCard';
import HomeHero from '../components/HomeHero';
import { apiGet, listProducts } from '../lib/api';

export const revalidate = 60;

export const metadata = {
  title: {
    absolute: 'The Local Jewel — Custom Diamond Jewelry, Hand-Crafted in Winter Park, FL',
  },
  description:
    'Independent custom jewelry studio specializing in lab-grown diamond engagement rings, wedding bands, and fine jewelry. Hand-crafted to order in Winter Park, Florida. Ships in 2–5 business days.',
  alternates: { canonical: '/' },
};

const COMPARISON = {
  savingsAmount: '$4,200',
  example: {
    ring: '4.5ct Radiant Hidden Halo',
    type: 'Engagement Ring',
    centerStone: '3ct Radiant',
    colorClarity: 'F / VS1',
    metal: '14K White Gold',
    retailCert: 'IGI Certified',
    tljCert: 'IGI - LG687583822',
    tljCertLink: '/igi-certificate.pdf',
    tljProductLink: 'https://www.etsy.com/listing/1899846111/44-carat-radiant-shaped-certified',
    retailPrice: '$5,800',
    tljPrice: '$1,800',
    savings: '$4,000',
    competitors: [
      { name: 'Brilliant Earth', url: 'https://www.brilliantearth.com/lab-diamonds-search/?shapes=Radiant&carats_min=4&carats_max=5' },
      { name: 'Grown Brilliance', url: 'https://www.grownbrilliance.com/collections/radiant-lab-grown-diamond-engagement-rings' },
      { name: 'Blue Nile', url: 'https://www.bluenile.com/diamond-search?shape=RA&minCarat=4&maxCarat=5&labGrown=true' },
    ],
  },
};

const ETSY_REVIEWS = [
  { name: 'Narindra', date: 'Feb 13, 2026', rating: 5, text: "The store's communication is prompt, responsive, and respectful. Great quality. Would recommend.", product: '4.4ct Radiant Diamond Ring – Hidden Halo – 14K White Gold' },
  { name: 'Eesa', date: 'Jun 20, 2025', rating: 5, text: "Absolutely blown away. The ring is stunning, sparkles like crazy, beautifully made, and exactly as described. Shipping was fast, seller was great.", product: '3.32ct Oval IGI Certified Ring – Hidden Halo – White Gold' },
  { name: 'Pam', date: 'Nov 26, 2025', rating: 5, text: "This ring is absolutely beautiful! High quality, brilliant shine and sparkles. The owner communicates exceptionally. I highly recommend.", product: '3.30ct Pear Shaped Ring – Hidden Halo – 14K White Gold' },
  { name: 'ULT', date: 'Jul 23, 2025', rating: 5, text: "Came super fast! Ansh the owner was very helpful during the buying process, quality of the item was superb for the price.", product: '4.4ct Radiant Diamond Ring – Hidden Halo – 14K White Gold' },
  { name: 'Russell Stacy', date: 'Jan 19, 2026', rating: 5, text: "Very beautiful craftsmanship. Ring met more than our expectations.", product: '4.12ct Radiant Ring – 14K Yellow Gold Hidden Halo' },
];

export default async function HomePage() {
  const featuredProducts = await listProducts({ limit: 8 }).catch(() => null);
  const featured = (featuredProducts && featuredProducts.products) || [];
  const ex = COMPARISON.example;

  return (
    <StoreLayout>
      <main className="flex-1 flex flex-col" style={{ background: 'var(--lj-bg)' }} data-testid="home-page">
        {/* SSR hero with client-side quote modal launcher */}
        <HomeHero />

        {/* Featured projects */}
        {featured.length > 0 && (
          <section className="px-4 md:px-8 py-12 max-w-7xl mx-auto w-full">
            <div className="flex items-end justify-between mb-6 flex-wrap gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.22em] mb-2" style={{ color: 'var(--lj-muted)' }}>Featured</p>
                <h2 className="text-[28px] sm:text-[34px]" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", color: 'var(--lj-text)' }}>
                  Engagement rings, hand-crafted to order.
                </h2>
              </div>
              <Link href="/collections" className="text-[13.5px] font-semibold inline-flex items-center gap-1 no-underline" style={{ color: 'var(--lj-accent)' }}>
                Shop all <ChevronRight size={14} />
              </Link>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
              {featured.slice(0, 8).map((p, i) => <ProductCard key={p.slug} product={p} index={i} />)}
            </div>
          </section>
        )}

        {/* Savings comparison */}
        <section className="relative px-4 pt-8 pb-12 flex flex-col items-center text-center">
          <div className="w-48 h-48 md:w-56 md:h-56 rounded-full overflow-hidden mb-8 mx-auto"
            style={{ boxShadow: '0 0 60px rgba(15,94,76,0.1), var(--lj-shadow-2)', border: '2px solid rgba(15,94,76,0.15)' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/hero-photo.jpeg" alt="Premium diamond ring" className="w-full h-full object-cover" loading="eager" />
          </div>
          <h2 className="text-[28px] leading-[34px] font-semibold tracking-[-0.01em] mb-5 max-w-md" style={{ color: 'var(--lj-text)' }}>
            Join a community that buys diamond jewelry the smarter way.
          </h2>
          <p className="text-[18px] leading-[26px] mb-2 max-w-sm" style={{ color: 'var(--lj-text)' }}>
            On average, our clients save <span className="font-semibold" style={{ color: 'var(--lj-accent)' }}>{COMPARISON.savingsAmount}</span>/piece.
          </p>
          <p className="text-[14px] leading-[20px] mb-5" style={{ color: 'var(--lj-muted)' }}>
            Compared to traditional retail jewelry pricing.
          </p>

          <div data-testid="savings-comparison-panel" className="w-full max-w-2xl mb-6 rounded-[22px] p-4 sm:p-6 text-left relative overflow-hidden"
            style={{ background: 'linear-gradient(180deg, rgba(15,94,76,0.04) 0%, rgba(15,94,76,0.01) 60%, var(--lj-surface) 100%)', border: '1px solid var(--lj-border)', boxShadow: '0 10px 40px rgba(15,94,76,0.06), 0 1px 0 rgba(255,255,255,0.6) inset' }}>
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="h-px w-6" style={{ background: 'var(--lj-border)' }} />
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--lj-accent)' }}>Real customer comparison</span>
              <span className="h-px w-6" style={{ background: 'var(--lj-border)' }} />
            </div>
            <h3 className="text-[22px] sm:text-[26px] leading-[1.15] font-semibold text-center mb-1 tracking-[-0.01em]" style={{ color: 'var(--lj-text)' }}>
              Same ring. <span style={{ color: 'var(--lj-accent)' }}>{ex.savings} less.</span>
            </h3>
            <p className="text-[13px] text-center mb-5" style={{ color: 'var(--lj-muted)' }}>
              Side-by-side: a recent client&apos;s piece vs. comparable retail listings.
            </p>

            <div className="relative grid md:grid-cols-2 gap-3 md:gap-5">
              <div aria-hidden="true" className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-10 h-10 items-center justify-center rounded-full text-[11px] font-bold tracking-wider"
                style={{ background: 'var(--lj-text)', color: '#FFFFFF', boxShadow: '0 6px 18px rgba(0,0,0,0.12)' }}>VS</div>

              <div className="p-4 rounded-[16px]" style={{ background: 'var(--lj-surface)', border: '1px solid var(--lj-border)' }}>
                <div className="flex items-center justify-center mb-2">
                  <span className="text-[12px] font-semibold uppercase tracking-[0.12em]" style={{ color: 'var(--lj-muted)' }}>Traditional Retail</span>
                </div>
                <div className="flex flex-wrap justify-center gap-1.5 mb-3">
                  {ex.competitors.map((c, ci) => (
                    <a key={ci} href={c.url} target="_blank" rel="noopener noreferrer" className="text-[11px] px-2 py-1 rounded-full transition-colors hover:bg-[#EDEDEB]" style={{ color: 'var(--lj-muted)', border: '1px solid var(--lj-border)' }}>{c.name} ↗</a>
                  ))}
                </div>
                <div className="space-y-2.5">
                  {[['Ring', ex.ring], ['Type', ex.type], ['Center Stone', ex.centerStone], ['Color / Clarity', ex.colorClarity], ['Metal', ex.metal], ['Certification', ex.retailCert]].map(([label, value]) => (
                    <div key={label} className="flex justify-between text-[13px]">
                      <span style={{ color: 'var(--lj-muted)' }}>{label}</span>
                      <span className="font-medium text-right" style={{ color: 'var(--lj-text)' }}>{value}</span>
                    </div>
                  ))}
                  <div className="pt-2.5 mt-2.5" style={{ borderTop: '1px solid var(--lj-border)' }}>
                    <div className="flex justify-between items-center">
                      <span className="text-[13px]" style={{ color: 'var(--lj-muted)' }}>Price</span>
                      <span className="text-[20px] font-semibold" style={{ color: 'var(--lj-text)' }}>
                        <span className="line-through opacity-60">{ex.retailPrice}</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-[16px] relative" style={{ background: 'var(--lj-surface)', border: '2px solid var(--lj-accent)', boxShadow: '0 8px 28px rgba(15,94,76,0.12)' }}>
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-[0.12em]" style={{ background: 'var(--lj-accent)', color: '#FFFFFF' }}>Best value</div>
                <div className="flex items-center justify-center mb-2">
                  <span className="text-[12px] font-semibold uppercase tracking-[0.12em]" style={{ color: 'var(--lj-accent)' }}>The Local Jewel</span>
                </div>
                <div className="flex justify-center mb-3">
                  <a href={ex.tljProductLink} target="_blank" rel="noopener noreferrer" className="text-[11px] px-2 py-1 rounded-full transition-colors hover:opacity-80" style={{ color: 'var(--lj-accent)', border: '1px solid rgba(15,94,76,0.2)' }}>
                    View this piece ↗
                  </a>
                </div>
                <div className="space-y-2.5">
                  {[['Ring', ex.ring], ['Type', ex.type], ['Center Stone', ex.centerStone], ['Color / Clarity', ex.colorClarity], ['Metal', ex.metal]].map(([label, value]) => (
                    <div key={label} className="flex justify-between text-[13px]">
                      <span style={{ color: 'var(--lj-muted)' }}>{label}</span>
                      <span className="font-medium text-right" style={{ color: 'var(--lj-text)' }}>{value}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-[13px]">
                    <span style={{ color: 'var(--lj-muted)' }}>Certification</span>
                    <a href={ex.tljCertLink} target="_blank" rel="noopener noreferrer" className="font-medium text-right underline decoration-dotted underline-offset-2 hover:opacity-80 transition-opacity" style={{ color: 'var(--lj-accent)' }}>{ex.tljCert}</a>
                  </div>
                  <div className="pt-2.5 mt-2.5" style={{ borderTop: '1px solid rgba(15,94,76,0.2)' }}>
                    <div className="flex justify-between items-center">
                      <span className="text-[13px]" style={{ color: 'var(--lj-muted)' }}>Price</span>
                      <span className="text-[20px] font-semibold" style={{ color: 'var(--lj-accent)' }}>{ex.tljPrice}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3.5 rounded-[14px]" style={{ background: 'var(--lj-accent)', color: '#FFFFFF', boxShadow: '0 8px 22px rgba(15,94,76,0.22)' }}>
              <div className="flex items-center gap-2">
                <Sparkles size={16} />
                <span className="text-[14px] sm:text-[15px] leading-[1.35]">
                  You save <span className="font-semibold text-[18px] sm:text-[20px] tracking-tight">{ex.savings}</span> <span className="opacity-80">on this exact piece.</span>
                </span>
              </div>
            </div>
            <p className="mt-3 text-[11px] text-center" style={{ color: 'var(--lj-muted)', opacity: 0.8 }}>
              Example based on a recent client purchase and comparable retail pricing.
            </p>
          </div>

          <div className="flex items-center gap-4 mb-8">
            <div className="px-3 py-1.5 rounded-full text-[13px] font-medium" style={{ background: '#E8F5F1', color: 'var(--lj-accent)', border: '1px solid #C8E6DE' }}>GIA Certified</div>
            <div className="px-3 py-1.5 rounded-full text-[13px] font-medium" style={{ background: '#E8F5F1', color: 'var(--lj-accent)', border: '1px solid #C8E6DE' }}>IGI Certified</div>
          </div>
        </section>

        {/* Social proof bar */}
        <div className="px-4 py-5 flex items-center justify-center gap-6 md:gap-10 overflow-x-auto" style={{ borderTop: '1px solid var(--lj-border)', borderBottom: '1px solid var(--lj-border)' }}>
          <div className="flex items-center gap-2 flex-shrink-0"><Star size={16} style={{ color: 'var(--lj-accent)' }} fill="var(--lj-accent)" /><span className="text-[13px] whitespace-nowrap" style={{ color: 'var(--lj-muted)' }}><strong style={{ color: 'var(--lj-text)' }}>4.93</strong> stars (250+ reviews)</span></div>
          <div className="flex items-center gap-2 flex-shrink-0"><Users size={16} style={{ color: 'var(--lj-accent)' }} /><span className="text-[13px] whitespace-nowrap" style={{ color: 'var(--lj-muted)' }}><strong style={{ color: 'var(--lj-text)' }}>300+</strong> happy customers</span></div>
          <div className="flex items-center gap-2 flex-shrink-0"><Globe size={16} style={{ color: 'var(--lj-accent)' }} /><span className="text-[13px] whitespace-nowrap" style={{ color: 'var(--lj-muted)' }}>Free Insured <strong style={{ color: 'var(--lj-text)' }}>Global Shipping</strong></span></div>
        </div>

        {/* Etsy reviews */}
        <section className="px-4 py-10" style={{ borderTop: '1px solid var(--lj-border)' }}>
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-[22px] leading-[28px] font-medium mb-1" style={{ color: 'var(--lj-text)' }}>Verified Etsy Reviews</h2>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={14} fill={i < 4 ? 'var(--lj-accent)' : 'none'} style={{ color: 'var(--lj-accent)' }} />)}
                  </div>
                  <span className="text-[14px] font-medium" style={{ color: 'var(--lj-text)' }}>4.93</span>
                </div>
              </div>
              <a href="https://www.etsy.com/shop/thelocaljewel#reviews" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium transition-colors hover:bg-[#F0F0EE]" style={{ color: 'var(--lj-accent)', border: '1px solid var(--lj-border)' }}>
                View on Etsy <ExternalLink size={12} />
              </a>
            </div>
            <div className="space-y-4">
              {ETSY_REVIEWS.map((review, i) => (
                <div key={i} className="p-5 rounded-[14px]" style={{ background: 'var(--lj-surface)', border: '1px solid var(--lj-border)' }}>
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-[14px] font-semibold" style={{ background: 'rgba(15,94,76,0.08)', color: 'var(--lj-accent)' }}>
                      {review.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-[14px] font-medium" style={{ color: 'var(--lj-text)' }}>{review.name}</span>
                        <span className="text-[12px]" style={{ color: 'var(--lj-muted)' }}>{review.date}</span>
                      </div>
                      <div className="flex items-center gap-0.5 mt-0.5">
                        {Array.from({ length: review.rating }).map((_, j) => <Star key={j} size={12} fill="var(--lj-accent)" style={{ color: 'var(--lj-accent)' }} />)}
                      </div>
                    </div>
                  </div>
                  <p className="text-[15px] leading-[22px] mb-1" style={{ color: 'var(--lj-text)' }}>&ldquo;{review.text}&rdquo;</p>
                  <p className="text-[12px] mt-2" style={{ color: 'var(--lj-muted)' }}>— {review.product}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Custom cuts callout */}
        <section className="px-4 py-12" style={{ borderTop: '1px solid var(--lj-border)' }}>
          <div className="max-w-2xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-2" style={{ background: 'rgba(15,94,76,0.08)' }}>
              <Sparkles size={13} style={{ color: 'var(--lj-accent)' }} />
              <span className="text-[12px] font-medium uppercase tracking-wider" style={{ color: 'var(--lj-accent)' }}>Exclusive</span>
            </div>
            <h2 className="text-[26px] leading-[30px] font-semibold mb-2" style={{ color: 'var(--lj-text)' }}>We custom cut diamonds</h2>
            <p className="text-[15px] leading-[22px] mb-6 max-w-xl mx-auto" style={{ color: 'var(--lj-muted)' }}>
              Shapes never seen before — letters, symbols, initials, anything you dream of.
            </p>
            <Link href="/cuts" className="inline-flex items-center gap-2 min-h-[48px] px-6 rounded-[14px] font-medium text-[15px] transition-all duration-300 active:scale-[0.99] no-underline" style={{ background: 'var(--lj-accent)', color: '#FFFFFF' }}>
              See our custom cuts <ArrowRight size={16} />
            </Link>
          </div>
        </section>

        {/* Contact & location */}
        <section className="px-4 py-10" style={{ borderTop: '1px solid var(--lj-border)' }}>
          <div className="max-w-2xl mx-auto">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 rounded-[14px] flex flex-col items-center text-center" style={{ background: 'var(--lj-surface)', border: '1px solid var(--lj-border)' }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center mb-3" style={{ background: 'rgba(15,94,76,0.08)' }}>
                  <Globe size={18} style={{ color: 'var(--lj-accent)' }} />
                </div>
                <p className="text-[14px] font-medium mb-1" style={{ color: 'var(--lj-text)' }}>Worldwide Shipping</p>
                <p className="text-[12px]" style={{ color: 'var(--lj-muted)' }}>Free insured shipping across the United States &amp; international orders welcome</p>
              </div>
              <div className="p-4 rounded-[14px] flex flex-col items-center text-center" style={{ background: 'var(--lj-surface)', border: '1px solid var(--lj-border)' }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center mb-3" style={{ background: 'rgba(15,94,76,0.08)' }}>
                  <MapPin size={18} style={{ color: 'var(--lj-accent)' }} />
                </div>
                <p className="text-[14px] font-medium mb-1" style={{ color: 'var(--lj-text)' }}>Our Location</p>
                <p className="text-[12px]" style={{ color: 'var(--lj-muted)' }}>480N Orlando Ave<br />Winter Park, FL 32789</p>
              </div>
              <div className="p-4 rounded-[14px] flex flex-col items-center text-center" style={{ background: 'var(--lj-surface)', border: '1px solid var(--lj-border)' }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center mb-3" style={{ background: 'rgba(15,94,76,0.08)' }}>
                  <Phone size={18} style={{ color: 'var(--lj-accent)' }} />
                </div>
                <p className="text-[14px] font-medium mb-1" style={{ color: 'var(--lj-text)' }}>Get in Touch</p>
                <a href="tel:+15857108292" className="text-[12px] hover:underline" style={{ color: 'var(--lj-accent)' }}>585-710-8292</a>
                <p className="text-[12px] mt-0.5" style={{ color: 'var(--lj-muted)' }}>ansh@thelocaljewel.com</p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </StoreLayout>
  );
}
