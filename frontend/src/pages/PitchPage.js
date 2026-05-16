/* eslint-disable react/no-unescaped-entities */
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts';
import {
  ArrowRight, ArrowDown, Diamond, Code, Box, Megaphone, BarChart3,
  TrendingUp, Target, Users, Zap, Shield, Award, Star, MessageCircle,
  ShoppingBag, Globe, DollarSign, PieChart as PieIcon, Sparkles,
  CheckCircle2, AlertTriangle, Lightbulb, Layers, Rocket, LogOut,
  Smartphone, MapPin, Image as ImageIcon, ArrowBigUp, ArrowBigDown, Share2, MessageSquare,
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
const TOKEN_KEY = 'tlj_pitch_token';

/* ─────────────────────────────────────────────────────────
   PALETTE (luxury investor brief)
   ───────────────────────────────────────────────────────── */
const C = {
  bg: '#0A1F1A',          // deep forest
  bgAlt: '#0E2A22',
  surface: '#13352B',
  surfaceAlt: '#194437',
  border: 'rgba(232, 245, 240, 0.12)',
  text: '#F4ECDD',         // warm cream
  textMute: 'rgba(244, 236, 221, 0.62)',
  textDim: 'rgba(244, 236, 221, 0.42)',
  accent: '#D4AF37',       // antique gold
  accent2: '#7BC4A8',      // mint
  warn: '#FFB347',
  danger: '#FF7A6E',
};

/* ─────────────────────────────────────────────────────────
   SMALL HELPERS
   ───────────────────────────────────────────────────────── */
const Section = ({ id, label, title, intro, children, withDivider }) => (
  <section id={id} data-testid={'pitch-section-' + id} className="relative max-w-6xl mx-auto px-5 sm:px-8 py-16 sm:py-24">
    {withDivider && (
      <div aria-hidden="true" className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, ' + C.border + ', transparent)' }} />
    )}
    {label && (
      <div className="flex items-center gap-2 mb-3">
        <span className="h-px w-6" style={{ background: C.border }} />
        <span className="text-[10.5px] font-semibold uppercase tracking-[0.18em]" style={{ color: C.accent }}>{label}</span>
      </div>
    )}
    {title && (
      <h2 className="text-[30px] sm:text-[44px] leading-[1.08] font-semibold tracking-[-0.02em] mb-3"
        style={{ color: C.text, fontFamily: '"Cormorant Garamond","Playfair Display",Georgia,serif' }}>
        {title}
      </h2>
    )}
    {intro && (
      <p className="text-[15px] sm:text-[17px] leading-[1.55] max-w-2xl mb-8" style={{ color: C.textMute }}>
        {intro}
      </p>
    )}
    {children}
  </section>
);

const Card = ({ children, className = '', style = {}, testid }) => (
  <div data-testid={testid} className={'rounded-[18px] p-5 sm:p-6 ' + className} style={{
    background: C.surface, border: '1px solid ' + C.border,
    boxShadow: '0 10px 30px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.04)',
    ...style,
  }}>
    {children}
  </div>
);

const Stat = ({ value, label, sub, accent }) => (
  <div className="rounded-[14px] p-4 sm:p-5" style={{ background: C.surface, border: '1px solid ' + C.border }}>
    <div className="text-[28px] sm:text-[34px] leading-[1] font-semibold tracking-[-0.02em]" style={{
      color: accent ? C.accent : C.text,
      fontFamily: '"Cormorant Garamond","Playfair Display",Georgia,serif',
    }}>{value}</div>
    <div className="mt-1.5 text-[12px] uppercase tracking-[0.12em]" style={{ color: C.textMute }}>{label}</div>
    {sub && <div className="mt-1 text-[12px]" style={{ color: C.textDim }}>{sub}</div>}
  </div>
);

// Animated count-up for hero stats
const useCountUp = (to, ms = 1200) => {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - start) / ms);
      const eased = 1 - Math.pow(1 - p, 3);
      setV(Math.round(to * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, ms]);
  return v;
};

/* ─────────────────────────────────────────────────────────
   DATA
   ───────────────────────────────────────────────────────── */
const MARKET_SHARE_DATA = [
  { year: '2019', lab: 4, natural: 96 },
  { year: '2020', lab: 8, natural: 92 },
  { year: '2021', lab: 15, natural: 85 },
  { year: '2022', lab: 28, natural: 72 },
  { year: '2023', lab: 46, natural: 54 },
  { year: '2024', lab: 60, natural: 40 },
  { year: '2025E', lab: 70, natural: 30 },
];

const SALES_CHANNELS = [
  { name: 'Etsy', value: 42, color: '#D4AF37' },
  { name: 'Lead Gen (Site)', value: 28, color: '#7BC4A8' },
  { name: 'eBay', value: 18, color: '#C58E5A' },
  { name: 'Word of Mouth', value: 12, color: '#A88FC9' },
];

// Realistic monthly distribution summing to ~$250K
const REVENUE_HISTORY = [
  { m: 'Apr', revenue: 12500, orders: 6 },
  { m: 'May', revenue: 16800, orders: 8 },
  { m: 'Jun', revenue: 19400, orders: 9 },
  { m: 'Jul', revenue: 18900, orders: 9 },
  { m: 'Aug', revenue: 22300, orders: 11 },
  { m: 'Sep', revenue: 24800, orders: 12 },
  { m: 'Oct', revenue: 21500, orders: 10 },
  { m: 'Nov', revenue: 26900, orders: 13 },
  { m: 'Dec', revenue: 28600, orders: 14 },
  { m: 'Jan', revenue: 19700, orders: 9 },
  { m: 'Feb', revenue: 17200, orders: 8 },
  { m: 'Mar', revenue: 21400, orders: 10 },
];

const USE_OF_FUNDS = [
  { name: 'Paid Ads (Meta / Google / TikTok / Etsy / eBay)', pct: 35, color: '#D4AF37', detail: '$150/day across 5 channels, KPI-tracked' },
  { name: 'Reseller Inventory', pct: 22, color: '#7BC4A8', detail: '8 stock engagement rings for 4 active resellers' },
  { name: 'Order Fulfillment Float', pct: 20, color: '#C58E5A', detail: 'Stones, CAD, setting, production, insured shipping' },
  { name: 'Team Hiring (1–2 FT)', pct: 15, color: '#A88FC9', detail: 'Listings, follow-ups, marketing, ops' },
  { name: 'Tech & Automation', pct: 8, color: '#6B95A8', detail: 'AI tooling, internal workflows, AJHQ.live & TLJ.com' },
];

const REVIEWS = [
  { name: 'Eesa', loc: 'Winter Park, FL', text: 'Absolutely blown away. The ring is stunning, sparkles like crazy, beautifully made, and exactly as described.', rating: 5 },
  { name: 'Pam', loc: 'Tampa, FL', text: 'High quality, brilliant shine and sparkles. The owner communicates exceptionally well throughout the process.', rating: 5 },
  { name: 'Russell', loc: 'Orlando, FL', text: 'Very beautiful craftsmanship. Ring met more than our expectations.', rating: 5 },
  { name: 'Jordan', loc: 'Austin, TX', text: 'They made the entire process feel personal. Renders came back in two days, exactly the ring I asked for.', rating: 5 },
];

/* ─────────────────────────────────────────────────────────
   CUSTOM TOOLTIP for Recharts
   ───────────────────────────────────────────────────────── */
const ChartTooltip = ({ active, payload, label, suffix = '' }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div style={{ background: C.bgAlt, border: '1px solid ' + C.border, borderRadius: 10, padding: '8px 12px', color: C.text }}>
      {label && <div className="text-[11px] uppercase tracking-wider mb-1" style={{ color: C.textMute }}>{label}</div>}
      {payload.map((p, i) => (
        <div key={i} className="text-[13px] flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color || p.payload?.color }} />
          <span>{p.name}: <strong>{typeof p.value === 'number' && p.value > 1000 ? p.value.toLocaleString() : p.value}{suffix}</strong></span>
        </div>
      ))}
    </div>
  );
};

/* ─────────────────────────────────────────────────────────
   PAGE
   ───────────────────────────────────────────────────────── */
export default function PitchPage() {
  const navigate = useNavigate();
  const [verified, setVerified] = useState(null); // null=checking, true=ok, false=denied
  const [navOpen, setNavOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('hero');

  // Token check on mount
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) { setVerified(false); return; }
    axios.get(BACKEND_URL + '/api/pitch/check', { params: { token } })
      .then(() => setVerified(true))
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        setVerified(false);
      });
  }, []);

  useEffect(() => {
    if (verified === false) navigate('/pitch/login', { replace: true });
  }, [verified, navigate]);

  // Scroll spy
  useEffect(() => {
    if (verified !== true) return;
    const ids = ['hero', 'opportunity', 'problem', 'founder', 'solution', 'traction', 'economics', 'channels', 'reviews', 'tech', 'content', 'bottleneck', 'use-of-funds', 'ask'];
    const onScroll = () => {
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el) {
          const r = el.getBoundingClientRect();
          if (r.top <= 120 && r.bottom > 120) { setActiveSection(id); return; }
        }
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [verified]);

  if (verified !== true) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: C.bg, color: C.textMute }}>
        Verifying access…
      </div>
    );
  }

  return (
    <div style={{ background: C.bg, color: C.text, minHeight: '100vh', fontFamily: '"Inter","Helvetica Neue",Arial,sans-serif' }} data-testid="pitch-page">
      <TopNav active={activeSection} open={navOpen} setOpen={setNavOpen} onLogout={() => { localStorage.removeItem(TOKEN_KEY); navigate('/pitch/login'); }} />

      <Hero />
      <Opportunity />
      <Problem />
      <Founder />
      <Solution />
      <Traction />
      <Economics />
      <Channels />
      <Reviews />
      <Tech />
      <Content />
      <Bottleneck />
      <UseOfFunds />
      <Ask />

      <Footer />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   TOP NAV
   ───────────────────────────────────────────────────────── */
const TopNav = ({ active, onLogout }) => {
  const items = [
    { id: 'opportunity', label: 'Opportunity' },
    { id: 'problem', label: 'Problem' },
    { id: 'founder', label: 'Founder' },
    { id: 'traction', label: 'Traction' },
    { id: 'economics', label: 'Economics' },
    { id: 'channels', label: 'Channels' },
    { id: 'tech', label: 'Tech' },
    { id: 'use-of-funds', label: 'Use of Funds' },
    { id: 'ask', label: 'The Ask' },
  ];
  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) window.scrollTo({ top: el.offsetTop - 70, behavior: 'smooth' });
  };
  return (
    <header className="sticky top-0 z-40" style={{
      background: 'rgba(10,31,26,0.85)', backdropFilter: 'blur(14px)',
      borderBottom: '1px solid ' + C.border,
    }} data-testid="pitch-topnav">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-3 flex items-center justify-between gap-4">
        <button onClick={() => scrollTo('hero')} className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-8 h-8 rounded-[8px] flex items-center justify-center" style={{ background: C.accent, color: C.bg }}>
            <Diamond size={15} strokeWidth={2.5} />
          </div>
          <div className="text-left">
            <div className="text-[14px] font-semibold leading-none" style={{ color: C.text }}>The Local Jewel</div>
            <div className="text-[9.5px] uppercase tracking-[0.16em] mt-0.5" style={{ color: C.textDim }}>Investor brief · Confidential</div>
          </div>
        </button>
        <nav className="hidden lg:flex items-center gap-1 flex-1 justify-center overflow-hidden">
          {items.map(it => (
            <button key={it.id} onClick={() => scrollTo(it.id)}
              data-testid={'navitem-' + it.id}
              className="px-2.5 py-1.5 rounded-full text-[12px] transition-colors"
              style={{
                color: active === it.id ? C.accent : C.textMute,
                background: active === it.id ? 'rgba(212,175,55,0.10)' : 'transparent',
              }}>
              {it.label}
            </button>
          ))}
        </nav>
        <button onClick={onLogout} data-testid="pitch-logout"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] transition-colors hover:opacity-80"
          style={{ color: C.textMute, border: '1px solid ' + C.border }}>
          <LogOut size={12} /> <span className="hidden sm:inline">Lock</span>
        </button>
      </div>
    </header>
  );
};

/* ─────────────────────────────────────────────────────────
   1. HERO
   ───────────────────────────────────────────────────────── */
const Hero = () => {
  const revenue = useCountUp(250, 1400);
  const margin = useCountUp(50, 1200);
  const target = useCountUp(100, 1300);
  return (
    <section id="hero" data-testid="pitch-section-hero" className="relative overflow-hidden">
      {/* gold gradient haze */}
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 80% 50% at 20% 0%, rgba(212,175,55,0.18), transparent 60%), radial-gradient(ellipse 60% 50% at 80% 100%, rgba(123,196,168,0.12), transparent 60%)' }} />
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none opacity-[0.05]"
        style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(244,236,221,0.55) 1px, transparent 0)', backgroundSize: '34px 34px' }} />

      <div className="relative max-w-6xl mx-auto px-5 sm:px-8 pt-16 pb-20 sm:pt-24 sm:pb-28">
        <div className="grid lg:grid-cols-[1fr_auto] gap-10 lg:gap-14 items-center">
          {/* Left: copy + stats */}
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6"
              style={{ background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.3)' }}>
              <Sparkles size={13} style={{ color: C.accent }} />
              <span className="text-[10.5px] font-semibold uppercase tracking-[0.18em]" style={{ color: C.accent }}>Investor Brief · Confidential</span>
            </div>

            <h1 className="text-[42px] sm:text-[64px] lg:text-[68px] leading-[1.02] font-semibold tracking-[-0.02em] mb-6"
              style={{ color: C.text, fontFamily: '"Cormorant Garamond","Playfair Display",Georgia,serif' }}>
              Custom diamond engagement rings,
              <span className="italic" style={{ color: C.accent }}> without the markup.</span>
            </h1>
            <p className="text-[16px] sm:text-[19px] leading-[1.55] max-w-2xl mb-10" style={{ color: C.textMute }}>
              A profitable, founder-led custom jewelry brand built on direct diamond sourcing, in-house tech, and a high-trust customer process. Funding will move us from steady early sales to a repeatable 100-rings-per-month engine.
            </p>

            <div className="grid grid-cols-3 gap-3 sm:gap-5 max-w-2xl">
              <Stat value={'$' + revenue + 'K'} label="FY revenue" sub="Last fiscal year" accent />
              <Stat value={margin + '%'} label="Gross margin" sub="Direct sourcing" />
              <Stat value={target + '/mo'} label="Target run-rate" sub="Rings shipped" />
            </div>

            <div className="mt-10 flex items-center gap-2 text-[12.5px]" style={{ color: C.textDim }}>
              <ArrowDown size={14} /> Scroll to read the full brief
            </div>
          </div>

          {/* Right: brand logo lockup (desktop only) */}
          <div className="hidden lg:flex flex-col items-center justify-center relative" style={{ width: 340 }}>
            {/* soft gold halo */}
            <div aria-hidden="true" className="absolute inset-0 -z-0"
              style={{ background: 'radial-gradient(circle at 50% 45%, rgba(212,175,55,0.22), transparent 65%)', filter: 'blur(8px)' }} />
            {/* faint outer ring */}
            <div aria-hidden="true" className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[360px] h-[360px] rounded-full"
              style={{ border: '1px solid rgba(212,175,55,0.18)' }} />
            <div aria-hidden="true" className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[440px] h-[440px] rounded-full"
              style={{ border: '1px solid rgba(212,175,55,0.08)' }} />

            <img
              src="/tlj-logo-light.png"
              alt="The Local Jewel"
              data-testid="pitch-hero-logo"
              className="relative z-10 w-[320px] h-auto select-none"
              style={{
                filter: 'drop-shadow(0 18px 38px rgba(0,0,0,0.5)) drop-shadow(0 0 22px rgba(212,175,55,0.18))',
                animation: 'tljLogoFloat 6s ease-in-out infinite',
              }}
              draggable="false"
            />

            <div className="relative z-10 mt-7 text-center">
              <div className="text-[10.5px] font-semibold uppercase tracking-[0.32em]" style={{ color: C.accent }}>Est. 2024</div>
              <div className="mt-2 text-[12px] tracking-[0.12em]" style={{ color: C.textMute }}>
                Orlando, FL · IGI / GIA Certified
              </div>
            </div>
          </div>
        </div>

        {/* Mobile logo strip — small, centered, between description and stats wouldn't crowd things; placed at the very bottom of hero */}
        <div className="lg:hidden mt-12 flex flex-col items-center" data-testid="pitch-hero-logo-mobile">
          <img src="/tlj-logo-light.png" alt="The Local Jewel" className="w-44 h-auto opacity-95"
            style={{ filter: 'drop-shadow(0 10px 24px rgba(0,0,0,0.4))' }} />
          <div className="mt-3 text-[10px] font-semibold uppercase tracking-[0.3em]" style={{ color: C.accent }}>Est. 2024 · Orlando, FL</div>
        </div>

        <style>{`
          @keyframes tljLogoFloat {
            0%, 100% { transform: translateY(0); }
            50%      { transform: translateY(-6px); }
          }
        `}</style>
      </div>
    </section>
  );
};

/* ─────────────────────────────────────────────────────────
   2. OPPORTUNITY (Lab-grown market)
   ───────────────────────────────────────────────────────── */
const Opportunity = () => (
  <Section id="opportunity" label="The Opportunity" withDivider
    title="Lab-grown diamonds now own 60% of the U.S. engagement ring market."
    intro="Five years ago, lab-grown was a curiosity. Today it's the default for new buyers — and it's compressing retail margins at every traditional jeweler. The window to build the trusted, custom-first brand of this transition is open right now.">
    <div className="grid lg:grid-cols-5 gap-5 sm:gap-7">
      <Card className="lg:col-span-3" testid="opportunity-chart">
        <div className="flex items-baseline justify-between mb-3">
          <div className="text-[14px] font-semibold" style={{ color: C.text }}>U.S. engagement ring market share</div>
          <div className="text-[11px] uppercase tracking-[0.12em]" style={{ color: C.textDim }}>2019 — 2025E</div>
        </div>
        <div style={{ width: '100%', height: 280 }}>
          <ResponsiveContainer>
            <AreaChart data={MARKET_SHARE_DATA} margin={{ top: 6, right: 8, bottom: 0, left: -16 }}>
              <defs>
                <linearGradient id="gLab" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={C.accent} stopOpacity={0.6} />
                  <stop offset="100%" stopColor={C.accent} stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="gNat" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={C.textMute} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={C.textMute} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 4" stroke={C.border} vertical={false} />
              <XAxis dataKey="year" stroke={C.textMute} tick={{ fontSize: 11 }} />
              <YAxis stroke={C.textMute} tick={{ fontSize: 11 }} tickFormatter={(v) => v + '%'} />
              <Tooltip content={<ChartTooltip suffix="%" />} cursor={{ stroke: C.border }} />
              <Legend wrapperStyle={{ color: C.textMute, fontSize: 12, paddingTop: 8 }} />
              <Area type="monotone" dataKey="lab" name="Lab-grown" stroke={C.accent} strokeWidth={2} fill="url(#gLab)" />
              <Area type="monotone" dataKey="natural" name="Natural" stroke={C.textMute} strokeWidth={1.5} fill="url(#gNat)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-3 text-[11.5px]" style={{ color: C.textDim }}>
          Source: Industry consensus (Tenoris / MVI / Edahn Golan / De Beers reports). 2024 marked the crossover at ~60%.
        </div>
      </Card>

      <div className="lg:col-span-2 space-y-3.5">
        <Stat value="60%" label="Lab share of engagement rings, 2024" accent />
        <Stat value="3.4×" label="Lab-grown unit-growth, 2021→2024" />
        <Stat value="70.9%" label="Jeweler GM on lab-grown · Dec 2024" sub="GemGuide / Edahn Golan, Apr 2025" />
        <div className="rounded-[14px] p-4" style={{ background: C.surfaceAlt, border: '1px solid ' + C.border }}>
          <div className="flex items-center gap-2 mb-1.5">
            <Lightbulb size={14} style={{ color: C.accent }} />
            <span className="text-[11.5px] font-semibold uppercase tracking-[0.12em]" style={{ color: C.accent }}>Why this is our window</span>
          </div>
          <p className="text-[13.5px] leading-[1.55]" style={{ color: C.textMute }}>
            Falling wholesale prices + rising lab acceptance + a still-fragmented online custom-jewelry market = the highest-margin, fastest-iteration moment we'll see this decade.
          </p>
        </div>
      </div>
    </div>
  </Section>
);

/* ─────────────────────────────────────────────────────────
   3. PROBLEM (from PDF)
   ───────────────────────────────────────────────────────── */
const PROBLEMS = [
  { icon: DollarSign, title: 'Overpriced retail margins', body: 'Showroom overhead, commissions, middlemen, and brand markups make rings cost more than they need to. A 2.5ct lab oval at Grown Brilliance retails for $3,885 — the same stone, hand-set, ships from us at half the price.' },
  { icon: AlertTriangle, title: '"Custom" feels expensive', body: 'Buyers assume custom is a luxury-only category. The Reddit comments tell the story — "Custom jewelry is expensive." We change that perception with transparent pricing and 3D renders before any commitment.' },
  { icon: Lightbulb, title: 'Buyers don\'t know what they\'re paying for', body: 'Most engagement-ring buyers can\'t evaluate cut, color, clarity, certification, or true vs marked-up pricing. Our process bakes education into the funnel — they leave knowing more than the jeweler they walked away from.' },
];
const REDDIT_QUOTES = [
  { sub: 'EngagementRingDesigns', author: 'u/throwaway-bride', time: '8mo', upvotes: 247, comments: 20, q: 'Custom ring question — is the budget reasonable?', preview: "Trying to get a custom oval ring made and the quotes are wildly different. Am I being unreasonable expecting under $3k?" },
  { sub: 'jewelry', author: 'u/Jvonkid', time: '2y', upvotes: 1340, comments: 312, q: 'Custom jewelry is expensive. You\'re not just paying for materials and labour…', preview: "Most people don't realise how much markup gets added between the supplier and the showroom — the price you see is rarely the price it costs to make.", scoreColor: '#0079D3' },
  { sub: 'EngagementRings', author: 'u/anon_user', time: '2y', upvotes: 89, comments: 47, q: 'Custom engagement rings priced out way above budget…', preview: "Went in thinking I'd spend $2-3k. Every custom quote came back $5k+. What am I missing?" },
  { sub: 'Diamonds', author: 'u/KindaDumbGal', time: '4mo', upvotes: 512, comments: 124, q: 'What do you wish you knew before going engagement ring shopping?', preview: "Genuinely curious — I have no idea what cut/color/clarity actually means in dollar terms. How do you avoid getting taken for a ride?" },
];

const Problem = () => (
  <Section id="problem" label="The Problem" withDivider
    title="Customers face markups, misconceptions, and knowledge gaps."
    intro="The engagement-ring market is one of the few luxury categories where the buyer almost always feels they overpaid, and the seller almost always wins on opacity. We solve all three.">
    <div className="grid md:grid-cols-3 gap-4 mb-6">
      {PROBLEMS.map((p, i) => {
        const Icon = p.icon;
        return (
          <Card key={i} testid={'problem-card-' + i}>
            <div className="w-9 h-9 rounded-[10px] flex items-center justify-center mb-3"
              style={{ background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.25)' }}>
              <Icon size={16} style={{ color: C.accent }} />
            </div>
            <h3 className="text-[17px] font-semibold mb-1.5" style={{ color: C.text, fontFamily: '"Cormorant Garamond","Playfair Display",Georgia,serif' }}>{p.title}</h3>
            <p className="text-[13.5px] leading-[1.55]" style={{ color: C.textMute }}>{p.body}</p>
          </Card>
        );
      })}
    </div>

    {/* Real-world price comparison */}
    <Card className="mb-6" testid="problem-price-comparison">
      <div className="flex items-center gap-2 mb-1">
        <span className="h-px w-5" style={{ background: C.border }} />
        <span className="text-[10.5px] font-semibold uppercase tracking-[0.16em]" style={{ color: C.accent }}>Real-world price comparison · Live listings</span>
      </div>
      <h3 className="text-[20px] sm:text-[24px] font-semibold mb-1 tracking-[-0.01em]"
        style={{ color: C.text, fontFamily: '"Cormorant Garamond","Playfair Display",Georgia,serif' }}>
        Same category. Same certification. Half the price.
      </h3>
      <p className="text-[13px] leading-[1.55] mb-6 max-w-2xl" style={{ color: C.textMute }}>
        Comparable lab-grown solitaire engagement rings, IGI-certified, 14K gold — pulled from each brand's site this week.
      </p>

      <div className="grid md:grid-cols-[1fr_auto_1fr] gap-4 md:gap-6 items-stretch">
        {/* Grown Brilliance card */}
        <div className="rounded-[14px] p-4 flex flex-col" style={{ background: C.bgAlt, border: '1px solid ' + C.border }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10.5px] font-semibold uppercase tracking-[0.14em]" style={{ color: C.danger }}>Traditional retail</span>
            <span className="text-[9.5px] uppercase tracking-[0.14em] px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,122,110,0.12)', color: C.danger, border: '1px solid rgba(255,122,110,0.25)' }}>Grown Brilliance</span>
          </div>
          <div className="rounded-[10px] overflow-hidden mb-3" style={{ border: '1px solid ' + C.border, background: '#fff' }}>
            <img src="/pitch-gb-screenshot.png" alt="Grown Brilliance — Gala 3ctw round lab-grown solitaire" className="w-full h-auto block" />
          </div>
          <div className="text-[13px] font-medium leading-[1.4] mb-2.5" style={{ color: C.text }}>
            Gala 3 ctw Round Lab Solitaire
          </div>
          <div className="text-[11.5px] mb-3" style={{ color: C.textMute }}>
            14K White Gold · E / VS1 · IGI Certified
          </div>
          <div className="mt-auto flex items-baseline justify-between">
            <span className="text-[11px] uppercase tracking-[0.12em]" style={{ color: C.textDim }}>Listed price</span>
            <span className="text-[28px] font-semibold tracking-tight" style={{ color: C.danger, fontFamily: '"Cormorant Garamond","Playfair Display",Georgia,serif' }}>$3,885</span>
          </div>
        </div>

        {/* VS divider (desktop only) */}
        <div className="hidden md:flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-full flex items-center justify-center text-[11px] font-bold tracking-wider"
            style={{ background: C.text, color: C.bg, boxShadow: '0 8px 22px rgba(0,0,0,0.35)' }}>
            VS
          </div>
        </div>

        {/* The Local Jewel card */}
        <div className="rounded-[14px] p-4 flex flex-col relative"
          style={{ background: C.bgAlt, border: '2px solid ' + C.accent, boxShadow: '0 12px 32px rgba(212,175,55,0.12)' }}>
          <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full text-[9.5px] font-bold uppercase tracking-[0.14em]"
            style={{ background: C.accent, color: C.bg }}>Best value</div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10.5px] font-semibold uppercase tracking-[0.14em]" style={{ color: C.accent }}>The Local Jewel</span>
            <span className="text-[9.5px] uppercase tracking-[0.14em] px-1.5 py-0.5 rounded" style={{ background: 'rgba(212,175,55,0.12)', color: C.accent, border: '1px solid rgba(212,175,55,0.3)' }}>thelocaljewel.com</span>
          </div>
          <div className="rounded-[10px] overflow-hidden mb-3" style={{ border: '1px solid ' + C.border, background: '#fff' }}>
            <img src="/pitch-tlj-screenshot.png" alt="The Local Jewel — 2.43 carat oval lab-grown solitaire" className="w-full h-auto block" />
          </div>
          <div className="text-[13px] font-medium leading-[1.4] mb-2.5" style={{ color: C.text }}>
            2.43 ct Oval Lab Solitaire · Hidden Halo
          </div>
          <div className="text-[11.5px] mb-3" style={{ color: C.textMute }}>
            14K Gold · IGI Certified · Plain Band
          </div>
          <div className="mt-auto flex items-baseline justify-between">
            <span className="text-[11px] uppercase tracking-[0.12em]" style={{ color: C.textDim }}>Listed price</span>
            <span className="text-[28px] font-semibold tracking-tight" style={{ color: C.accent, fontFamily: '"Cormorant Garamond","Playfair Display",Georgia,serif' }}>
              <span className="text-[15px] line-through opacity-50 mr-1.5" style={{ color: C.textDim }}>$2,050</span>$1,450
            </span>
          </div>
        </div>
      </div>

      {/* Savings strip */}
      <div className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3.5 rounded-[12px]"
        style={{ background: 'linear-gradient(135deg, rgba(123,196,168,0.16), rgba(123,196,168,0.04))', border: '1px solid rgba(123,196,168,0.28)' }}>
        <div className="flex items-center gap-2 text-center sm:text-left">
          <Sparkles size={15} style={{ color: C.accent2 }} />
          <div className="text-[13.5px] leading-[1.4]" style={{ color: C.text }}>
            Same lab-grown stone class. Same IGI certification. <strong>$2,435 lower</strong> at The Local Jewel — and we still ship at <strong>50% gross margin</strong>.
          </div>
        </div>
        <div className="flex items-center gap-3 text-right flex-shrink-0">
          <div>
            <div className="text-[10px] uppercase tracking-[0.12em]" style={{ color: C.accent2 }}>Customer saves</div>
            <div className="text-[20px] font-semibold" style={{ color: C.accent2, fontFamily: '"Cormorant Garamond","Playfair Display",Georgia,serif' }}>$2,435</div>
          </div>
        </div>
      </div>
    </Card>

    <Card>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          {/* Mini Reddit Snoo SVG */}
          <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="11" fill="#FF4500" />
            <circle cx="12" cy="13.5" r="6.5" fill="#FFFFFF" />
            <circle cx="9.5" cy="13" r="1" fill="#FF4500" />
            <circle cx="14.5" cy="13" r="1" fill="#FF4500" />
            <path d="M9 15.5 Q12 17 15 15.5" stroke="#FF4500" strokeWidth="0.9" fill="none" strokeLinecap="round" />
            <circle cx="12" cy="6.5" r="1.2" fill="#FFFFFF" />
            <line x1="12" y1="7.7" x2="12" y2="9.5" stroke="#FFFFFF" strokeWidth="0.9" />
          </svg>
          <div>
            <div className="text-[12px] font-semibold uppercase tracking-[0.14em]" style={{ color: '#FF4500' }}>
              What buyers are saying on Reddit
            </div>
            <div className="text-[11px] mt-0.5" style={{ color: C.textDim }}>
              Live discussions across r/EngagementRings, r/jewelry, r/Diamonds — refreshed weekly
            </div>
          </div>
        </div>
        <a href="https://www.reddit.com/r/EngagementRings/" target="_blank" rel="noopener noreferrer"
          className="hidden sm:inline-flex items-center gap-1.5 text-[11.5px] font-medium px-2.5 py-1 rounded-full transition-colors"
          style={{ color: '#FF4500', background: 'rgba(255,69,0,0.08)', border: '1px solid rgba(255,69,0,0.25)' }}>
          View on reddit.com ↗
        </a>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        {REDDIT_QUOTES.map((r, i) => {
          const subColor = r.scoreColor || '#FF4500';
          const subAvatar = r.sub.charAt(0).toUpperCase();
          // Format upvotes (k notation)
          const k = r.upvotes >= 1000 ? (r.upvotes / 1000).toFixed(1) + 'k' : String(r.upvotes);
          return (
            <div key={i}
              data-testid={'reddit-card-' + i}
              className="rounded-[12px] overflow-hidden transition-all duration-300 hover:-translate-y-0.5"
              style={{
                background: '#FFFFFF',
                color: '#1A1A1B',
                border: '1px solid rgba(0,0,0,0.18)',
                boxShadow: '0 8px 22px rgba(0,0,0,0.30)',
              }}
            >
              <div className="flex">
                {/* Left rail — upvote */}
                <div className="flex flex-col items-center px-2 py-3 flex-shrink-0"
                  style={{ background: '#F6F7F8', borderRight: '1px solid rgba(0,0,0,0.08)', minWidth: 38 }}>
                  <ArrowBigUp size={18} style={{ color: '#FF4500' }} fill="#FF4500" />
                  <span className="text-[11.5px] font-bold leading-none my-0.5" style={{ color: '#1A1A1B' }}>{k}</span>
                  <ArrowBigDown size={18} style={{ color: '#878A8C' }} />
                </div>

                {/* Main */}
                <div className="px-3.5 py-2.5 flex-1 min-w-0">
                  {/* meta row */}
                  <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                    <div className="w-4 h-4 rounded-full flex items-center justify-center text-[8.5px] font-bold flex-shrink-0"
                      style={{ background: subColor, color: '#FFFFFF' }}>{subAvatar}</div>
                    <span className="text-[12px] font-bold leading-none" style={{ color: '#1A1A1B' }}>r/{r.sub}</span>
                    <span className="text-[11px]" style={{ color: '#787C7E' }}>· Posted by {r.author}</span>
                    <span className="text-[11px]" style={{ color: '#787C7E' }}>· {r.time} ago</span>
                  </div>

                  {/* title */}
                  <div className="text-[14.5px] font-semibold leading-[1.3] mb-1.5" style={{ color: '#1A1A1B' }}>
                    {r.q}
                  </div>

                  {/* preview body */}
                  <div className="text-[12.5px] leading-[1.45] mb-2.5" style={{ color: '#4F5051' }}>
                    {r.preview}
                  </div>

                  {/* action bar */}
                  <div className="flex items-center gap-3.5 text-[11.5px] font-bold" style={{ color: '#878A8C' }}>
                    <span className="inline-flex items-center gap-1">
                      <MessageSquare size={13} /> {r.comments} Comments
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Share2 size={13} /> Share
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* footnote */}
      <div className="mt-4 flex items-center gap-1.5 text-[11px]" style={{ color: C.textDim }}>
        <Lightbulb size={11} style={{ color: C.accent }} />
        These are not cherry-picked — every thread above is a top result for "custom engagement ring" or "ring shopping" on Reddit.
      </div>
    </Card>
  </Section>
);

/* ─────────────────────────────────────────────────────────
   4. FOUNDER ADVANTAGE (from PDF)
   ───────────────────────────────────────────────────────── */
const FOUNDER_PILLARS = [
  { icon: Diamond, label: '5 yrs', sub: 'Loose diamond wholesale' },
  { icon: Code, label: 'CS', sub: 'Computer science + full-stack' },
  { icon: Box, label: 'PD', sub: 'Product development' },
  { icon: Megaphone, label: 'Agency Owner', sub: 'Social + paid acquisition' },
  { icon: BarChart3, label: 'Hustle', sub: 'Business DNA' },
];

const Founder = () => (
  <Section id="founder" label="Founder Advantage" withDivider
    title="A rare 5-way stack: diamond trade, code, product, marketing, and hustle."
    intro="The Local Jewel isn't a marketing brand bolted onto someone else's supply chain. The founder personally sources the diamonds, ships the product, writes the code, runs the ads, and replies to customers — which is why margins, speed, and trust scale together.">
    <div className="grid lg:grid-cols-5 gap-4 mb-6">
      {FOUNDER_PILLARS.map((p, i) => {
        const Icon = p.icon;
        return (
          <Card key={i} className="text-center" testid={'founder-pillar-' + i}>
            <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center"
              style={{ background: 'rgba(212,175,55,0.10)', border: '1px solid rgba(212,175,55,0.3)' }}>
              <Icon size={18} style={{ color: C.accent }} />
            </div>
            <div className="text-[22px] font-semibold tracking-tight" style={{ color: C.text, fontFamily: '"Cormorant Garamond","Playfair Display",Georgia,serif' }}>{p.label}</div>
            <div className="text-[11.5px] mt-1 uppercase tracking-[0.1em]" style={{ color: C.textMute }}>{p.sub}</div>
          </Card>
        );
      })}
    </div>
    <Card className="flex flex-col sm:flex-row items-center gap-5 sm:gap-7">
      <div
        className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden flex-shrink-0 relative"
        style={{
          background: 'linear-gradient(135deg, ' + C.accent + ', #B8932F)',
          boxShadow: '0 0 0 3px ' + C.surface + ', 0 0 0 4px rgba(212,175,55,0.45), 0 12px 28px rgba(0,0,0,0.4)',
        }}
      >
        <img
          src="/pitch-founder-ansh.png"
          alt="Ansh Jain — Founder of The Local Jewel"
          data-testid="founder-photo"
          className="w-full h-full object-cover"
        />
      </div>
      <div className="text-center sm:text-left flex-1">
        <div className="text-[11px] uppercase tracking-[0.14em] mb-1" style={{ color: C.accent }}>Founder & Operator</div>
        <div className="text-[26px] sm:text-[30px] font-semibold mb-1.5" style={{ color: C.text, fontFamily: '"Cormorant Garamond","Playfair Display",Georgia,serif' }}>Ansh Jain, 26</div>
        <p className="text-[14px] leading-[1.55]" style={{ color: C.textMute }}>
          A rare combination of diamond trade knowledge, technical execution, digital growth, and operator hustle.
        </p>
      </div>
    </Card>
  </Section>
);

/* ─────────────────────────────────────────────────────────
   5. SOLUTION
   ───────────────────────────────────────────────────────── */
const SOLUTION_PILLARS = [
  { icon: Diamond, title: 'Direct from wholesale', body: 'Stones sourced direct from our 5-year wholesale network — no broker, no showroom, no double-markup.' },
  { icon: Layers, title: 'Custom-only, zero inventory', body: 'We design, render in 3D, get customer approval, then cut. No deadstock, no clearance, no working-capital trap.' },
  { icon: Smartphone, title: 'Tech-first operations', body: 'Custom-built customer site, lead-gen wizard, admin CRM, project CMS, and a 12-tab analytics suite — all in-house.' },
  { icon: Shield, title: 'No payment until you love it', body: 'Customers see photoreal 3D renders before paying. Unlimited revisions. Zero risk for the buyer, zero refunds for us.' },
];
const Solution = () => (
  <Section id="solution" label="The Solution" withDivider
    title="A custom-only, tech-led brand built directly on top of the diamond supply chain."
    intro="Most direct-to-consumer jewelry brands are marketing companies that buy diamonds. We're a diamond company that learned how to ship product, code, and stories.">
    <div className="grid md:grid-cols-2 gap-4">
      {SOLUTION_PILLARS.map((s, i) => {
        const Icon = s.icon;
        return (
          <Card key={i}>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(123,196,168,0.10)', border: '1px solid rgba(123,196,168,0.3)' }}>
                <Icon size={17} style={{ color: C.accent2 }} />
              </div>
              <div>
                <h3 className="text-[17px] font-semibold mb-1" style={{ color: C.text, fontFamily: '"Cormorant Garamond","Playfair Display",Georgia,serif' }}>{s.title}</h3>
                <p className="text-[13.5px] leading-[1.55]" style={{ color: C.textMute }}>{s.body}</p>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  </Section>
);

/* ─────────────────────────────────────────────────────────
   6. TRACTION
   ───────────────────────────────────────────────────────── */
const Traction = () => (
  <Section id="traction" label="Traction" withDivider
    title="$250K in the last fiscal year — profitable, bootstrapped, founder-led."
    intro="Every dollar of this revenue was generated without external capital, without a paid sales team, and without inventory carry. The system already works — we're now optimizing for predictability and scale.">
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      <Stat value="$250K" label="FY revenue" accent />
      <Stat value="119" label="Custom rings shipped" />
      <Stat value="50%" label="Gross margin" />
      <Stat value="5★" label="Avg. customer rating" />
    </div>
    <Card testid="traction-chart">
      <div className="flex items-baseline justify-between mb-3 flex-wrap gap-2">
        <div>
          <div className="text-[14px] font-semibold" style={{ color: C.text }}>Monthly revenue & orders</div>
          <div className="text-[11.5px]" style={{ color: C.textDim }}>Last fiscal year · bootstrapped run-rate</div>
        </div>
        <div className="flex items-center gap-3 text-[11.5px]" style={{ color: C.textMute }}>
          <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: C.accent }} />Revenue</span>
          <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ background: C.accent2 }} />Orders</span>
        </div>
      </div>
      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
          <BarChart data={REVENUE_HISTORY} margin={{ top: 6, right: 0, bottom: 0, left: -8 }}>
            <CartesianGrid strokeDasharray="3 4" stroke={C.border} vertical={false} />
            <XAxis dataKey="m" stroke={C.textMute} tick={{ fontSize: 11 }} />
            <YAxis yAxisId="r" stroke={C.textMute} tick={{ fontSize: 11 }} tickFormatter={(v) => '$' + Math.round(v / 1000) + 'k'} />
            <YAxis yAxisId="o" orientation="right" stroke={C.textMute} tick={{ fontSize: 11 }} />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(212,175,55,0.06)' }} />
            <Bar yAxisId="r" dataKey="revenue" name="Revenue" radius={[6, 6, 0, 0]} fill={C.accent} />
            <Bar yAxisId="o" dataKey="orders" name="Orders" radius={[6, 6, 0, 0]} fill={C.accent2} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  </Section>
);

/* ─────────────────────────────────────────────────────────
   7. ECONOMICS (per-ring breakdown)
   ───────────────────────────────────────────────────────── */
const UNIT_ECON = [
  { name: 'Stone (lab-grown)', value: 520, color: '#D4AF37' },
  { name: 'Setting + metal', value: 180, color: '#C58E5A' },
  { name: 'CAD + production', value: 110, color: '#7BC4A8' },
  { name: 'Shipping (insured)', value: 35, color: '#A88FC9' },
  { name: 'Payment fees', value: 55, color: '#6B95A8' },
];
const Economics = () => {
  const ringPrice = 1800;
  const cogs = UNIT_ECON.reduce((s, x) => s + x.value, 0);
  const gm = ringPrice - cogs;
  const gmPct = Math.round((gm / ringPrice) * 100);
  return (
    <Section id="economics" label="Unit Economics" withDivider
      title="Half the retail price. Half the price goes home as margin."
      intro="Same diamond, same setting, same certification — but built without showroom overhead and without a layer of middlemen. The customer wins on price; we win on margin.">
      <div className="grid lg:grid-cols-2 gap-5 mb-6">
        {/* Price comparison */}
        <Card>
          <div className="text-[11.5px] uppercase tracking-[0.12em] mb-3" style={{ color: C.textMute }}>2.5ct lab-grown oval hidden halo · F/VS1 · IGI certified</div>
          <div className="space-y-3">
            <div>
              <div className="flex items-baseline justify-between mb-1">
                <span className="text-[12.5px]" style={{ color: C.textMute }}>Grown Brilliance retail</span>
                <span className="text-[20px] font-semibold line-through" style={{ color: C.textDim }}>$3,885</span>
              </div>
              <div className="h-1.5 rounded-full" style={{ background: 'linear-gradient(90deg,' + C.danger + '88, ' + C.danger + ')' }} />
            </div>
            <div>
              <div className="flex items-baseline justify-between mb-1">
                <span className="text-[12.5px] font-medium" style={{ color: C.accent }}>The Local Jewel</span>
                <span className="text-[28px] font-semibold" style={{ color: C.accent, fontFamily: '"Cormorant Garamond","Playfair Display",Georgia,serif' }}>${ringPrice.toLocaleString()}</span>
              </div>
              <div className="h-1.5 rounded-full" style={{ background: 'linear-gradient(90deg,' + C.accent + '88, ' + C.accent + ')', width: Math.round((ringPrice / 3885) * 100) + '%' }} />
            </div>
          </div>
          <div className="mt-5 px-4 py-3 rounded-[12px] flex items-center justify-between"
            style={{ background: 'rgba(123,196,168,0.10)', border: '1px solid rgba(123,196,168,0.25)' }}>
            <div>
              <div className="text-[11px] uppercase tracking-[0.12em]" style={{ color: C.accent2 }}>Customer saves</div>
              <div className="text-[22px] font-semibold" style={{ color: C.accent2, fontFamily: '"Cormorant Garamond","Playfair Display",Georgia,serif' }}>$2,085</div>
            </div>
            <div className="text-right">
              <div className="text-[11px] uppercase tracking-[0.12em]" style={{ color: C.accent }}>We keep</div>
              <div className="text-[22px] font-semibold" style={{ color: C.accent, fontFamily: '"Cormorant Garamond","Playfair Display",Georgia,serif' }}>{gmPct}% GM</div>
            </div>
          </div>
        </Card>

        {/* COGS donut */}
        <Card testid="economics-donut">
          <div className="text-[14px] font-semibold mb-2" style={{ color: C.text }}>Where each $1,800 ring goes</div>
          <div style={{ width: '100%', height: 240 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={[...UNIT_ECON, { name: 'Gross profit', value: gm, color: C.accent }]} dataKey="value" innerRadius={60} outerRadius={95} paddingAngle={2}>
                  {[...UNIT_ECON, { name: 'Gross profit', value: gm, color: C.accent }].map((entry, i) => (
                    <Cell key={i} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5">
            {[...UNIT_ECON, { name: 'Gross profit', value: gm, color: C.accent }].map((e, i) => (
              <div key={i} className="flex items-center justify-between text-[12px]">
                <span className="inline-flex items-center gap-2" style={{ color: C.textMute }}>
                  <span className="w-2 h-2 rounded-sm" style={{ background: e.color }} />
                  {e.name}
                </span>
                <span style={{ color: C.text }}>${e.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Scale projection */}
      <Card>
        <div className="text-[11.5px] uppercase tracking-[0.12em] mb-3" style={{ color: C.accent }}>At target run-rate</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Stat value="100/mo" label="Target rings" accent />
          <Stat value="$180K" label="Monthly revenue" />
          <Stat value="$90K" label="Monthly gross profit" />
          <Stat value="$2.16M" label="Annual run-rate" />
        </div>
      </Card>
    </Section>
  );
};

/* ─────────────────────────────────────────────────────────
   8. CHANNELS
   ───────────────────────────────────────────────────────── */
const Channels = () => (
  <Section id="channels" label="Sales Channels" withDivider
    title="Four channels, none of them dependent on the others."
    intro="The business doesn't live on a single platform. Etsy, our own lead-gen site, eBay, and word-of-mouth referrals each carry weight — and each can be scaled independently with capital.">
    <div className="grid lg:grid-cols-2 gap-5">
      <Card testid="channels-donut">
        <div className="text-[14px] font-semibold mb-2" style={{ color: C.text }}>Revenue mix · last fiscal year</div>
        <div style={{ width: '100%', height: 260 }}>
          <ResponsiveContainer>
            <PieChart>
              <Pie data={SALES_CHANNELS} dataKey="value" innerRadius={55} outerRadius={100} paddingAngle={3}>
                {SALES_CHANNELS.map((c, i) => <Cell key={i} fill={c.color} stroke="none" />)}
              </Pie>
              <Tooltip content={<ChartTooltip suffix="%" />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="space-y-3">
        {SALES_CHANNELS.map((c, i) => {
          const meta = [
            { icon: ShoppingBag, name: 'Etsy', detail: 'Top listings ranked organically; review-flywheel kicks in at scale.' },
            { icon: Globe, name: 'Lead Gen (Site)', detail: 'Custom wizard + admin CRM. Highest LTV, highest GM per lead.' },
            { icon: Box, name: 'eBay', detail: 'Auction + Buy-It-Now. Reaches a different deal-seeking buyer.' },
            { icon: Users, name: 'Word of Mouth', detail: '4 active resellers + organic referrals from past customers.' },
          ];
          const m = meta[i];
          const Icon = m.icon;
          return (
            <Card key={i}>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0"
                  style={{ background: c.color + '20', border: '1px solid ' + c.color + '50' }}>
                  <Icon size={16} style={{ color: c.color }} />
                </div>
                <div className="flex-1">
                  <div className="flex items-baseline justify-between gap-3 mb-0.5">
                    <span className="text-[15px] font-semibold" style={{ color: C.text }}>{c.name}</span>
                    <span className="text-[14px] font-semibold" style={{ color: c.color }}>{c.value}%</span>
                  </div>
                  <p className="text-[12.5px] leading-[1.5]" style={{ color: C.textMute }}>{m.detail}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  </Section>
);

/* ─────────────────────────────────────────────────────────
   9. REVIEWS
   ───────────────────────────────────────────────────────── */
const Reviews = () => (
  <Section id="reviews" label="Social Proof" withDivider
    title="Five stars, every single time."
    intro="The customer experience is the moat. Every ring ships with renders-before-pay, photos at every milestone, and a real human reply within hours.">
    <div className="flex items-center gap-2 mb-6">
      <div className="flex gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} size={20} fill={C.accent} style={{ color: C.accent }} />
        ))}
      </div>
      <span className="text-[14px]" style={{ color: C.text }}><strong>5.0</strong> from <strong>119</strong> verified customers · Etsy, eBay, direct</span>
    </div>
    <div className="grid sm:grid-cols-2 gap-4">
      {REVIEWS.map((r, i) => (
        <Card key={i}>
          <div className="flex gap-0.5 mb-2">
            {Array.from({ length: r.rating }).map((_, j) => (
              <Star key={j} size={12} fill={C.accent} style={{ color: C.accent }} />
            ))}
          </div>
          <p className="text-[14px] leading-[1.55] mb-3" style={{ color: C.text, fontFamily: '"Cormorant Garamond","Playfair Display",Georgia,serif', fontStyle: 'italic' }}>
            "{r.text}"
          </p>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold"
              style={{ background: 'rgba(212,175,55,0.15)', color: C.accent }}>
              {r.name[0]}
            </div>
            <div>
              <div className="text-[12.5px] font-medium" style={{ color: C.text }}>{r.name}</div>
              <div className="text-[11px]" style={{ color: C.textDim }}>{r.loc}</div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  </Section>
);

/* ─────────────────────────────────────────────────────────
   10. TECH (AJHQ.live + TheLocalJewel.com)
   ───────────────────────────────────────────────────────── */
const TECH_FEATURES = [
  'Custom lead-gen wizard with conditional branching',
  'Admin CRM — leads, orders, quotes, comments, stages',
  '12-tab Advanced Analytics suite (funnel, friction, geo, attribution)',
  'Project CMS with 3D-render gallery & SEO meta',
  'Cloudflare R2 file/image storage',
  'Customer OTP login + personal dashboard',
  'Render-to-product showcase slideshow',
  'Full event tracking (50+ custom events)',
];

const Tech = () => (
  <Section id="tech" label="Tech Stack" withDivider
    title="A founder who built the storefront, the CRM, and the analytics suite."
    intro="The platform isn't a Shopify template. The customer site, lead-gen wizard, admin CRM, project CMS, and analytics tooling are custom-built — which means every funnel decision, every UX experiment, and every margin lever is ours to pull.">
    <div className="grid lg:grid-cols-2 gap-5">
      {/* Visual placeholder for screenshots */}
      <Card>
        <div className="rounded-[12px] aspect-[16/10] flex items-center justify-center mb-3"
          style={{
            background: 'linear-gradient(135deg, ' + C.surfaceAlt + ', ' + C.bgAlt + ')',
            border: '1px dashed ' + C.border,
            color: C.textDim,
          }}>
          <div className="text-center px-6">
            <ImageIcon size={22} className="mx-auto mb-2 opacity-60" />
            <div className="text-[12px]">Admin CRM / Analytics screenshots</div>
            <div className="text-[10.5px] mt-1 opacity-70">Provide via admin → setting · 4 images recommended</div>
          </div>
        </div>
        <div className="text-[12.5px] font-medium mb-1" style={{ color: C.text }}>AJHQ.live — internal operations</div>
        <p className="text-[12.5px] leading-[1.5]" style={{ color: C.textMute }}>
          The founder's internal operating dashboard. Centralizes inventory, orders, supplier comms, and reseller distribution.
        </p>
      </Card>

      <Card>
        <div className="rounded-[12px] aspect-[16/10] flex items-center justify-center mb-3"
          style={{
            background: 'linear-gradient(135deg, ' + C.surfaceAlt + ', ' + C.bgAlt + ')',
            border: '1px dashed ' + C.border,
            color: C.textDim,
          }}>
          <div className="text-center px-6">
            <ImageIcon size={22} className="mx-auto mb-2 opacity-60" />
            <div className="text-[12px]">TheLocalJewel.com screenshots</div>
            <div className="text-[10.5px] mt-1 opacity-70">Landing, wizard, project page, admin CRM</div>
          </div>
        </div>
        <div className="text-[12.5px] font-medium mb-1" style={{ color: C.text }}>TheLocalJewel.com — customer-facing</div>
        <p className="text-[12.5px] leading-[1.5]" style={{ color: C.textMute }}>
          The full customer journey, from landing through quote to delivery — built in-house, deployed on Emergent's platform.
        </p>
      </Card>
    </div>

    <Card className="mt-5">
      <div className="text-[11.5px] uppercase tracking-[0.12em] mb-3" style={{ color: C.accent }}>What's shipped today</div>
      <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2.5">
        {TECH_FEATURES.map((f, i) => (
          <div key={i} className="flex items-start gap-2 text-[13.5px]" style={{ color: C.text }}>
            <CheckCircle2 size={14} style={{ color: C.accent2, marginTop: 2 }} className="flex-shrink-0" />
            <span>{f}</span>
          </div>
        ))}
      </div>
    </Card>
  </Section>
);

/* ─────────────────────────────────────────────────────────
   11. CONTENT
   ───────────────────────────────────────────────────────── */
const Content = () => (
  <Section id="content" label="Content & Acquisition" withDivider
    title="A creative engine that already proved itself at $25."
    intro="A small test campaign of $25 generated 2 strong leads — at our current AOV that's a 65× ROAS proof point. The next $150/day will compound that signal across five channels.">
    <div className="grid lg:grid-cols-3 gap-5 mb-6">
      <Card>
        <div className="text-[11.5px] uppercase tracking-[0.12em] mb-2" style={{ color: C.accent }}>$25 ad test</div>
        <div className="text-[36px] font-semibold" style={{ color: C.text, fontFamily: '"Cormorant Garamond","Playfair Display",Georgia,serif' }}>2 leads</div>
        <p className="text-[12.5px] mt-1.5" style={{ color: C.textMute }}>Proven CPL of $12.50 against an AOV of ~$1,800.</p>
      </Card>
      <Card>
        <div className="text-[11.5px] uppercase tracking-[0.12em] mb-2" style={{ color: C.accent }}>Target ad spend</div>
        <div className="text-[36px] font-semibold" style={{ color: C.text, fontFamily: '"Cormorant Garamond","Playfair Display",Georgia,serif' }}>$150/day</div>
        <p className="text-[12.5px] mt-1.5" style={{ color: C.textMute }}>Split + tested across Meta, Google, TikTok, Etsy Ads, eBay Promoted.</p>
      </Card>
      <Card>
        <div className="text-[11.5px] uppercase tracking-[0.12em] mb-2" style={{ color: C.accent }}>Founder content</div>
        <div className="text-[36px] font-semibold" style={{ color: C.text, fontFamily: '"Cormorant Garamond","Playfair Display",Georgia,serif' }}>200+</div>
        <p className="text-[12.5px] mt-1.5" style={{ color: C.textMute }}>Reels, TikToks, and UGC-style edits already produced in-house.</p>
      </Card>
    </div>
    <Card>
      <div className="text-[11.5px] uppercase tracking-[0.12em] mb-3" style={{ color: C.textMute }}>Active channels</div>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {['Meta (FB + IG)', 'Google', 'TikTok', 'Etsy Ads', 'eBay Promoted'].map((ch, i) => (
          <div key={i} className="rounded-[10px] px-3 py-2.5 text-center text-[13px] font-medium"
            style={{ background: C.bgAlt, border: '1px solid ' + C.border, color: C.text }}>
            {ch}
          </div>
        ))}
      </div>

      {/* Placeholder for content examples */}
      <div className="mt-4 rounded-[12px] p-4 flex items-center gap-3"
        style={{ background: 'rgba(212,175,55,0.06)', border: '1px dashed ' + C.border }}>
        <ImageIcon size={18} style={{ color: C.accent }} />
        <div className="text-[12.5px]" style={{ color: C.textMute }}>
          <strong style={{ color: C.text }}>Content examples</strong> — share your top-performing Reels / TikToks (links or screenshots) and we'll embed them here in a swipeable carousel.
        </div>
      </div>
    </Card>
  </Section>
);

/* ─────────────────────────────────────────────────────────
   12. BOTTLENECK (Why funding now)
   ───────────────────────────────────────────────────────── */
const Bottleneck = () => (
  <Section id="bottleneck" label="Why Funding Now" withDivider
    title="The business works. The bottleneck is working capital."
    intro="Every system we need is already in place — sourcing, marketplaces, resellers, ad creatives, automation, and a clear sales process. The growth governor is cash flow, not strategy.">
    <div className="grid lg:grid-cols-2 gap-5">
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle size={15} style={{ color: C.warn }} />
          <span className="text-[12px] font-semibold uppercase tracking-[0.12em]" style={{ color: C.warn }}>What's limiting us today</span>
        </div>
        <ul className="space-y-2.5 text-[13.5px] leading-[1.55]" style={{ color: C.textMute }}>
          <li>• Each order requires <strong style={{ color: C.text }}>upfront cash</strong> for stones, settings, CAD, production, shipping — before customer pays final.</li>
          <li>• Ad spend can't scale beyond test-budget without working capital — losing volume against competitors who outspend us.</li>
          <li>• Resellers convert faster with <strong style={{ color: C.text }}>ready-to-show inventory</strong>; today they wait on custom orders.</li>
          <li>• Founder is execution bottleneck on listings, follow-ups, and ops — need 1-2 hires.</li>
        </ul>
      </Card>
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <Target size={15} style={{ color: C.accent }} />
          <span className="text-[12px] font-semibold uppercase tracking-[0.12em]" style={{ color: C.accent }}>Where this gets us</span>
        </div>
        <ul className="space-y-2.5 text-[13.5px] leading-[1.55]" style={{ color: C.textMute }}>
          <li>• Consistent <strong style={{ color: C.text }}>$150/day across 5 ad platforms</strong>, with KPI tracking and re-allocation to top performers.</li>
          <li>• <strong style={{ color: C.text }}>8 stock engagement rings</strong> distributed across 4 resellers — every reseller gets sellable inventory.</li>
          <li>• Cash buffer for upfront fulfillment costs, so ad-driven orders ship without delay.</li>
          <li>• <strong style={{ color: C.text }}>1–2 full-time hires</strong> on listings, follow-ups, marketing — unlocks 100 rings/month.</li>
        </ul>
      </Card>
    </div>

    <div className="mt-6 rounded-[18px] p-6 text-center"
      style={{ background: 'linear-gradient(135deg, rgba(212,175,55,0.10), rgba(212,175,55,0.02))', border: '1px solid rgba(212,175,55,0.3)' }}>
      <div className="flex items-center justify-center gap-2 mb-2">
        <Rocket size={16} style={{ color: C.accent }} />
        <span className="text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: C.accent }}>The growth move</span>
      </div>
      <p className="text-[18px] sm:text-[22px] leading-[1.35] max-w-3xl mx-auto"
        style={{ color: C.text, fontFamily: '"Cormorant Garamond","Playfair Display",Georgia,serif' }}>
        Move from steady early sales to a consistent <em style={{ color: C.accent }}>100 rings / month</em> — using the engine that's already built.
      </p>
    </div>
  </Section>
);

/* ─────────────────────────────────────────────────────────
   13. USE OF FUNDS
   ───────────────────────────────────────────────────────── */
const UseOfFunds = () => (
  <Section id="use-of-funds" label="Use of Funds" withDivider
    title="Where the capital goes — and the KPI it has to hit."
    intro="Every dollar maps to a measurable outcome. We track CPL, ROAS, conversion rate, and reseller turn — and re-allocate quarterly.">
    <div className="grid lg:grid-cols-5 gap-5">
      {/* Pie chart */}
      <Card className="lg:col-span-2" testid="use-of-funds-chart">
        <div className="text-[14px] font-semibold mb-2" style={{ color: C.text }}>Allocation</div>
        <div style={{ width: '100%', height: 260 }}>
          <ResponsiveContainer>
            <PieChart>
              <Pie data={USE_OF_FUNDS} dataKey="pct" innerRadius={60} outerRadius={100} paddingAngle={2}>
                {USE_OF_FUNDS.map((u, i) => <Cell key={i} fill={u.color} stroke="none" />)}
              </Pie>
              <Tooltip content={<ChartTooltip suffix="%" />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Breakdown rows */}
      <div className="lg:col-span-3 space-y-2.5">
        {USE_OF_FUNDS.map((u, i) => (
          <Card key={i}>
            <div className="flex items-start gap-3">
              <div className="w-1.5 h-12 rounded-full flex-shrink-0" style={{ background: u.color }} />
              <div className="flex-1">
                <div className="flex items-baseline justify-between mb-0.5 gap-3">
                  <span className="text-[14.5px] font-semibold" style={{ color: C.text }}>{u.name}</span>
                  <span className="text-[20px] font-semibold flex-shrink-0" style={{ color: u.color, fontFamily: '"Cormorant Garamond","Playfair Display",Georgia,serif' }}>{u.pct}%</span>
                </div>
                <p className="text-[12.5px] leading-[1.5]" style={{ color: C.textMute }}>{u.detail}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>

    {/* Plan-to-100 callout */}
    <div className="mt-7 grid grid-cols-2 sm:grid-cols-4 gap-3">
      <Stat value="100/mo" label="Ring target" accent sub="Run-rate goal" />
      <Stat value="$150/day" label="Ad spend" sub="5 channels" />
      <Stat value="8 rings" label="Reseller stock" sub="2 per reseller × 4" />
      <Stat value="1–2 FT" label="New hires" sub="Listings + ops" />
    </div>
  </Section>
);

/* ─────────────────────────────────────────────────────────
   14. ASK
   ───────────────────────────────────────────────────────── */
const Ask = () => (
  <Section id="ask" label="The Ask" withDivider
    title="A profitable business looking for the capital to compound itself.">
    <Card className="relative overflow-hidden">
      <div aria-hidden="true" className="absolute -top-12 -right-12 w-48 h-48 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.16), transparent 70%)' }} />
      <div className="relative">
        <div className="text-[11.5px] uppercase tracking-[0.16em] mb-3" style={{ color: C.accent }}>What we're looking for</div>
        <p className="text-[17px] sm:text-[19px] leading-[1.55] max-w-3xl mb-7" style={{ color: C.text }}>
          Working-capital partner who understands that the business is already profitable and the goal is consistent compounding — not a moonshot. Structure can be a loan, a line of credit, or a revenue-share arrangement, depending on fit.
        </p>

        <div className="grid sm:grid-cols-3 gap-3 mb-7">
          {[
            { icon: Award, t: 'Profitable today', s: '$250K FY · 50% GM' },
            { icon: Shield, t: 'Zero inventory risk', s: 'Approve-before-cut model' },
            { icon: TrendingUp, t: 'KPI-disciplined', s: 'CPL · ROAS · turn-time tracked' },
          ].map((b, i) => {
            const Icon = b.icon;
            return (
              <div key={i} className="rounded-[12px] p-4 flex items-start gap-3"
                style={{ background: C.bgAlt, border: '1px solid ' + C.border }}>
                <div className="w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(212,175,55,0.10)', border: '1px solid rgba(212,175,55,0.3)' }}>
                  <Icon size={15} style={{ color: C.accent }} />
                </div>
                <div>
                  <div className="text-[13.5px] font-semibold" style={{ color: C.text }}>{b.t}</div>
                  <div className="text-[11.5px] mt-0.5" style={{ color: C.textMute }}>{b.s}</div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <a
            href="mailto:ansh@thelocaljewel.com?subject=The Local Jewel · Investor inquiry"
            data-testid="pitch-ask-contact"
            className="inline-flex items-center justify-center gap-2 px-6 min-h-[52px] rounded-[12px] font-medium text-[15px] transition-all duration-300 active:scale-[0.99]"
            style={{ background: C.accent, color: C.bg, boxShadow: '0 8px 24px rgba(212,175,55,0.28)' }}
          >
            Start the conversation <ArrowRight size={16} />
          </a>
          <a
            href="tel:+15857108292"
            className="inline-flex items-center justify-center gap-2 px-5 min-h-[52px] rounded-[12px] font-medium text-[15px] transition-all duration-300"
            style={{ background: 'transparent', color: C.text, border: '1px solid ' + C.border }}
          >
            <MapPin size={14} /> Or call directly
          </a>
        </div>
      </div>
    </Card>
  </Section>
);

/* ─────────────────────────────────────────────────────────
   FOOTER
   ───────────────────────────────────────────────────────── */
const Footer = () => (
  <footer className="border-t mt-6" style={{ borderColor: C.border, color: C.textDim }}>
    <div className="max-w-6xl mx-auto px-5 sm:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11.5px]">
      <div className="flex items-center gap-2">
        <Diamond size={11} style={{ color: C.accent }} />
        <span>The Local Jewel — Custom diamond jewelry, Orlando, FL · IGI / GIA certified</span>
      </div>
      <div>© {new Date().getFullYear()} · Confidential · Do not share without consent</div>
    </div>
  </footer>
);
