import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import {
  Loader2, ChevronRight, ChevronLeft, ChevronDown, Star, Heart, Share2,
  ShieldCheck, Truck, RotateCcw, MapPin, Clock, BadgeCheck, Sparkles,
  ShoppingBag, Lock, Plus, Minus, Flame, Gem, Award, MessageCircle, Box,
  Hand, PenLine, Zap,
} from 'lucide-react';
import MegaMenuHeader from '../components/store/MegaMenuHeader';
import StoreFooter from '../components/store/StoreFooter';
import CustomProjectView from '../components/store/CustomProjectView';
import ProductCard from '../components/store/ProductCard';
import { useCart } from '../context/CartContext';
import { ProductSchema, BreadcrumbSchema } from '../utils/seoSchema';
import { useCountdown, fmtCountdown } from '../components/SaleAnnouncementBar';
import {
  METAL_TIERS, availableTiers, availableCaratsForTier, variantPrice,
  metalLabel, applySale, money, COLOR_SWATCH, typeHasCarat, METAL_ONLY_KEY,
} from '../utils/variantOptions';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

/* ------------------------------------------------------------------ */
/* Sets document.title + meta description imperatively (no Helmet)     */
/* ------------------------------------------------------------------ */
function TitleSetter({ title, description }) {
  useEffect(() => {
    const prev = document.title;
    document.title = title || prev;
    let meta = document.querySelector('meta[name="description"]');
    const prevMeta = meta ? meta.getAttribute('content') : null;
    if (!meta && description) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'description');
      document.head.appendChild(meta);
    }
    if (meta && description) meta.setAttribute('content', description);
    return () => {
      document.title = prev;
      if (meta && prevMeta !== null) meta.setAttribute('content', prevMeta);
    };
  }, [title, description]);
  return null;
}

/* ------------------------------------------------------------------ */
/* Mocked per-product reviews (seeded by slug for consistency)         */
/* ------------------------------------------------------------------ */
const REVIEW_POOL = [
  { name: 'Jessica T.', rating: 5, date: 'Feb 02, 2026', text: "Absolutely stunning. The craftsmanship is on another level — felt like I got something twice the price.", avatar: 'J' },
  { name: 'Marcus L.', rating: 5, date: 'Jan 19, 2026', text: "Owner walked me through every step. Renders were spot-on, final piece was even better in person.", avatar: 'M' },
  { name: 'Priya R.', rating: 5, date: 'Jan 04, 2026', text: "She said yes! Ring is breathtaking. Shipping was fast and packaging was beautiful.", avatar: 'P' },
  { name: 'David K.', rating: 4, date: 'Dec 22, 2025', text: "Great communication and beautiful finish. Took a bit longer than I expected but worth the wait.", avatar: 'D' },
  { name: 'Sarah W.', rating: 5, date: 'Dec 11, 2025', text: "I love that I knew exactly where every detail came from. Way better than a chain store experience.", avatar: 'S' },
  { name: 'Aaron M.', rating: 5, date: 'Nov 28, 2025', text: "The certificate, the box, the ring — everything was perfect. Will be coming back for the wedding band.", avatar: 'A' },
];
const seededFrom = (slug = '') => {
  let h = 0; for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) >>> 0;
  const pick = (arr, n) => {
    const a = [...arr]; const out = [];
    for (let i = 0; i < n && a.length; i++) { const idx = (h + i * 7) % a.length; out.push(a.splice(idx, 1)[0]); }
    return out;
  };
  const reviews = pick(REVIEW_POOL, 3);
  const rating = (4.7 + ((h % 30) / 100)).toFixed(1); // 4.70 → 4.99
  const count = 12 + (h % 18); // 12 – 29
  return { reviews, rating: Number(rating), count };
};

/* ------------------------------------------------------------------ */
/* Estimated delivery: today + 5 business days (skip weekends)         */
/* ------------------------------------------------------------------ */
const addBusinessDays = (start, days) => {
  const d = new Date(start);
  let added = 0;
  while (added < days) {
    d.setDate(d.getDate() + 1);
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6) added += 1;
  }
  return d;
};
const fmtEstDelivery = () => {
  const d1 = addBusinessDays(new Date(), 2);
  const d2 = addBusinessDays(new Date(), 5);
  const opts = { month: 'short', day: 'numeric' };
  return `${d1.toLocaleDateString('en-US', opts)} – ${d2.toLocaleDateString('en-US', opts)}`;
};

/* ------------------------------------------------------------------ */
/* Image gallery (mobile: snap-scroll w/ dots; desktop: main + thumbs) */
/* ------------------------------------------------------------------ */
function Gallery({ images, title }) {
  const [active, setActive] = useState(0);
  const scrollerRef = useRef(null);
  if (!images.length) return null;

  const goTo = (i) => {
    setActive(i);
    const el = scrollerRef.current;
    if (el) {
      el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' });
    }
  };

  const onScroll = () => {
    const el = scrollerRef.current; if (!el) return;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    if (i !== active) setActive(i);
  };

  return (
    <div data-testid="v2-gallery">
      {/* Mobile: snap scroller */}
      <div className="lg:hidden relative">
        <div
          ref={scrollerRef}
          onScroll={onScroll}
          className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide"
          style={{ scrollbarWidth: 'none' }}
        >
          {images.map((img, i) => (
            <div key={i} className="snap-start flex-shrink-0 w-full aspect-square" style={{ background: '#F3EEE7' }}>
              <img src={img.url} alt={img.caption || title} className="w-full h-full object-cover" loading={i === 0 ? 'eager' : 'lazy'} />
            </div>
          ))}
        </div>
        {/* Floating top actions */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
          <Link to="/collections" className="pointer-events-auto w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.94)', backdropFilter: 'blur(8px)' }} aria-label="Back">
            <ChevronLeft size={20} />
          </Link>
          <div className="flex items-center gap-2 pointer-events-auto">
            <button className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.94)', backdropFilter: 'blur(8px)' }} aria-label="Message"><MessageCircle size={18} /></button>
            <button className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.94)', backdropFilter: 'blur(8px)' }} aria-label="Save"><Heart size={18} /></button>
            <button className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.94)', backdropFilter: 'blur(8px)' }} aria-label="Share"><Share2 size={18} /></button>
          </div>
        </div>
        {/* Dots */}
        {images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
            {images.map((_, i) => (
              <button key={i} onClick={() => goTo(i)} aria-label={`Image ${i + 1}`}
                className="transition-all rounded-full"
                style={{
                  width: i === active ? 18 : 6, height: 6,
                  background: i === active ? '#0F5E4C' : 'rgba(255,255,255,0.7)',
                }} />
            ))}
          </div>
        )}
      </div>

      {/* Desktop: main image + thumbnail rail */}
      <div className="hidden lg:flex gap-4">
        <div className="flex flex-col gap-2.5 w-[78px] flex-shrink-0">
          {images.map((img, i) => (
            <button key={i} onClick={() => setActive(i)}
              className="w-[78px] h-[78px] rounded-[10px] overflow-hidden transition-all"
              style={{ border: active === i ? '2px solid #0F5E4C' : '1.5px solid #E5E0D7', opacity: active === i ? 1 : 0.75 }}>
              <img src={img.url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
        <div className="flex-1 rounded-[18px] overflow-hidden" style={{ background: '#F3EEE7' }}>
          <img src={images[active].url} alt={title} className="w-full aspect-square object-cover" />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Reusable accordion item                                             */
/* ------------------------------------------------------------------ */
function Accordion({ title, defaultOpen = false, icon, children, testid }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-t" style={{ borderColor: '#E5E0D7' }} data-testid={testid}>
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between py-5 text-left">
        <span className="flex items-center gap-2.5 text-[15.5px] font-semibold" style={{ color: '#0F5E4C' }}>
          {icon}{title}
        </span>
        <ChevronDown size={20} className="transition-transform" style={{ transform: open ? 'rotate(180deg)' : 'rotate(0)', color: '#0F5E4C' }} />
      </button>
      {open && <div className="pb-6 text-[14.5px] leading-[1.7]" style={{ color: '#3F4A45' }}>{children}</div>}
    </div>
  );
}

/* ================================================================== */
/* Main page                                                           */
/* ================================================================== */
export default function ProjectDetailPageV2() {
  const { slug } = useParams();
  const [project, setProject] = useState(null);
  const [sale, setSale] = useState(null);
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [persoOpen, setPersoOpen] = useState(false);
  const [perso, setPerso] = useState('');

  // Variant + cart state
  const { addItem, openCart } = useCart();
  const matrix = useMemo(() => project?.price_matrix || {}, [project]);
  const tiers = useMemo(() => availableTiers(matrix), [matrix]);
  const [tier, setTier] = useState('');
  const [color, setColor] = useState('');
  const [carat, setCarat] = useState('');
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  // Sale countdown hook must run unconditionally
  const left = useCountdown((sale && sale.ends_at) || null);

  // Load project + sale in parallel
  useEffect(() => {
    let mounted = true;
    setLoading(true); setNotFound(false); setProject(null);
    Promise.all([
      axios.get(`${BACKEND_URL}/api/projects/${slug}`).catch(() => null),
      axios.get(`${BACKEND_URL}/api/shop/sale`).catch(() => null),
      axios.get(`${BACKEND_URL}/api/admin/settings/public`).catch(() => null),
    ]).then(([pr, sr, ir]) => {
      if (!mounted) return;
      if (!pr || !pr.data) { setNotFound(true); setLoading(false); return; }
      setProject(pr.data);
      setSale((sr && sr.data && sr.data.sale) || null);
      setInfo((ir && ir.data) || null);
      setLoading(false);
    });
    return () => { mounted = false; };
  }, [slug]);

  // Initialize selectors when project loads
  useEffect(() => {
    if (!project) return;
    const pm = project.price_matrix || {};
    const t = availableTiers(pm)[0];
    if (t) {
      setTier(t.id);
      setColor(t.colors?.length ? 'Yellow' : '');
      if (typeHasCarat(project.product_type)) {
        const c = availableCaratsForTier(pm, t.id);
        setCarat(c[0] || '');
      } else {
        setCarat(METAL_ONLY_KEY);
      }
    }
  }, [project]);

  // Re-validate when tier changes
  useEffect(() => {
    if (!tier || !project) return;
    const t = METAL_TIERS.find((m) => m.id === tier);
    setColor((c) => (t?.colors?.length ? (t.colors.includes(c) ? c : 'Yellow') : ''));
    if (typeHasCarat(project.product_type)) {
      const cs = availableCaratsForTier(matrix, tier);
      setCarat((c) => (cs.includes(c) ? c : (cs[0] || '')));
    } else {
      setCarat(METAL_ONLY_KEY);
    }
  }, [tier, matrix, project]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: '#FBF7F0' }}>
        <MegaMenuHeader />
        <div className="flex-1 flex items-center justify-center" style={{ color: '#6B746F' }}>
          <Loader2 size={22} className="animate-spin mr-2" /> Loading…
        </div>
      </div>
    );
  }
  if (notFound || !project) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: '#FBF7F0' }}>
        <MegaMenuHeader />
        <div className="flex-1 flex flex-col items-center justify-center px-4 text-center">
          <h1 className="text-[26px] font-semibold mb-2">Piece not found</h1>
          <Link to="/collections" className="text-[14px] font-medium" style={{ color: '#0F5E4C' }}>Browse all collections</Link>
        </div>
      </div>
    );
  }

  // Custom (non-buyable) pieces render the story / lead-gen layout instead of the buy panel.
  if (!project.buyable) {
    return <CustomProjectView project={project} />;
  }

  /* ---------- Derived values --------- */
  const hasCarat = typeHasCarat(project.product_type);
  const base = variantPrice(matrix, tier, carat);
  const price = sale ? applySale(base, sale) : base;
  const available = base > 0;
  const tierObj = METAL_TIERS.find((m) => m.id === tier);

  const images = [
    ...(project.hero_image_url ? [{ url: project.hero_image_url, caption: project.title }] : []),
    ...((project.gallery || []).filter((g) => g.url && g.url !== project.hero_image_url)),
  ];

  const { reviews, rating: avgRating, count: reviewCount } = seededFrom(slug);
  const specs = project.specs || {};
  const journey = project.journey || [];
  const story = project.customer_story;
  const estDelivery = fmtEstDelivery();

  // Admin-editable product-page details (Admin → Settings → Product Page Details)
  const shipsFrom = (info && info.ships_from) || 'Winter Park, Florida';
  const leadTime = (info && info.lead_time) || '2–3 weeks';
  const returnsPolicy = (info && info.returns_policy) || '30-day exchanges, hassle-free';
  const warrantyText = (info && info.warranty_text) || 'Lifetime warranty on every piece';
  const careText = (info && info.care_text) || 'Clean with warm soapy water and a soft brush. Avoid harsh chemicals and chlorine. We offer complimentary lifetime cleaning and inspection for every piece we make.';
  const makerText = (info && info.maker_text) || 'The Local Jewel is an independent custom jewelry studio. Every piece is designed, rendered, and hand-set by us — no middlemen, no chain-store markups.';

  // Breadcrumb for header + JSON-LD
  const primaryCollection = (project.collections || [])[0] || '';
  const collectionName = primaryCollection
    ? primaryCollection.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    : '';
  const breadcrumb = [
    { name: 'Home', url: '/' },
    { name: 'Shop', url: '/collections' },
    primaryCollection && { name: collectionName, url: `/collections/${primaryCollection}` },
    { name: project.title, url: `/projects/${slug}` },
  ].filter(Boolean);

  // "About this piece" highlights — Etsy-inspired but derived from real product data
  const aboutHighlights = [
    { icon: Hand, label: 'Made by', value: 'The Local Jewel — hand-crafted to order' },
    { icon: MapPin, label: 'Ships from', value: `${shipsFrom} · free insured delivery` },
    { icon: Gem, label: 'Materials', value: [...tiers.map((t) => t.label), 'Lab-grown diamond'].join(', ') },
    (specs.shape || hasCarat) && { icon: Sparkles, label: 'Gemstone', value: ['Lab-grown diamond', specs.shape, specs.color && `Color ${specs.color}`, specs.clarity].filter(Boolean).join(' · ') },
    specs.setting_style && { icon: Award, label: 'Style', value: specs.setting_style },
    { icon: BadgeCheck, label: 'Certification', value: `${specs.certification || 'IGI'} certified${specs.cert_number ? ` · #${specs.cert_number}` : ''}` },
    { icon: PenLine, label: 'Personalization', value: 'Free engraving & ring sizing on request' },
  ].filter(Boolean);

  const buildLine = () => ({
    product_slug: project.slug,
    title: project.title,
    image: project.hero_image_url || (project.gallery && project.gallery[0] && project.gallery[0].url) || '',
    price,
    metal_tier: tier,
    metal_color: color,
    metal: metalLabel(tier, color),
    carat,
    size: '',
    quantity: qty,
    personalization: perso || undefined,
  });
  const addToBag = () => { if (available) { addItem(buildLine()); setAdded(true); setTimeout(() => setAdded(false), 1600); } };
  const buyNow = () => { if (available) { addItem(buildLine()); openCart(); } };

  const pageTitle = String(project.meta_title || `${project.title} | The Local Jewel`);
  const pageDesc = String(project.meta_description || (project.description || '').slice(0, 160));

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#FBF7F0', fontFamily: "'Outfit', Inter, system-ui, sans-serif" }} data-testid="project-detail-v2">
      <TitleSetter title={pageTitle} description={pageDesc} />
      {/* Product JSON-LD — AggregateRating intentionally OMITTED until a real
          customer-review module replaces the seeded on-page reviews. Per Google
          + the SEO audit: never emit Review/AggregateRating schema for reviews
          that aren't genuinely first-party reviews collected on this site. */}
      <ProductSchema project={project} settings={info || {}} />
      <BreadcrumbSchema items={breadcrumb} />

      <MegaMenuHeader />

      <main className="flex-1 max-w-6xl mx-auto w-full">
        {/* Breadcrumb — desktop only */}
        <nav className="hidden lg:flex px-6 pt-6 items-center gap-1.5 text-[12.5px]" style={{ color: '#6B746F' }} aria-label="Breadcrumb">
          <Link to="/" className="hover:underline">Home</Link>
          <ChevronRight size={12} />
          <Link to="/collections" className="hover:underline">Collections</Link>
          <ChevronRight size={12} />
          <span className="truncate" style={{ color: '#1A2520' }}>{project.title}</span>
        </nav>

        {/* HERO: gallery + buy panel ---------------------------------- */}
        <section className="lg:grid lg:grid-cols-[1.05fr_0.95fr] lg:gap-12 lg:px-6 lg:pt-6">
          {/* Gallery */}
          <div className="lg:sticky lg:top-24 self-start">
            <Gallery images={images} title={project.title} />
          </div>

          {/* Buy panel */}
          <div className="px-5 lg:px-0 pt-5 lg:pt-2 pb-8 space-y-5">
            {/* Urgency badge row */}
            <div className="flex flex-wrap items-center gap-2" data-testid="v2-urgency-row">
              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[12px] font-bold uppercase tracking-[0.08em]"
                style={{ background: 'linear-gradient(135deg, #0F5E4C 0%, #16876B 100%)', color: '#fff', boxShadow: '0 4px 12px rgba(15,94,76,0.25)' }}
                data-testid="v2-fast-badge">
                <Zap size={13} fill="#fff" /> Fast · Ships in {leadTime}
              </span>
              {sale && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[12px] font-semibold" style={{ background: '#E9F5EE', color: '#0F5E4C' }} data-testid="v2-sale-badge">
                  <Flame size={13} /> Sale ends in {left ? fmtCountdown(left) : '24 hours'}
                </span>
              )}
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[12px] font-medium" style={{ background: '#FFF3D9', color: '#7A5800' }} data-testid="v2-stock-badge">
                <Box size={13} /> Only 1 available
              </span>
              {(project.tags || []).includes('igi_certified') && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[12px] font-medium" style={{ background: '#F0EBE0', color: '#3F4A45' }}>
                  <BadgeCheck size={13} /> IGI Certified
                </span>
              )}
            </div>

            {/* Price */}
            <div className="flex items-end gap-3 flex-wrap" data-testid="v2-price-row">
              <span className="text-[36px] sm:text-[42px] font-semibold leading-none" style={{ color: '#0F5E4C' }} data-testid="v2-price">{money(price)}+</span>
              {sale && base > 0 && (
                <>
                  <span className="text-[18px] line-through mb-1.5" style={{ color: '#9AA39E' }}>{money(base)}+</span>
                  <span className="text-[14px] font-semibold mb-1.5" style={{ color: '#0F5E4C' }}>({Math.round(sale.percent)}% off)</span>
                </>
              )}
            </div>

            {/* Title */}
            <h1 className="text-[26px] sm:text-[32px] leading-[1.15]" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", color: '#1A2520' }} data-testid="v2-title">
              {project.title}
            </h1>

            {/* Made by + rating row */}
            <div className="flex items-center gap-3 text-[13.5px]" style={{ color: '#3F4A45' }}>
              <span>Made by <Link to="/" className="font-semibold underline decoration-dotted underline-offset-4">The Local Jewel</Link></span>
              <span style={{ color: '#D3CDC1' }}>·</span>
              <span className="inline-flex items-center gap-1"><Star size={14} fill="#1A2520" stroke="#1A2520" /> <span className="font-semibold">{avgRating}</span> <span style={{ color: '#6B746F' }}>({reviewCount})</span></span>
            </div>

            {/* Trust strip */}
            <div className="grid grid-cols-3 gap-2 py-4 px-1" style={{ borderTop: '1px solid #E5E0D7', borderBottom: '1px solid #E5E0D7' }} data-testid="v2-trust-strip">
              <div className="flex flex-col items-start gap-0.5">
                <span className="text-[11px] uppercase tracking-wider" style={{ color: '#6B746F' }}>Est. Delivery</span>
                <span className="text-[13px] font-semibold" style={{ color: '#1A2520' }}>{estDelivery}</span>
              </div>
              <div className="flex flex-col items-start gap-0.5">
                <span className="text-[11px] uppercase tracking-wider" style={{ color: '#6B746F' }}>Shipping</span>
                <span className="text-[13px] font-semibold" style={{ color: '#1A2520' }}>Free insured</span>
              </div>
              <div className="flex flex-col items-start gap-0.5">
                <span className="text-[11px] uppercase tracking-wider" style={{ color: '#6B746F' }}>Returns</span>
                <span className="text-[13px] font-semibold" style={{ color: '#1A2520' }}>30-day exchange</span>
              </div>
            </div>

            {/* Rare-find callout */}
            <div className="flex items-start gap-2.5 p-3.5 rounded-[12px]" style={{ background: '#FFF8EC', border: '1px solid #F4E5BD' }} data-testid="v2-rare-find">
              <Sparkles size={18} style={{ color: '#B58A1F', flexShrink: 0, marginTop: 2 }} />
              <p className="text-[13.5px] leading-snug" style={{ color: '#5C4A1A' }}>
                <span className="font-bold">Rare find!</span> One-of-a-kind hand-crafted piece — once it's sold, it's gone.
              </p>
            </div>

            {/* Metal selector */}
            <div data-testid="v2-metal-selector">
              <label className="text-[12px] uppercase tracking-[0.1em] font-semibold" style={{ color: '#1A2520' }}>
                Metal: <span className="font-normal" style={{ color: '#3F4A45' }}>{metalLabel(tier, color) || '—'}</span>
              </label>
              <div className="flex flex-wrap gap-2 mt-2">
                {tiers.map((m) => (
                  <button key={m.id} onClick={() => setTier(m.id)} data-testid={`v2-metal-${m.id}`}
                    className="px-3.5 py-2 text-[13px] rounded-full transition-all"
                    style={{
                      border: tier === m.id ? '1.5px solid #0F5E4C' : '1px solid #D3CDC1',
                      color: tier === m.id ? '#0F5E4C' : '#1A2520',
                      background: tier === m.id ? '#E9F5EE' : '#fff',
                      fontWeight: tier === m.id ? 600 : 500,
                    }}>
                    {m.short}
                  </button>
                ))}
              </div>
              {tierObj && tierObj.colors.length > 0 && (
                <div className="flex items-center gap-2.5 mt-3">
                  {tierObj.colors.map((c) => (
                    <button key={c} onClick={() => setColor(c)} aria-label={`${c} gold`} data-testid={`v2-color-${c.toLowerCase()}`}
                      className="w-8 h-8 rounded-full transition-transform hover:scale-105"
                      style={{ background: COLOR_SWATCH[c], border: color === c ? '2.5px solid #0F5E4C' : '1.5px solid #D3CDC1' }} />
                  ))}
                </div>
              )}
            </div>

            {/* Carat selector */}
            {hasCarat && (
            <div data-testid="v2-carat-selector">
              <label className="text-[12px] uppercase tracking-[0.1em] font-semibold" style={{ color: '#1A2520' }}>
                Center stone: <span className="font-normal" style={{ color: '#3F4A45' }}>{carat ? `${carat} ct` : '—'}</span>
              </label>
              <div className="flex flex-wrap gap-2 mt-2">
                {availableCaratsForTier(matrix, tier).map((c) => (
                  <button key={c} onClick={() => setCarat(c)} data-testid={`v2-carat-${c}`}
                    className="px-3.5 py-2 text-[13px] rounded-full transition-all"
                    style={{
                      border: carat === c ? '1.5px solid #0F5E4C' : '1px solid #D3CDC1',
                      color: carat === c ? '#0F5E4C' : '#1A2520',
                      background: carat === c ? '#E9F5EE' : '#fff',
                      fontWeight: carat === c ? 600 : 500,
                    }}>
                    {c} ct
                  </button>
                ))}
              </div>
            </div>
            )}

            {/* Personalization toggle */}
            <div>
              <button onClick={() => setPersoOpen(!persoOpen)} className="inline-flex items-center gap-1.5 text-[14px] font-semibold" style={{ color: '#0F5E4C' }} data-testid="v2-perso-toggle">
                <Plus size={16} className="transition-transform" style={{ transform: persoOpen ? 'rotate(45deg)' : 'rotate(0)' }} />
                Add personalization
              </button>
              {persoOpen && (
                <textarea
                  value={perso}
                  onChange={(e) => setPerso(e.target.value)}
                  placeholder="Engraving, ring size, special request — anything we should know."
                  className="mt-2 w-full p-3 rounded-[10px] text-[14px] outline-none resize-none"
                  rows={3}
                  style={{ border: '1.5px solid #D3CDC1', background: '#fff' }}
                  data-testid="v2-perso-input"
                />
              )}
            </div>

            {/* Klarna line */}
            <p className="text-[13px]" style={{ color: '#3F4A45' }}>
              Pay over time — interest-free options at checkout.
            </p>

            {/* CTAs */}
            <div className="space-y-2.5" data-testid="v2-cta-stack">
              <div className="flex items-center gap-2.5">
                <div className="flex items-center rounded-full" style={{ border: '1.5px solid #D3CDC1', background: '#fff' }}>
                  <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="px-3.5 py-3" aria-label="Decrease" data-testid="v2-qty-minus"><Minus size={14} /></button>
                  <span className="px-2 text-[14px] min-w-[24px] text-center" data-testid="v2-qty">{qty}</span>
                  <button onClick={() => setQty((q) => q + 1)} className="px-3.5 py-3" aria-label="Increase" data-testid="v2-qty-plus"><Plus size={14} /></button>
                </div>
                <button onClick={addToBag} disabled={!available} data-testid="v2-add-to-bag"
                  className="flex-1 py-3.5 rounded-full text-[14px] font-semibold transition-all disabled:opacity-50"
                  style={{ background: '#fff', color: '#1A2520', border: '1.5px solid #1A2520' }}>
                  {added ? 'Added ✓' : 'Add to cart'}
                </button>
              </div>
              <button onClick={buyNow} disabled={!available} data-testid="v2-buy-now"
                className="w-full py-3.5 rounded-full text-[14px] font-semibold flex items-center justify-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ background: '#000', color: '#fff' }}>
                Buy with <svg width="14" height="17" viewBox="0 0 384 512" fill="#fff"><path d="M318.7 268c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-92.6zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/></svg> Pay
              </button>
              {!available && (
                <p className="text-[12.5px]" style={{ color: '#B14B3B' }} data-testid="v2-unavailable">This combination isn't available — pick another metal or carat.</p>
              )}
            </div>

            {/* Tiny reassurance row */}
            <div className="grid grid-cols-2 gap-2 text-[12px]" style={{ color: '#3F4A45' }}>
              <div className="inline-flex items-center gap-1.5"><Truck size={14} style={{ color: '#0F5E4C' }} /> Ships from {shipsFrom}</div>
              <div className="inline-flex items-center gap-1.5"><RotateCcw size={14} style={{ color: '#0F5E4C' }} /> 30-day exchange</div>
              <div className="inline-flex items-center gap-1.5"><ShieldCheck size={14} style={{ color: '#0F5E4C' }} /> Lifetime warranty</div>
              <div className="inline-flex items-center gap-1.5"><Clock size={14} style={{ color: '#0F5E4C' }} /> Made-to-order · {leadTime}</div>
            </div>
          </div>
        </section>

        {/* REVIEWS --------------------------------------------------- */}
        <section className="px-5 lg:px-6 pt-12" data-testid="v2-reviews">
          <h2 className="text-[24px] font-semibold mb-1" style={{ color: '#1A2520' }}>Reviews for this piece</h2>
          <div className="flex items-center gap-2 mb-5 text-[14px]" style={{ color: '#3F4A45' }}>
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((s) => <Star key={s} size={16} fill="#1A2520" stroke="#1A2520" />)}
            </div>
            <span className="font-semibold">{avgRating}</span>
            <span style={{ color: '#6B746F' }}>· {reviewCount} reviews</span>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {reviews.map((r, i) => (
              <article key={i} className="p-5 rounded-[14px]" style={{ background: '#fff', border: '1px solid #E5E0D7' }} data-testid={`v2-review-${i}`}>
                <div className="flex items-center gap-0.5 mb-2">
                  {[...Array(r.rating)].map((_, k) => <Star key={k} size={14} fill="#1A2520" stroke="#1A2520" />)}
                </div>
                <p className="text-[14px] leading-[1.6] mb-3" style={{ color: '#1A2520' }}>"{r.text}"</p>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold" style={{ background: '#E9F5EE', color: '#0F5E4C' }}>{r.avatar}</div>
                  <div className="text-[12.5px]">
                    <div className="font-semibold" style={{ color: '#1A2520' }}>{r.name}</div>
                    <div style={{ color: '#6B746F' }}>{r.date}</div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* ABOUT THIS PIECE ------------------------------------------ */}
        <section className="px-5 lg:px-6 pt-12" data-testid="v2-about-piece">
          <h2 className="text-[24px] font-semibold mb-6" style={{ color: '#1A2520' }}>About this piece</h2>
          <div className="lg:grid lg:grid-cols-[0.95fr_1.05fr] lg:gap-12 lg:items-start">
            {/* Highlights card */}
            <div className="rounded-[18px] p-5 sm:p-6 mb-7 lg:mb-0" style={{ background: '#fff', border: '1px solid #E5E0D7' }} data-testid="v2-highlights">
              <div className="text-[11.5px] uppercase tracking-[0.14em] font-semibold mb-4" style={{ color: '#6B746F' }}>Highlights</div>
              <ul className="space-y-4">
                {aboutHighlights.map((h, i) => (
                  <li key={i} className="flex items-start gap-3.5" data-testid={`v2-highlight-${i}`}>
                    <span className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#E9F5EE' }}>
                      <h.icon size={16} style={{ color: '#0F5E4C' }} />
                    </span>
                    <span className="pt-0.5 min-w-0">
                      <span className="block text-[11px] uppercase tracking-wider" style={{ color: '#9AA39E' }}>{h.label}</span>
                      <span className="block text-[14px] font-medium leading-snug" style={{ color: '#1A2520' }}>{h.value}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Description with elegant read-more */}
            <div>
              {project.subtitle && (
                <p className="text-[19px] leading-[1.5] mb-4 italic" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", color: '#1A2520' }} data-testid="v2-subtitle">
                  {project.subtitle}
                </p>
              )}
              {project.description ? (
                <div className="relative">
                  <p className="text-[15px] leading-[1.85] whitespace-pre-line" data-testid="v2-about-description"
                    style={{
                      color: '#3F4A45',
                      ...(showFullDesc ? {} : { display: '-webkit-box', WebkitLineClamp: 7, WebkitBoxOrient: 'vertical', overflow: 'hidden' }),
                    }}>
                    {project.description}
                  </p>
                  {!showFullDesc && project.description.length > 320 && (
                    <div className="absolute bottom-0 inset-x-0 h-14 pointer-events-none" style={{ background: 'linear-gradient(to bottom, rgba(251,247,240,0), #FBF7F0)' }} />
                  )}
                  {project.description.length > 320 && (
                    <button onClick={() => setShowFullDesc(!showFullDesc)} data-testid="v2-about-readmore"
                      className="mt-3 inline-flex items-center gap-1.5 text-[13.5px] font-semibold transition-colors"
                      style={{ color: '#0F5E4C' }}>
                      {showFullDesc ? 'Show less' : 'Read the full story'}
                      <ChevronDown size={15} className="transition-transform" style={{ transform: showFullDesc ? 'rotate(180deg)' : 'none' }} />
                    </button>
                  )}
                </div>
              ) : (
                <p className="text-[15px] leading-[1.8]" style={{ color: '#3F4A45' }}>
                  A one-of-a-kind piece, hand-crafted to order by The Local Jewel. Have a question about it? Message us — we answer personally, usually within hours.
                </p>
              )}
            </div>
          </div>
        </section>

        {/* ACCORDIONS ----------------------------------------------- */}
        <section className="px-5 lg:px-6 pt-10" data-testid="v2-accordions">
          {/* Story behind */}
          {(journey.length > 0 || (story && story.quote)) && (
            <Accordion title="The story behind this piece" icon={<Sparkles size={17} />} defaultOpen={false} testid="v2-acc-story">
              {journey.length > 0 && (
                <ol className="space-y-5 mt-2">
                  {journey.map((step, i) => (
                    <li key={i} className="flex gap-4">
                      <div className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold" style={{ background: '#0F5E4C', color: '#fff' }}>{i + 1}</div>
                      <div>
                        <h4 className="text-[15px] font-semibold mb-1" style={{ color: '#1A2520' }}>{step.label}</h4>
                        <p style={{ color: '#3F4A45' }}>{step.description}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
              {story && story.quote && (
                <blockquote className="mt-7 p-4 rounded-[12px] italic" style={{ background: '#F3EEE7', borderLeft: '3px solid #0F5E4C' }}>
                  "{story.quote}"
                  <footer className="text-[12.5px] not-italic mt-2" style={{ color: '#6B746F' }}>— {story.name}{story.location ? `, ${story.location}` : ''}</footer>
                </blockquote>
              )}
            </Accordion>
          )}

          {/* Shipping & policies */}
          <Accordion title="Shipping & policies" icon={<Truck size={17} />} defaultOpen={false} testid="v2-acc-shipping">
            <ul className="space-y-2.5">
              <li className="flex items-center gap-2"><MapPin size={15} style={{ color: '#0F5E4C' }} /> Ships from <strong>{shipsFrom}</strong> — worldwide insured delivery</li>
              <li className="flex items-center gap-2"><Clock size={15} style={{ color: '#0F5E4C' }} /> Made-to-order, hand-crafted: <strong>{leadTime}</strong></li>
              <li className="flex items-center gap-2"><Truck size={15} style={{ color: '#0F5E4C' }} /> Estimated delivery: <strong>{estDelivery}</strong></li>
              <li className="flex items-center gap-2"><RotateCcw size={15} style={{ color: '#0F5E4C' }} /> {returnsPolicy}</li>
              <li className="flex items-center gap-2"><ShieldCheck size={15} style={{ color: '#0F5E4C' }} /> {warrantyText}</li>
            </ul>
          </Accordion>

          {/* Care */}
          <Accordion title="Care & cleaning" icon={<Sparkles size={17} />} defaultOpen={false} testid="v2-acc-care">
            <p>{careText}</p>
          </Accordion>

          {/* About the maker */}
          <Accordion title="About the maker" icon={<Gem size={17} />} defaultOpen={false} testid="v2-acc-maker">
            <p>{makerText}</p>
          </Accordion>
        </section>

        {/* RELATED — You may also love --------------------------------- */}
        {project.related && project.related.length > 0 && (
          <section className="px-5 lg:px-6 pt-16 pb-6" data-testid="v2-related">
            <div className="flex items-end justify-between mb-5 flex-wrap gap-3">
              <div>
                <h2 className="text-[28px] sm:text-[32px] leading-tight" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", color: '#1A2520' }}>You may also love</h2>
                <p className="text-[13.5px] mt-1" style={{ color: '#6B746F' }}>Hand-picked pieces in the same spirit.</p>
              </div>
              <Link to="/collections" className="hidden sm:inline-flex items-center gap-1 text-[13.5px] font-semibold" style={{ color: '#0F5E4C' }}>
                Browse collections <ChevronRight size={14} />
              </Link>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
              {project.related.slice(0, 4).map((p, i) => (
                <ProductCard key={p.slug} product={p} index={i} />
              ))}
            </div>
          </section>
        )}

        <div className="h-16" />
      </main>

      <StoreFooter />

      {/* Sticky mobile bottom CTA */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 p-3 flex items-center gap-2.5"
        style={{ background: 'rgba(251,247,240,0.96)', backdropFilter: 'blur(12px)', borderTop: '1px solid #E5E0D7' }}
        data-testid="v2-sticky-cta">
        <div className="flex-1 min-w-0">
          <div className="text-[11px] uppercase tracking-wider truncate" style={{ color: '#6B746F' }}>{metalLabel(tier, color)}{hasCarat ? ` · ${carat} ct` : ''}</div>
          <div className="text-[18px] font-semibold leading-tight" style={{ color: '#0F5E4C' }}>{money(price)}+</div>
        </div>
        <button onClick={buyNow} disabled={!available} data-testid="v2-sticky-buy"
          className="px-5 py-3 rounded-full text-[14px] font-semibold disabled:opacity-50"
          style={{ background: '#000', color: '#fff' }}>
          Buy now
        </button>
      </div>
    </div>
  );
}
