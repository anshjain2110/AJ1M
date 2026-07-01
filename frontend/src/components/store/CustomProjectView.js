'use client';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import axios from 'axios';
import {
  ArrowRight, Sparkles, ChevronRight, Star, Quote,
  Diamond, Gem, ShieldCheck, MapPin,
} from 'lucide-react';
import PublicHeader from '../PublicHeader';
import PriceTag from '../PriceTag';
import ProjectInquiryChat from '../ProjectInquiryChat';
import QuickQuoteModal from '../wizard/QuickQuoteModal';
import ProductCard from './ProductCard';
import SaleAnnouncementBar from '../SaleAnnouncementBar';
import { projectToCard } from '../../utils/variantOptions';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

const TAG_LABELS = {
  engagement_ring: 'Engagement Rings', wedding_band: 'Wedding Bands',
  oval: 'Oval', radiant: 'Radiant', emerald: 'Emerald', cushion: 'Cushion',
  princess: 'Princess', pear: 'Pear', round: 'Round',
  hidden_halo: 'Hidden Halo', solitaire: 'Solitaire', side_stones: 'Side Stones',
  three_stone: 'Three Stone', pave: 'Pavé',
  lab_grown: 'Lab Grown', igi_certified: 'IGI Certified', gia_certified: 'GIA Certified',
  white_gold: 'White Gold', yellow_gold: 'Yellow Gold', rose_gold: 'Rose Gold', platinum: 'Platinum',
  '3ct': '3+ Carat', '4ct': '4+ Carat', '5ct': '5+ Carat',
};
const labelFor = (t) => TAG_LABELS[t] || t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

const SpecRow = ({ label, value, href }) => {
  if (!value) return null;
  return (
    <div className="flex items-baseline justify-between gap-3 py-2.5" style={{ borderBottom: '1px solid var(--lj-border)' }}>
      <span className="text-[12px] uppercase tracking-[0.1em]" style={{ color: 'var(--lj-muted)' }}>{label}</span>
      {href ? (
        <a href={href} target="_blank" rel="noopener noreferrer" className="text-[14px] font-medium text-right underline decoration-dotted underline-offset-2" style={{ color: 'var(--lj-accent)' }}>{value}</a>
      ) : (
        <span className="text-[14px] font-medium text-right" style={{ color: 'var(--lj-text)' }}>{value}</span>
      )}
    </div>
  );
};

// Story / lead-gen layout for non-buyable (Custom Project) pieces. `project` is
// passed in by the parent route so it never re-fetches the main document.
export default function CustomProjectView({ project }) {
  const [related, setRelated] = useState([]);
  const [activeImage, setActiveImage] = useState(project.hero_image_url || (project.gallery && project.gallery[0] && project.gallery[0].url));
  const [quickQuoteOpen, setQuickQuoteOpen] = useState(false);
  const openQuickQuote = () => setQuickQuoteOpen(true);

  const inspirationFiles = project.hero_image_url
    ? [{ url: project.hero_image_url, original_name: project.title || project.slug, media_type: 'image' }]
    : [];
  const inspirationNotes = `I'd like something like "${project.title}"${project.subtitle ? ` (${project.subtitle})` : ''}.${project.description ? ` ${project.description}` : ''}`;
  const inspirationLink = `https://thelocaljewel.com/projects/${project.slug}`;

  const pageTitle = String(project.meta_title || (project.title + ' | The Local Jewel'));
  useEffect(() => {
    const prev = document.title;
    document.title = pageTitle;
    return () => { document.title = prev; };
  }, [pageTitle]);

  useEffect(() => {
    const firstTag = (project.tags || [])[0];
    if (!firstTag) return;
    let mounted = true;
    axios.get(`${BACKEND_URL}/api/projects?tag=${encodeURIComponent(firstTag)}&exclude_slug=${encodeURIComponent(project.slug)}&limit=3`)
      .then(r => { if (mounted) setRelated((r.data.projects || []).slice(0, 3)); })
      .catch(() => {});
    return () => { mounted = false; };
  }, [project.slug, project.tags]);

  const specs = project.specs || {};
  const journey = project.journey || [];
  const gallery = project.gallery || [];
  const story = project.customer_story;
  const hasAnySpec = ['carat', 'shape', 'setting_style', 'metal', 'color', 'clarity', 'certification'].some(k => specs[k]);

  const jsonLdString = JSON.stringify({
    '@context': 'https://schema.org', '@type': 'CreativeWork', name: project.title,
    description: project.meta_description || project.description || '', image: project.hero_image_url || '',
    creator: { '@type': 'Organization', name: 'The Local Jewel', url: 'https://thelocaljewel.com' },
    url: 'https://thelocaljewel.com/projects/' + project.slug,
  });
  const pageDescription = String(project.meta_description || (project.description ? project.description.slice(0, 160) : ''));
  const canonicalUrl = 'https://thelocaljewel.com/projects/' + project.slug;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--lj-bg)' }} data-testid="project-detail-page">
      <Helmet>
        <meta name="description" content={pageDescription} />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:title" content={String(project.meta_title || project.title || '')} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:image" content={project.hero_image_url || ''} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={canonicalUrl} />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString }} />

      <SaleAnnouncementBar />
      <PublicHeader />

      {/* Breadcrumb */}
      <nav className="px-4 pt-5 max-w-6xl mx-auto w-full" aria-label="Breadcrumb">
        <ol className="flex items-center gap-1.5 text-[12px]" style={{ color: 'var(--lj-muted)' }}>
          <li><Link to="/" className="hover:underline">Home</Link></li>
          <ChevronRight size={12} />
          <li><Link to="/projects" className="hover:underline">Projects</Link></li>
          <ChevronRight size={12} />
          <li className="truncate max-w-[220px] sm:max-w-none" style={{ color: 'var(--lj-text)' }}>{project.title}</li>
        </ol>
      </nav>

      {/* Hero */}
      <section className="px-4 pt-5 pb-8 max-w-6xl mx-auto w-full">
        <div className="grid lg:grid-cols-2 gap-6 lg:gap-10 lg:items-start">
          {/* Media side */}
          <div>
            <div className="hidden lg:flex flex-col gap-4" data-testid="project-gallery-stack">
              {[
                ...(project.hero_image_url ? [{ url: project.hero_image_url, caption: 'Hero', type: 'final', media_type: 'image' }] : []),
                ...gallery.filter(g => g.url && g.url !== project.hero_image_url),
              ].map((m, i) => (
                <div key={i} className="relative rounded-[18px] overflow-hidden" style={{ background: 'var(--lj-surface)', border: '1px solid var(--lj-border)' }}>
                  {m.media_type === 'video' ? (
                    <video src={m.url} controls muted loop playsInline preload="metadata" className="w-full h-auto block" />
                  ) : (
                    <img src={m.url} alt={m.caption || `${project.title} — view ${i + 1}`} className="w-full h-auto block" loading={i > 1 ? 'lazy' : 'eager'} />
                  )}
                  {m.type === 'render' && m.media_type !== 'video' && (
                    <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-[0.1em]" style={{ background: 'rgba(0,0,0,0.55)', color: '#fff', backdropFilter: 'blur(8px)' }}>3D render</span>
                  )}
                </div>
              ))}
            </div>
            <div className="lg:hidden">
              <div className="relative rounded-[18px] overflow-hidden aspect-[4/5] sm:aspect-square" style={{ background: 'var(--lj-surface)', border: '1px solid var(--lj-border)' }}>
                {activeImage ? (() => {
                  const isUrl = typeof activeImage === 'string';
                  const url = isUrl ? activeImage : activeImage.url;
                  const isVideo = !isUrl && activeImage.media_type === 'video';
                  return isVideo
                    ? <video src={url} controls autoPlay muted loop playsInline className="w-full h-full object-cover" />
                    : <img src={url} alt={project.title} className="w-full h-full object-cover" />;
                })() : <div className="w-full h-full flex items-center justify-center" style={{ color: 'var(--lj-muted)' }}>No image</div>}
              </div>
              {gallery.length > 0 && (
                <div className="mt-3 flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                  {[{ url: project.hero_image_url, caption: 'Hero', type: 'final', media_type: 'image' }, ...gallery].filter(g => g.url).map((g, i) => {
                    const isActive = typeof activeImage === 'string' ? activeImage === g.url : activeImage?.url === g.url;
                    const isVideo = g.media_type === 'video';
                    return (
                      <button key={i} onClick={() => setActiveImage(isVideo ? g : g.url)} data-testid={`gallery-thumb-${i}`}
                        className="relative flex-shrink-0 w-[68px] h-[68px] sm:w-[78px] sm:h-[78px] rounded-[10px] overflow-hidden transition-all"
                        style={{ border: isActive ? '2px solid var(--lj-accent)' : '1px solid var(--lj-border)', opacity: isActive ? 1 : 0.85 }}>
                        {isVideo ? (
                          <><video src={g.url} muted playsInline preload="metadata" className="w-full h-full object-cover" />
                            <span className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.32)' }}><span style={{ color: '#fff', fontSize: 16 }}>▶</span></span></>
                        ) : (
                          <img src={g.url} alt={g.caption || `View ${i + 1}`} className="w-full h-full object-cover" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Title / CTA side */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4" style={{ background: 'rgba(15,94,76,0.08)', border: '1px solid rgba(15,94,76,0.15)' }}>
              <Sparkles size={13} style={{ color: 'var(--lj-accent)' }} />
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: 'var(--lj-accent)' }}>Custom Built · The Local Jewel</span>
            </div>
            <h1 className="text-[28px] sm:text-[40px] leading-[1.08] font-semibold tracking-[-0.02em] mb-3" style={{ color: 'var(--lj-text)', fontFamily: 'var(--lj-serif, "Cormorant Garamond", "Playfair Display", Georgia, serif)' }}>{project.title}</h1>
            {project.subtitle && <p className="text-[15px] sm:text-[16px] leading-[1.5] mb-5" style={{ color: 'var(--lj-muted)' }}>{project.subtitle}</p>}
            <div className="flex flex-wrap gap-2 mb-6">
              {(project.tags || []).slice(0, 4).map(t => (
                <span key={t} className="text-[12px] px-2.5 py-1 rounded-full" style={{ background: 'rgba(15,94,76,0.06)', color: 'var(--lj-accent)', border: '1px solid rgba(15,94,76,0.12)' }}>{labelFor(t)}</span>
              ))}
            </div>
            {project.description && <p className="text-[15px] leading-[1.6] mb-6" style={{ color: 'var(--lj-text)' }}>{project.description}</p>}

            {(project.price !== null && project.price !== undefined && project.price !== '') && (
              <div className="mb-6" data-testid="project-detail-price">
                <PriceTag price={project.price} prefix={project.price_prefix} currency={project.price_currency} size="lg" testid="project-detail-price-tag" />
                <p className="mt-1.5 text-[12px]" style={{ color: 'var(--lj-muted)' }}>Final price varies with size, metal &amp; customization — locked in your written quote.</p>
              </div>
            )}

            <button onClick={openQuickQuote} data-testid="project-detail-cta"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 min-h-[52px] px-7 rounded-[14px] font-medium text-[16px] transition-all duration-300 active:scale-[0.99] hover:opacity-95"
              style={{ background: 'var(--lj-accent)', color: '#FFFFFF', boxShadow: '0 4px 20px rgba(15,94,76,0.22)' }}>
              Start a piece like this <ArrowRight size={18} />
            </button>
            <p className="mt-2 text-[12px]" style={{ color: 'var(--lj-muted)' }}>Takes about 90 seconds · No payment required</p>

            <div className="mt-6"><ProjectInquiryChat project={project} /></div>
          </div>
        </div>
      </section>

      {/* Specs */}
      {hasAnySpec && (
        <section className="px-4 pb-10 max-w-6xl mx-auto w-full" data-testid="project-specs">
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <h2 className="text-[22px] sm:text-[28px] leading-[1.15] font-semibold mb-4 tracking-[-0.01em]" style={{ color: 'var(--lj-text)', fontFamily: 'var(--lj-serif, "Cormorant Garamond", "Playfair Display", Georgia, serif)' }}>Specifications</h2>
              <div className="rounded-[16px] p-5" style={{ background: 'var(--lj-surface)', border: '1px solid var(--lj-border)' }}>
                <SpecRow label="Carat" value={specs.carat} />
                <SpecRow label="Shape" value={specs.shape} />
                <SpecRow label="Setting" value={specs.setting_style} />
                <SpecRow label="Metal" value={specs.metal} />
                <SpecRow label="Color" value={specs.color} />
                <SpecRow label="Clarity" value={specs.clarity} />
                <SpecRow label="Certification" value={specs.certification && specs.cert_number ? `${specs.certification} · ${specs.cert_number}` : (specs.certification || specs.cert_number)} href={specs.cert_link || null} />
              </div>
            </div>
            <aside className="rounded-[16px] p-5 self-start" style={{ background: 'var(--lj-surface)', border: '1px solid var(--lj-border)' }}>
              <h3 className="text-[14px] font-semibold mb-3" style={{ color: 'var(--lj-text)' }}>What you get</h3>
              {[
                { icon: Gem, text: 'Crafted by The Local Jewel' },
                { icon: ShieldCheck, text: 'IGI / GIA certified diamond' },
                { icon: Diamond, text: 'Unlimited 3D render revisions' },
                { icon: MapPin, text: 'Free insured worldwide shipping' },
              ].map((it, i) => {
                const Icon = it.icon;
                return <div key={i} className="flex items-center gap-2.5 py-1.5"><Icon size={15} style={{ color: 'var(--lj-accent)' }} /><span className="text-[13px]" style={{ color: 'var(--lj-text)' }}>{it.text}</span></div>;
              })}
            </aside>
          </div>
        </section>
      )}

      {/* The Journey */}
      {journey.length > 0 && (
        <section className="px-4 pb-12 max-w-4xl mx-auto w-full" data-testid="project-journey">
          <div className="text-center mb-7">
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] mb-2" style={{ color: 'var(--lj-accent)' }}>The Journey</div>
            <h2 className="text-[24px] sm:text-[32px] leading-[1.15] font-semibold tracking-[-0.01em]" style={{ color: 'var(--lj-text)', fontFamily: 'var(--lj-serif, "Cormorant Garamond", "Playfair Display", Georgia, serif)' }}>From idea to finished piece</h2>
          </div>
          <div className="relative">
            <div aria-hidden="true" className="absolute left-[19px] sm:left-[23px] top-2 bottom-2 w-px" style={{ background: 'linear-gradient(to bottom, transparent, var(--lj-border) 8%, var(--lj-border) 92%, transparent)' }} />
            {journey.map((step, i) => (
              <div key={i} className="relative flex gap-4 sm:gap-5 py-4" data-testid={`journey-step-${i + 1}`}>
                <div className="relative flex-shrink-0 w-[40px] h-[40px] sm:w-[48px] sm:h-[48px] rounded-full flex items-center justify-center text-[12px] sm:text-[13px] font-bold z-10" style={{ background: 'var(--lj-surface)', border: '1px solid var(--lj-border)', color: 'var(--lj-accent)', boxShadow: '0 4px 14px rgba(15,94,76,0.06)' }}>{String(i + 1).padStart(2, '0')}</div>
                <div className="flex-1 min-w-0 pt-1.5">
                  <h3 className="text-[17px] sm:text-[19px] font-semibold mb-1 tracking-[-0.01em]" style={{ color: 'var(--lj-text)', fontFamily: 'var(--lj-serif, "Cormorant Garamond", "Playfair Display", Georgia, serif)' }}>{step.label}</h3>
                  {step.description && <p className="text-[13.5px] sm:text-[14.5px] leading-[1.55]" style={{ color: 'var(--lj-muted)' }}>{step.description}</p>}
                  {(() => {
                    const stepMedia = (step.media && step.media.length > 0) ? step.media : (step.image_url ? [{ url: step.image_url, media_type: 'image', caption: '' }] : []);
                    if (stepMedia.length === 0) return null;
                    return (
                      <div className={`mt-3 grid gap-2 max-w-md ${stepMedia.length === 1 ? '' : 'grid-cols-2 sm:grid-cols-3'}`}>
                        {stepMedia.map((m, mi) => (
                          <div key={mi} className="rounded-[12px] overflow-hidden" style={{ border: '1px solid var(--lj-border)' }}>
                            {m.media_type === 'video'
                              ? <video src={m.url} controls muted loop playsInline className="w-full h-auto block" preload="metadata" />
                              : <img src={m.url} alt={step.label} className="w-full h-auto block" loading="lazy" />}
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Customer story */}
      {story && (story.quote || story.name) && (
        <section className="px-4 pb-14 max-w-3xl mx-auto w-full" data-testid="project-customer-story">
          <div className="rounded-[18px] p-6 sm:p-8 relative" style={{ background: 'linear-gradient(180deg, rgba(15,94,76,0.04), rgba(15,94,76,0.01))', border: '1px solid var(--lj-border)' }}>
            <Quote size={32} className="mb-4" style={{ color: 'var(--lj-accent)', opacity: 0.55 }} />
            {story.quote && <p className="text-[18px] sm:text-[22px] leading-[1.4] mb-5 tracking-[-0.005em]" style={{ color: 'var(--lj-text)', fontFamily: 'var(--lj-serif, "Cormorant Garamond", "Playfair Display", Georgia, serif)' }}>"{story.quote}"</p>}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-[14px] font-semibold flex-shrink-0" style={{ background: 'rgba(15,94,76,0.08)', color: 'var(--lj-accent)' }}>{(story.name || '?').charAt(0).toUpperCase()}</div>
              <div className="flex-1 min-w-0">
                <div className="text-[14px] font-medium" style={{ color: 'var(--lj-text)' }}>{story.name || 'Customer'}</div>
                <div className="text-[12px]" style={{ color: 'var(--lj-muted)' }}>{[story.location, story.date].filter(Boolean).join(' · ')}</div>
              </div>
              <div className="flex items-center gap-0.5">{Array.from({ length: 5 }).map((_, i) => <Star key={i} size={13} fill="var(--lj-accent)" style={{ color: 'var(--lj-accent)' }} />)}</div>
            </div>
          </div>
        </section>
      )}

      {/* Related */}
      {related.length > 0 && (
        <section className="px-4 pb-14 max-w-6xl mx-auto w-full" data-testid="project-related">
          <h2 className="text-[22px] sm:text-[28px] leading-[1.15] font-semibold mb-5 tracking-[-0.01em]" style={{ color: 'var(--lj-text)', fontFamily: 'var(--lj-serif, "Cormorant Garamond", "Playfair Display", Georgia, serif)' }}>More like this</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
            {related.map((r, i) => <ProductCard key={r.slug || r.project_id} product={projectToCard(r, project.sale)} index={i} />)}
          </div>
        </section>
      )}

      {/* Big CTA */}
      <section className="px-4 py-14 text-center" style={{ background: 'var(--lj-accent)', color: '#FFFFFF' }}>
        <div className="max-w-xl mx-auto">
          <h2 className="text-[26px] sm:text-[34px] leading-[1.15] font-semibold mb-3 tracking-[-0.01em]" style={{ fontFamily: 'var(--lj-serif, "Cormorant Garamond", "Playfair Display", Georgia, serif)' }}>Want one like this?</h2>
          <p className="text-[15px] leading-[1.55] mb-6 opacity-90">Send us your inspiration. We'll send back photoreal 3D renders within 48 hours. You only pay once you fall in love.</p>
          <button onClick={openQuickQuote} data-testid="project-detail-cta-bottom" className="inline-flex items-center justify-center gap-2 min-h-[52px] px-7 rounded-[14px] font-medium text-[16px] transition-all duration-300 active:scale-[0.99]" style={{ background: '#FFFFFF', color: 'var(--lj-accent)' }}>Start your custom piece <ArrowRight size={18} /></button>
        </div>
      </section>

      <footer className="px-4 py-8 text-center" style={{ borderTop: '1px solid var(--lj-border)' }}>
        <div className="flex items-center justify-center gap-3 text-[12px] flex-wrap" style={{ color: 'var(--lj-muted)' }}>
          <a href="/" className="hover:underline">Home</a><span>·</span>
          <a href="/projects" className="hover:underline">Projects</a><span>·</span>
          <a href="/blog" className="hover:underline">Journal</a><span>·</span>
          <a href="/contact" className="hover:underline">Contact</a><span>·</span>
          <a href="/privacy" className="hover:underline">Privacy</a><span>·</span>
          <a href="/terms" className="hover:underline">Terms</a>
        </div>
      </footer>

      {/* Sticky mobile CTA */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 px-4 py-3" style={{ background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(10px)', borderTop: '1px solid var(--lj-border)' }}>
        <button onClick={openQuickQuote} data-testid="project-detail-sticky-cta" className="w-full inline-flex items-center justify-center gap-2 min-h-[48px] px-6 rounded-[12px] font-medium text-[15px]" style={{ background: 'var(--lj-accent)', color: '#FFFFFF', boxShadow: '0 4px 14px rgba(15,94,76,0.22)' }}>Get a piece like this <ArrowRight size={16} /></button>
      </div>
      <div className="lg:hidden" style={{ height: '80px' }} aria-hidden="true" />

      {quickQuoteOpen && (
        <QuickQuoteModal onClose={() => setQuickQuoteOpen(false)} inspirationLink={inspirationLink} inspirationFiles={inspirationFiles} inspirationNotes={inspirationNotes} inspirationVoice={null} />
      )}
    </div>
  );
}