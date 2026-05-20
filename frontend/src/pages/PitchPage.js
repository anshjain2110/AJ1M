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
  Calendar, TrendingDown, Send, X, Bot, MessageCircle as ChatIcon, Loader2,
  Banknote,
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
// Updated market-share series — 2025 crossover at ~70%
const MARKET_SHARE_DATA = [
  { year: '2019', lab: 4, natural: 96 },
  { year: '2020', lab: 8, natural: 92 },
  { year: '2021', lab: 15, natural: 85 },
  { year: '2022', lab: 28, natural: 72 },
  { year: '2023', lab: 46, natural: 54 },
  { year: '2024', lab: 60, natural: 40 },
  { year: '2025', lab: 70, natural: 30 },
  { year: '2026E', lab: 78, natural: 22 },
];

// Trailing-12 monthly distribution (Apr 2025 → Apr 2026, sums to ~$300K)
const REVENUE_HISTORY = [
  { m: 'Apr', revenue: 17000, orders: 10 },
  { m: 'May', revenue: 22100, orders: 13 },
  { m: 'Jun', revenue: 27200, orders: 16 },
  { m: 'Jul', revenue: 51000, orders: 30 },
  { m: 'Aug', revenue: 30600, orders: 18 },
  { m: 'Sep', revenue: 27200, orders: 16 },
  { m: 'Oct', revenue: 22100, orders: 13 },
  { m: 'Nov', revenue: 25500, orders: 15 },
  { m: 'Dec', revenue: 30600, orders: 18 },
  { m: 'Jan', revenue: 15300, orders: 9 },
  { m: 'Feb', revenue: 13600, orders: 8 },
  { m: 'Mar', revenue: 17000, orders: 10 },
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
    const ids = ['hero', 'opportunity', 'problem', 'founder', 'social-proof', 'solution', 'traction', 'economics', 'ramp', 'projection', 'ltv', 'use-of-funds', 'returns', 'channels', 'tech', 'content', 'bottleneck', 'ask'];
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
      <TargetCustomer />
      <Founder />
      <Reviews />
      <Solution />
      <Traction />
      <Economics />
      <FourMonthRamp />
      <ThreeYearProjection />
      <LifetimeValue />
      <UseOfFunds />
      <InvestorReturns />
      <Tech />
      <Bottleneck />
      <Ask />

      <Footer />
      <ChatWidget />
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
    { id: 'target-customer', label: 'Customer' },
    { id: 'founder', label: 'Founder' },
    { id: 'traction', label: 'Traction' },
    { id: 'economics', label: 'Economics' },
    { id: 'ramp', label: 'Ramp' },
    { id: 'projection', label: 'Outlook' },
    { id: 'ltv', label: 'LTV' },
    { id: 'returns', label: 'Returns' },
    { id: 'use-of-funds', label: 'Funds' },
    { id: 'ask', label: 'Ask' },
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
        <button onClick={() => scrollTo('hero')} className="flex items-center gap-2.5 flex-shrink-0" data-testid="pitch-topnav-logo">
          <img src="/tlj-logomark.png" alt="The Local Jewel" className="w-8 h-8 object-contain select-none" draggable="false"
            style={{ filter: 'drop-shadow(0 0 8px rgba(212,175,55,0.25))' }} />
          <div className="text-left">
            <div className="text-[14px] font-semibold leading-none" style={{ color: C.text }}>The Local Jewel</div>
            <div className="text-[9.5px] uppercase tracking-[0.16em] mt-0.5" style={{ color: C.textDim }}>Investor brief · Confidential</div>
          </div>
        </button>
        <nav className="hidden lg:flex items-center gap-0.5 flex-1 justify-center overflow-hidden whitespace-nowrap">
          {items.map(it => (
            <button key={it.id} onClick={() => scrollTo(it.id)}
              data-testid={'navitem-' + it.id}
              className="px-2 py-1.5 rounded-full text-[11.5px] transition-colors whitespace-nowrap"
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
  const revenue = useCountUp(300, 1400);
  const margin = useCountUp(44, 1200);
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
              A profitable, founder-led custom jewelry brand. $300K in trailing sales activity, $700 gross margin per ring, and a clear 4-month plan to scale to 100 rings/month with a $100K equity raise.
            </p>

            <div className="grid grid-cols-3 gap-3 sm:gap-5 max-w-2xl">
              <Stat value={'$' + revenue + 'K'} label="Trailing sales" sub="Apr 2025 → Apr 2026" accent />
              <Stat value={'~' + margin + '%'} label="Gross margin" sub="$700 / ring" />
              <Stat value={target + '/mo'} label="Month-4 target" sub="From 6 avg today" />
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
    title="Lab-grown diamonds now own 70% of the U.S. engagement ring market."
    intro="Five years ago, lab-grown was a curiosity. By 2025 it's the default for new buyers — and it's compressing retail margins at every traditional jeweler. The window to build the trusted, custom-first brand of this transition is open right now.">
    <div className="grid lg:grid-cols-5 gap-5 sm:gap-7">
      <Card className="lg:col-span-3" testid="opportunity-chart">
        <div className="flex items-baseline justify-between mb-3">
          <div className="text-[14px] font-semibold" style={{ color: C.text }}>U.S. engagement ring market share</div>
          <div className="text-[11px] uppercase tracking-[0.12em]" style={{ color: C.textDim }}>2019 — 2026E</div>
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
          Source: Industry consensus (Tenoris / MVI / Edahn Golan / De Beers reports). 2025 crossed ~70% share.
        </div>
      </Card>

      <div className="lg:col-span-2 space-y-3.5">
        <Stat value="70%" label="Lab share of engagement rings, 2025" accent />
        <Stat value="4.7×" label="Lab-grown unit-growth, 2021 → 2025" />
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
   3.5  TARGET CUSTOMER (profile table)
   ───────────────────────────────────────────────────────── */
const TARGET_CUSTOMER_ROWS = [
  { attr: 'Age',                 target: '24–38' },
  { attr: 'Life stage',          target: 'Recently engaged, planning to propose, or actively ring shopping' },
  { attr: 'Location',            target: 'United States — online-first with Florida / NY / major-metro reach' },
  { attr: 'Budget',              target: '~$1,500 – $4,000' },
  { attr: 'Product need',        target: 'Custom lab-grown engagement ring' },
  { attr: 'Buying behavior',     target: 'Research-heavy, compares prices, asks questions, wants guidance' },
  { attr: 'Main concern',        target: '"Am I overpaying?" · "Can I trust this jeweler?"' },
  { attr: 'Acquisition channels',target: 'Instagram · TikTok · Etsy · eBay · Google · referrals · resellers' },
  { attr: 'Decision driver',     target: 'Better price · trust · customization · fast fulfillment · personal guidance' },
];

const TargetCustomer = () => (
  <Section id="target-customer" label="Target Customer" withDivider>
    {/* Title + intro + customer photo side-by-side */}
    <div className="grid lg:grid-cols-[1.15fr_1fr] gap-7 lg:gap-10 items-center mb-7">
      <div>
        <h2 className="text-[34px] sm:text-[40px] lg:text-[44px] leading-[1.1] tracking-[-0.015em] mb-4"
          style={{ color: C.text, fontFamily: '"Cormorant Garamond","Playfair Display",Georgia,serif' }}>
          Value-conscious couples buying <span style={{ color: C.accent, fontStyle: 'italic' }}>high-intent</span> custom engagement rings.
        </h2>
        <p className="text-[15px] sm:text-[16px] leading-[1.6] max-w-xl" style={{ color: C.textMute }}>
          TheLocalJewel targets modern couples who want a beautiful, custom lab-grown diamond engagement ring — without paying traditional retail markups.
        </p>
      </div>

      {/* Customer moment photo */}
      <div className="relative" data-testid="target-customer-photo">
        <div aria-hidden="true" className="absolute -inset-3 rounded-[22px] -z-0"
          style={{ background: 'radial-gradient(ellipse at 50% 40%, rgba(212,175,55,0.18), transparent 70%)', filter: 'blur(8px)' }} />
        <div className="relative rounded-[18px] overflow-hidden"
          style={{ border: '1px solid ' + C.border, background: C.bgAlt, boxShadow: '0 18px 48px rgba(0,0,0,0.35)' }}>
          <img
            src="/pitch-customer-winterpark.jpeg"
            alt="A happy Winter Park, FL customer receiving his custom IGI-certified lab-grown engagement ring at TheLocalJewel"
            className="w-full h-auto block select-none"
            draggable="false"
            style={{ aspectRatio: '4/5', objectFit: 'cover' }}
          />
          {/* caption overlay */}
          <div className="absolute left-0 right-0 bottom-0 px-4 py-3 flex items-center justify-between"
            style={{ background: 'linear-gradient(180deg, transparent, rgba(10,31,26,0.92))' }}>
            <div>
              <div className="text-[10.5px] uppercase tracking-[0.16em] mb-0.5" style={{ color: C.accent }}>Real customer · just picked up</div>
              <div className="text-[12.5px]" style={{ color: C.text }}>Winter Park, FL · custom lab-grown ring + IGI certificate</div>
            </div>
            <Diamond size={16} style={{ color: C.accent }} />
          </div>
        </div>
      </div>
    </div>

    {/* Profile table */}
    <Card testid="target-customer-table">
      <div className="text-[10.5px] uppercase tracking-[0.16em] mb-4" style={{ color: C.accent }}>Primary Customer Profile</div>

      {/* Table header */}
      <div className="hidden sm:grid sm:grid-cols-[260px_1fr] gap-6 pb-3 mb-1" style={{ borderBottom: '1px solid ' + C.border }}>
        <div className="text-[10.5px] uppercase tracking-[0.16em]" style={{ color: C.textDim }}>Attribute</div>
        <div className="text-[10.5px] uppercase tracking-[0.16em]" style={{ color: C.textDim }}>Target</div>
      </div>

      <div>
        {TARGET_CUSTOMER_ROWS.map((row, i) => (
          <div key={i}
            data-testid={'target-customer-row-' + i}
            className="grid sm:grid-cols-[260px_1fr] gap-2 sm:gap-6 py-4 transition-colors"
            style={{ borderBottom: i === TARGET_CUSTOMER_ROWS.length - 1 ? 'none' : '1px solid ' + C.border }}>
            <div className="text-[14px] sm:text-[15px] font-semibold tracking-[-0.005em]"
              style={{ color: C.text, fontFamily: '"Cormorant Garamond","Playfair Display",Georgia,serif' }}>
              {row.attr}
            </div>
            <div className="text-[13.5px] sm:text-[14px] leading-[1.55]" style={{ color: C.textMute }}>
              {row.target}
            </div>
          </div>
        ))}
      </div>
    </Card>

    {/* Scroll-hint accent matching the source */}
    <div className="mt-6 flex items-center justify-center">
      <div className="w-9 h-9 rounded-full flex items-center justify-center"
        style={{ background: 'rgba(212,175,55,0.10)', border: '1px solid rgba(212,175,55,0.3)' }}>
        <ArrowDown size={14} style={{ color: C.accent }} />
      </div>
    </div>
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
    intro="">
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
   5. SOLUTION  (display-quote treatment + 4 numbered pillars)
   ───────────────────────────────────────────────────────── */
const SOLUTION_PILLARS = [
  { num: '01', title: 'Wholesale-First Sourcing',     body: 'Five years inside the loose-diamond supply chain — direct vendor relationships replace the layers of middlemen baked into retail pricing.' },
  { num: '02', title: 'Digital-Native Distribution',  body: 'Customers find us on Etsy, eBay, social, paid ads, and reseller partners. Zero showroom rent. Zero geographic ceiling.' },
  { num: '03', title: 'Custom, No Retail Markup',     body: 'Renders before payment, IGI-certified stones, personal guidance — the boutique experience without the boutique overhead.' },
  { num: '04', title: 'Lean, Tech-Led Operations',    body: 'A founder-built platform handles listings, leads, follow-ups, fulfillment, and analytics. Headcount stays flat as volume scales.' },
];
const Solution = () => (
  <Section id="solution" label="The Solution" withDivider>
    {/* Display-quote treatment */}
    <div className="relative max-w-4xl mx-auto text-center px-2 sm:px-6 mb-10 sm:mb-14">
      <div aria-hidden="true" className="absolute -top-6 left-1/2 -translate-x-1/2 text-[120px] leading-none font-semibold opacity-[0.10] select-none"
        style={{ color: C.accent, fontFamily: '"Cormorant Garamond","Playfair Display",Georgia,serif' }}>"</div>
      <p className="relative text-[22px] sm:text-[30px] lg:text-[34px] leading-[1.3] tracking-[-0.01em]"
        style={{ color: C.text, fontFamily: '"Cormorant Garamond","Playfair Display",Georgia,serif', fontStyle: 'italic' }}>
        For couples buying engagement rings, <span style={{ color: C.accent, fontStyle: 'italic' }}>TheLocalJewel</span> offers custom lab-grown diamond rings with <span style={{ color: C.accent, fontStyle: 'italic' }}>better pricing, faster fulfillment, and personal guidance</span> by sourcing directly and operating without traditional showroom overhead.
      </p>
      <div className="mt-5 flex items-center justify-center gap-3" style={{ color: C.textDim }}>
        <div className="h-px w-10" style={{ background: C.accent, opacity: 0.5 }} />
        <span className="text-[10.5px] uppercase tracking-[0.28em]" style={{ color: C.accent }}>How it works</span>
        <div className="h-px w-10" style={{ background: C.accent, opacity: 0.5 }} />
      </div>
    </div>

    {/* Numbered horizontal grid — sleek single row */}
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4" data-testid="solution-pillars">
      {SOLUTION_PILLARS.map((s, i) => (
        <div key={i} data-testid={'solution-pillar-' + s.num}
          className="relative rounded-[16px] p-5 sm:p-6 transition-all duration-300 hover:-translate-y-0.5"
          style={{ background: C.bgAlt, border: '1px solid ' + C.border }}>
          <div className="flex items-baseline justify-between mb-4">
            <div className="text-[42px] font-semibold leading-none tracking-[-0.02em]"
              style={{ color: C.accent, fontFamily: '"Cormorant Garamond","Playfair Display",Georgia,serif', opacity: 0.85 }}>
              {s.num}
            </div>
            <div className="h-px flex-1 ml-3" style={{ background: 'linear-gradient(90deg, ' + C.accent + '88, transparent)' }} />
          </div>
          <h3 className="text-[17px] sm:text-[18px] font-semibold mb-2 leading-[1.25]"
            style={{ color: C.text, fontFamily: '"Cormorant Garamond","Playfair Display",Georgia,serif' }}>
            {s.title}
          </h3>
          <p className="text-[13px] leading-[1.55]" style={{ color: C.textMute }}>{s.body}</p>
        </div>
      ))}
    </div>
  </Section>
);

/* ─────────────────────────────────────────────────────────
   6. TRACTION
   ───────────────────────────────────────────────────────── */
const Traction = () => (
  <Section id="traction" label="Where We Are Today" withDivider
    title="$300K in trailing sales — and the channels are already firing.">
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      <Stat value="$300K" label="Total revenue" sub="Apr 2025 → Apr 2026" accent />
      <Stat value="6 / 30" label="Avg / best month" sub="Rings shipped" />
      <Stat value="4" label="Active resellers" sub="On memo · 12 sales to date" />
      <Stat value="37.6×" label="Marketplace Ads ROAS" sub="$418 spend → $15.7K rev" />
    </div>

    {/* Marketplace Ads + Meta detail cards */}
    <div className="grid lg:grid-cols-2 gap-5 mb-6">
      <Card testid="traction-marketplace-ads">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-[8px] flex items-center justify-center" style={{ background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.3)' }}>
              <ShoppingBag size={14} style={{ color: C.accent }} />
            </div>
            <div>
              <div className="text-[13px] font-semibold" style={{ color: C.text }}>Marketplace Ads</div>
              <div className="text-[10.5px] uppercase tracking-[0.12em]" style={{ color: C.textDim }}>Etsy promoted listings</div>
            </div>
          </div>
          <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(212,175,55,0.10)', color: C.accent, border: '1px solid rgba(212,175,55,0.3)' }}>Top channel</span>
        </div>

        {/* Real Etsy dashboard screenshot — proof, not numbers we typed */}
        <div className="rounded-[12px] overflow-hidden mb-3"
          style={{ background: '#fafafa', border: '1px solid ' + C.border, padding: '14px 18px' }}>
          <img src="/pitch-marketplace-roas.png" alt="Etsy promoted-listings dashboard — 57.2K views · 1,214 clicks · 9 orders · $15,742 revenue · $418 spend · 37.6× ROAS"
            data-testid="traction-marketplace-screenshot"
            className="w-full h-auto block select-none" draggable="false"
            style={{ maxHeight: 200, objectFit: 'contain' }} />
        </div>

        <p className="text-[12px] leading-[1.5]" style={{ color: C.textMute }}>
          Pulled directly from the Etsy seller dashboard. <strong style={{ color: C.text }}>$418</strong> in spend returned <strong style={{ color: C.accent }}>$15,742</strong> — every $1 returned $37.60.
        </p>
      </Card>

      <Card testid="traction-meta-ads">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-[8px] flex items-center justify-center" style={{ background: 'rgba(123,196,168,0.12)', border: '1px solid rgba(123,196,168,0.3)' }}>
              <Megaphone size={14} style={{ color: C.accent2 }} />
            </div>
            <div>
              <div className="text-[13px] font-semibold" style={{ color: C.text }}>Meta Ad Test</div>
              <div className="text-[10.5px] uppercase tracking-[0.12em]" style={{ color: C.textDim }}>$25 budget · early signal</div>
            </div>
          </div>
          <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(123,196,168,0.10)', color: C.accent2, border: '1px solid rgba(123,196,168,0.3)' }}>Proof of demand</span>
        </div>
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div><div className="text-[10.5px] uppercase tracking-[0.1em]" style={{ color: C.textDim }}>Spend</div><div className="text-[18px] font-semibold" style={{ color: C.text }}>$25</div></div>
          <div><div className="text-[10.5px] uppercase tracking-[0.1em]" style={{ color: C.textDim }}>Impressions</div><div className="text-[18px] font-semibold" style={{ color: C.text }}>~3,000</div></div>
          <div><div className="text-[10.5px] uppercase tracking-[0.1em]" style={{ color: C.textDim }}>Leads</div><div className="text-[18px] font-semibold" style={{ color: C.text }}>4</div></div>
        </div>
        <div className="rounded-[10px] p-3" style={{ background: C.bgAlt, border: '1px solid ' + C.border }}>
          <div className="text-[10.5px] uppercase tracking-[0.1em] mb-1" style={{ color: C.textDim }}>Outcome</div>
          <div className="text-[13.5px] leading-[1.4]" style={{ color: C.text }}>4 lead-form submissions · 2 quote-ready leads · $6.25 CPL at test scale.</div>
        </div>
        <p className="text-[12px] mt-3 leading-[1.5]" style={{ color: C.textMute }}>With proper retargeting + follow-up at scale, this channel becomes the second Etsy.</p>
      </Card>
    </div>

    <Card testid="traction-chart">
      <div className="flex items-baseline justify-between mb-3 flex-wrap gap-2">
        <div>
          <div className="text-[14px] font-semibold" style={{ color: C.text }}>Monthly revenue & orders</div>
          <div className="text-[11.5px]" style={{ color: C.textDim }}>Apr 2025 → Apr 2026 · best month: 30 rings · current avg: 6/mo</div>
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
  { name: 'Design + Metal + Diamond + Setting', value: 760, color: '#D4AF37' },
  { name: 'Platform fee (~7.2%)', value: 115, color: '#6B95A8' },
  { name: 'Shipping (insured)', value: 25, color: '#A88FC9' },
];

// 4-month ramp — adds month-by-month ad spend, ops, contribution
const RAMP_DATA = [
  { m: 'M1', etsy: 15, ebay: 0,  web: 10, resellers: 10, referrals: 0, rings: 35,  revenue: 56000,  gm: 24500, adSpend: 7800,  opsSpend: 5000, totalSpend: 12800, contribution: 11700 },
  { m: 'M2', etsy: 20, ebay: 2,  web: 20, resellers: 12, referrals: 1, rings: 55,  revenue: 88000,  gm: 38500, adSpend: 10200, opsSpend: 6000, totalSpend: 16200, contribution: 22300 },
  { m: 'M3', etsy: 23, ebay: 5,  web: 30, resellers: 15, referrals: 2, rings: 75,  revenue: 120000, gm: 52500, adSpend: 12500, opsSpend: 7000, totalSpend: 19500, contribution: 33000 },
  { m: 'M4', etsy: 25, ebay: 10, web: 40, resellers: 20, referrals: 5, rings: 100, revenue: 160000, gm: 70000, adSpend: 14500, opsSpend: 8000, totalSpend: 22500, contribution: 47500 },
];

// 3-year outlook — Y1 = 1,065 rings; Y2 = 1,600 rings; Y3 = 2,720 rings
// ASP $1,600 · GM/ring $700 · jewelry-expansion GM assumed 40%
const THREE_YEAR = [
  { y: 'Y1', rings: 1065, ringRev: 1704000, jewelryRev: 50000,    total: 1754000, gm: 765500,  opContrib: 490000  },
  { y: 'Y2', rings: 1600, ringRev: 2560000, jewelryRev: 500000,   total: 3060000, gm: 1320000, opContrib: 770000  },
  { y: 'Y3', rings: 2720, ringRev: 4352000, jewelryRev: 1250000,  total: 5602000, gm: 2404000, opContrib: 1310000 },
];

// Investor return scenarios at 7.69% ownership ($100K @ $1.2M pre-money)
const RETURN_SCENARIOS = [
  { fcv: 2000000,  stake: 153800,  mult: 1.54 },
  { fcv: 3000000,  stake: 230700,  mult: 2.31 },
  { fcv: 5000000,  stake: 384500,  mult: 3.85 },
  { fcv: 10000000, stake: 769200,  mult: 7.69 },
];

// Per-bucket monthly use-of-funds spend (the hover tooltip data)
const USE_OF_FUNDS_MONTHLY = {
  'Paid Ads':                [{ m: 'M1', v: 7800 }, { m: 'M2', v: 10200 }, { m: 'M3', v: 12500 }, { m: 'M4', v: 14500 }],
  'Operations / Employees / AI / Execution': [{ m: 'M1', v: 5000 }, { m: 'M2', v: 6000 }, { m: 'M3', v: 7000 }, { m: 'M4', v: 8000 }],
};

const USE_OF_FUNDS_V2 = [
  { name: 'Paid Ads', amount: 45000, pct: 45, color: '#D4AF37', detail: 'Across Meta · Etsy · TikTok · Google · eBay. Re-allocated quarterly to top-performing channels by ROAS.' },
  { name: 'Reseller rolling inventory', amount: 25000, pct: 25, color: '#C58E5A', detail: 'Working capital, not burn. Rotates back into liquid stock as resellers sell.' },
  { name: 'Operations / Employees / AI / Execution', amount: 20000, pct: 20, color: '#A88F6B', detail: 'Listings, follow-ups, marketing, ops. Grows from ~$5K/mo to ~$8K/mo across the deployment window.' },
  { name: 'Buffer', amount: 10000, pct: 10, color: '#6B4F33', detail: 'Contingency reserve for stone-price spikes, marketplace fee changes, or seasonal cash gaps.' },
];
const Economics = () => {
  const ringPrice = 1600;
  const cogs = UNIT_ECON.reduce((s, x) => s + x.value, 0);
  const gm = ringPrice - cogs;
  const gmPct = Math.round((gm / ringPrice) * 100);
  return (
    <Section id="economics" label="Unit Economics" withDivider
      title="$1,600 selling price. $700 stays as gross margin."
      intro="">
      <div className="grid lg:grid-cols-2 gap-5 mb-6">
        {/* Numeric breakdown */}
        <Card>
          <div className="text-[11.5px] uppercase tracking-[0.12em] mb-4" style={{ color: C.textMute }}>Per-ring breakdown</div>
          <div className="space-y-3">
            {[...UNIT_ECON, { name: 'Gross profit', value: gm, color: C.accent, hi: true }].map((e, i) => (
              <div key={i}>
                <div className="flex items-baseline justify-between mb-1">
                  <span className={'text-[13px] ' + (e.hi ? 'font-semibold' : '')} style={{ color: e.hi ? C.accent : C.text }}>{e.name}</span>
                  <span className={'font-semibold ' + (e.hi ? 'text-[24px]' : 'text-[16px]')} style={{ color: e.hi ? C.accent : C.text, fontFamily: e.hi ? '"Cormorant Garamond","Playfair Display",Georgia,serif' : 'inherit' }}>${e.value}</span>
                </div>
                <div className="h-1 rounded-full" style={{ background: 'linear-gradient(90deg,' + e.color + 'CC,' + e.color + ')', width: Math.round((e.value / ringPrice) * 100) + '%', opacity: e.hi ? 1 : 0.75 }} />
              </div>
            ))}
            <div className="pt-3 mt-2 flex items-baseline justify-between" style={{ borderTop: '1px solid ' + C.border }}>
              <span className="text-[12.5px] uppercase tracking-[0.12em]" style={{ color: C.textMute }}>Sale price</span>
              <span className="text-[22px] font-semibold" style={{ color: C.text, fontFamily: '"Cormorant Garamond","Playfair Display",Georgia,serif' }}>${ringPrice.toLocaleString()}</span>
            </div>
          </div>
          <div className="mt-5 px-4 py-3 rounded-[12px] flex items-center justify-between"
            style={{ background: 'rgba(123,196,168,0.10)', border: '1px solid rgba(123,196,168,0.25)' }}>
            <span className="text-[12.5px]" style={{ color: C.text }}>Gross margin %</span>
            <span className="text-[22px] font-semibold" style={{ color: C.accent2, fontFamily: '"Cormorant Garamond","Playfair Display",Georgia,serif' }}>{gmPct}%</span>
          </div>
        </Card>

        {/* Donut */}
        <Card testid="economics-donut">
          <div className="text-[14px] font-semibold mb-2" style={{ color: C.text }}>Where each $1,600 ring goes</div>
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
          <div className="mt-2 grid grid-cols-1 gap-x-3 gap-y-1.5">
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
        <div className="text-[11.5px] uppercase tracking-[0.12em] mb-3" style={{ color: C.accent }}>At Month-4 run-rate</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Stat value="100/mo" label="Rings" accent />
          <Stat value="$160K" label="Monthly revenue" />
          <Stat value="$70K" label="Monthly gross margin" />
          <Stat value="$1.92M" label="Annual run-rate" />
        </div>
      </Card>
    </Section>
  );
};

/* ─────────────────────────────────────────────────────────
   9. REVIEWS
   ───────────────────────────────────────────────────────── */
const Reviews = () => (
  <Section id="social-proof" label="Social Proof" withDivider
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
   10. TECH (slim: internal HQ + external customer site)
   ───────────────────────────────────────────────────────── */
const Tech = () => (
  <Section id="tech" label="Tech Stack" withDivider
    title="Two custom platforms — one for the team, one for the customer."
    intro="Everything below the surface is built in-house. No off-the-shelf templates, no third-party CRMs to outgrow.">
    <div className="grid lg:grid-cols-2 gap-5" data-testid="tech-platforms">

      {/* Internal HQ */}
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-[8px] flex items-center justify-center" style={{ background: 'rgba(123,196,168,0.12)', border: '1px solid rgba(123,196,168,0.3)' }}>
            <Layers size={13} style={{ color: C.accent2 }} />
          </div>
          <span className="text-[10.5px] uppercase tracking-[0.16em]" style={{ color: C.accent2 }}>Internal · Operations</span>
        </div>
        <div className="rounded-[12px] overflow-hidden mb-4"
          style={{ border: '1px solid ' + C.border, background: '#fff' }}>
          <img src="/pitch-ajhq-screenshot.png" alt="Internal operations dashboard — pricing, listings, content, production"
            data-testid="tech-internal-screenshot"
            className="w-full h-auto block select-none" draggable="false"
            style={{ aspectRatio: '16/10', objectFit: 'cover', objectPosition: 'left top' }} />
        </div>
        <div className="text-[15px] font-semibold mb-1" style={{ color: C.text, fontFamily: '"Cormorant Garamond","Playfair Display",Georgia,serif' }}>The operating system</div>
        <p className="text-[12.5px] leading-[1.5]" style={{ color: C.textMute }}>
          Pricing engine, listing builder, content generator, and production tracker — purpose-built for jewelry workflows.
        </p>
      </Card>

      {/* External customer site */}
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-[8px] flex items-center justify-center" style={{ background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.3)' }}>
            <Globe size={13} style={{ color: C.accent }} />
          </div>
          <span className="text-[10.5px] uppercase tracking-[0.16em]" style={{ color: C.accent }}>External · Customer-facing</span>
        </div>
        <div className="rounded-[12px] overflow-hidden mb-4"
          style={{ border: '1px solid ' + C.border, background: '#fff' }}>
          <img src="/pitch-tlj-landing.png" alt="thelocaljewel.com — landing page with savings comparison"
            data-testid="tech-external-screenshot"
            className="w-full h-auto block select-none" draggable="false"
            style={{ aspectRatio: '16/10', objectFit: 'cover', objectPosition: 'center top' }} />
        </div>
        <div className="text-[15px] font-semibold mb-1" style={{ color: C.text, fontFamily: '"Cormorant Garamond","Playfair Display",Georgia,serif' }}>thelocaljewel.com</div>
        <p className="text-[12.5px] leading-[1.5]" style={{ color: C.textMute }}>
          The customer journey — lead-gen wizard, savings comparison, and project gallery — all under one custom storefront.
        </p>
      </Card>
    </div>
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
const UseOfFunds = () => {
  const [hover, setHover] = useState(null);
  const total = USE_OF_FUNDS_V2.reduce((s, x) => s + x.amount, 0);
  // 25K reseller / 800 per ring = 31.25 rings (round to 31)
  const rollingRings = Math.floor(25000 / 800);

  return (
    <Section id="use-of-funds" label="Use of Funds" withDivider
      title="$100K, deployed deliberately."
      intro="$25K of this stays as working capital in reseller inventory — not burn — and rotates back into liquid stock as resellers sell.">

      <div className="grid lg:grid-cols-[1.05fr_1.4fr] gap-5">
        {/* Donut */}
        <Card testid="use-of-funds-donut">
          <div style={{ width: '100%', height: 320 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={USE_OF_FUNDS_V2} dataKey="amount" innerRadius={75} outerRadius={120} paddingAngle={2}
                  onMouseEnter={(_, i) => setHover(i)}
                  onMouseLeave={() => setHover(null)}>
                  {USE_OF_FUNDS_V2.map((u, i) => (
                    <Cell key={i} fill={u.color} stroke="none" opacity={hover === null || hover === i ? 1 : 0.45} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 text-center">
            <div className="text-[10.5px] uppercase tracking-[0.16em]" style={{ color: C.textDim }}>Total · ${(total / 1000)}K</div>
          </div>
        </Card>

        {/* 4 line items */}
        <div className="space-y-3">
          {USE_OF_FUNDS_V2.map((u, i) => (
            <UseOfFundsRow
              key={i} idx={i} u={u} hover={hover} setHover={setHover}
              monthly={USE_OF_FUNDS_MONTHLY[u.name]}
              rollingRings={u.name === 'Reseller rolling inventory' ? rollingRings : null}
            />
          ))}
        </div>
      </div>

      {/* Month-wise spend table */}
      <Card className="mt-5" testid="use-of-funds-monthly-table">
        <div className="text-[11.5px] uppercase tracking-[0.12em] mb-3" style={{ color: C.accent }}>Monthly deployment plan</div>
        <div className="overflow-x-auto">
          <table className="w-full text-[12.5px]">
            <thead>
              <tr style={{ borderBottom: '1px solid ' + C.border }}>
                <th className="text-left py-2 px-2 text-[10.5px] uppercase tracking-[0.1em]" style={{ color: C.textDim }}>Bucket</th>
                <th className="text-right py-2 px-2 text-[10.5px] uppercase tracking-[0.1em]" style={{ color: C.textDim }}>M1</th>
                <th className="text-right py-2 px-2 text-[10.5px] uppercase tracking-[0.1em]" style={{ color: C.textDim }}>M2</th>
                <th className="text-right py-2 px-2 text-[10.5px] uppercase tracking-[0.1em]" style={{ color: C.textDim }}>M3</th>
                <th className="text-right py-2 px-2 text-[10.5px] uppercase tracking-[0.1em]" style={{ color: C.textDim }}>M4</th>
                <th className="text-right py-2 px-2 text-[10.5px] uppercase tracking-[0.1em]" style={{ color: C.accent }}>Total</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid ' + C.border }}>
                <td className="py-2.5 px-2 flex items-center gap-2" style={{ color: C.text }}>
                  <span className="w-2 h-2 rounded-sm" style={{ background: '#D4AF37' }} />Paid Ads
                </td>
                <td className="py-2.5 px-2 text-right" style={{ color: C.text }}>$7.8K</td>
                <td className="py-2.5 px-2 text-right" style={{ color: C.text }}>$10.2K</td>
                <td className="py-2.5 px-2 text-right" style={{ color: C.text }}>$12.5K</td>
                <td className="py-2.5 px-2 text-right" style={{ color: C.text }}>$14.5K</td>
                <td className="py-2.5 px-2 text-right font-semibold" style={{ color: C.accent }}>$45K</td>
              </tr>
              <tr style={{ borderBottom: '1px solid ' + C.border }}>
                <td className="py-2.5 px-2 flex items-center gap-2" style={{ color: C.text }}>
                  <span className="w-2 h-2 rounded-sm" style={{ background: '#C58E5A' }} />Reseller rolling inventory
                </td>
                <td className="py-2.5 px-2 text-right" style={{ color: C.text }}>$25K</td>
                <td className="py-2.5 px-2 text-right" style={{ color: C.textDim }}>rolls</td>
                <td className="py-2.5 px-2 text-right" style={{ color: C.textDim }}>rolls</td>
                <td className="py-2.5 px-2 text-right" style={{ color: C.textDim }}>rolls</td>
                <td className="py-2.5 px-2 text-right font-semibold" style={{ color: C.accent }}>$25K</td>
              </tr>
              <tr style={{ borderBottom: '1px solid ' + C.border }}>
                <td className="py-2.5 px-2 flex items-center gap-2" style={{ color: C.text }}>
                  <span className="w-2 h-2 rounded-sm" style={{ background: '#A88F6B' }} />Operations / Employees / AI
                </td>
                <td className="py-2.5 px-2 text-right" style={{ color: C.text }}>$5.0K</td>
                <td className="py-2.5 px-2 text-right" style={{ color: C.text }}>$6.0K</td>
                <td className="py-2.5 px-2 text-right" style={{ color: C.text }}>$7.0K</td>
                <td className="py-2.5 px-2 text-right" style={{ color: C.text }}>$8.0K</td>
                <td className="py-2.5 px-2 text-right font-semibold" style={{ color: C.accent }}>$26K</td>
              </tr>
              <tr style={{ borderBottom: '1px solid ' + C.border }}>
                <td className="py-2.5 px-2 flex items-center gap-2" style={{ color: C.text }}>
                  <span className="w-2 h-2 rounded-sm" style={{ background: '#6B4F33' }} />Buffer
                </td>
                <td className="py-2.5 px-2 text-right" style={{ color: C.textDim }}>—</td>
                <td className="py-2.5 px-2 text-right" style={{ color: C.textDim }}>—</td>
                <td className="py-2.5 px-2 text-right" style={{ color: C.textDim }}>—</td>
                <td className="py-2.5 px-2 text-right" style={{ color: C.textDim }}>reserve</td>
                <td className="py-2.5 px-2 text-right font-semibold" style={{ color: C.accent }}>$10K</td>
              </tr>
              <tr>
                <td className="py-2.5 px-2 font-semibold" style={{ color: C.text }}>Total deployed (M1-M4)</td>
                <td className="py-2.5 px-2 text-right font-semibold" style={{ color: C.text }}>$37.8K</td>
                <td className="py-2.5 px-2 text-right font-semibold" style={{ color: C.text }}>$16.2K</td>
                <td className="py-2.5 px-2 text-right font-semibold" style={{ color: C.text }}>$19.5K</td>
                <td className="py-2.5 px-2 text-right font-semibold" style={{ color: C.text }}>$32.5K</td>
                <td className="py-2.5 px-2 text-right font-semibold" style={{ color: C.accent, fontSize: 14, fontFamily: '"Cormorant Garamond","Playfair Display",Georgia,serif' }}>$106K*</td>
              </tr>
            </tbody>
          </table>
          <div className="text-[10.5px] mt-2" style={{ color: C.textDim }}>* M1 includes the full $25K reseller-inventory load that recycles across months. Buffer ($10K) sits in reserve.</div>
        </div>
      </Card>
    </Section>
  );
};

// Individual hover-aware row for the use-of-funds breakdown
const UseOfFundsRow = ({ idx, u, hover, setHover, monthly, rollingRings }) => {
  const isHover = hover === idx;
  return (
    <div
      data-testid={'use-of-funds-row-' + idx}
      onMouseEnter={() => setHover(idx)}
      onMouseLeave={() => setHover(null)}
      className="relative rounded-[14px] p-4 transition-all duration-200 cursor-default"
      style={{
        background: C.surface,
        border: '1px solid ' + (isHover ? u.color : C.border),
        boxShadow: isHover ? '0 8px 24px ' + u.color + '22' : 'none',
      }}
    >
      <div className="flex items-baseline justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: u.color }} />
          <span className="text-[13.5px] font-semibold" style={{ color: C.text }}>{u.name}</span>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-[20px] font-semibold leading-none" style={{ color: u.color, fontFamily: '"Cormorant Garamond","Playfair Display",Georgia,serif' }}>${(u.amount / 1000)}K</div>
          <div className="text-[10.5px] mt-1" style={{ color: C.textDim }}>{u.pct}%</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(244,236,221,0.06)' }}>
        <div className="h-full transition-all duration-500" style={{ width: u.pct + '%', background: 'linear-gradient(90deg,' + u.color + 'DD,' + u.color + ')' }} />
      </div>

      <p className="text-[11.5px] leading-[1.45] mt-2.5" style={{ color: C.textMute }}>{u.detail}</p>

      {/* Hover reveal — shown inline (no overlay, predictable on mobile) */}
      {isHover && (monthly || rollingRings != null) && (
        <div className="mt-3 pt-3" style={{ borderTop: '1px solid ' + C.border }}>
          {monthly && (
            <>
              <div className="text-[10.5px] uppercase tracking-[0.12em] mb-1.5" style={{ color: u.color }}>Monthly breakdown</div>
              <div className="grid grid-cols-4 gap-2">
                {monthly.map((m) => (
                  <div key={m.m} className="text-center rounded-[8px] py-2 px-1" style={{ background: C.bgAlt, border: '1px solid ' + C.border }}>
                    <div className="text-[10.5px] uppercase tracking-[0.1em]" style={{ color: C.textDim }}>{m.m}</div>
                    <div className="text-[13px] font-semibold mt-0.5" style={{ color: C.text }}>${(m.v / 1000).toFixed(1)}K</div>
                  </div>
                ))}
              </div>
            </>
          )}
          {rollingRings != null && (
            <>
              <div className="text-[10.5px] uppercase tracking-[0.12em] mb-1.5" style={{ color: u.color }}>How the math works</div>
              <div className="rounded-[10px] p-3 text-[12.5px] leading-[1.5]" style={{ background: C.bgAlt, border: '1px solid ' + C.border, color: C.text }}>
                <div className="flex items-center justify-between"><span style={{ color: C.textMute }}>Inventory budget</span><span>$25,000</span></div>
                <div className="flex items-center justify-between"><span style={{ color: C.textMute }}>÷ Cost per ring</span><span>$800</span></div>
                <div className="flex items-center justify-between mt-1.5 pt-1.5" style={{ borderTop: '1px solid ' + C.border }}>
                  <span style={{ color: u.color, fontWeight: 600 }}>Rolling rings in circulation</span>
                  <span style={{ color: u.color, fontSize: 18, fontWeight: 600, fontFamily: '"Cormorant Garamond","Playfair Display",Georgia,serif' }}>{rollingRings} rings</span>
                </div>
                <div className="text-[11px] mt-1.5" style={{ color: C.textDim }}>
                  Distributed across 4 resellers ({Math.floor(rollingRings / 4)}-{Math.ceil(rollingRings / 4)} rings each). As each ring sells, the cash recycles to fund the next.
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

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
        <p className="text-[17px] sm:text-[19px] leading-[1.55] max-w-3xl mb-5" style={{ color: C.text }}>
          <strong>$100K for 7.69% equity</strong> at a <strong>$1.2M pre-money</strong> valuation. The business is already profitable — this capital is to compound an existing engine, not to find one.
        </p>

        {/* Deal terms strip */}
        <div className="grid sm:grid-cols-4 gap-3 mb-6">
          <div className="rounded-[12px] p-3.5" style={{ background: 'rgba(212,175,55,0.10)', border: '1px solid rgba(212,175,55,0.28)' }}>
            <div className="text-[10.5px] uppercase tracking-[0.12em]" style={{ color: C.accent }}>Investment</div>
            <div className="text-[22px] font-semibold mt-1 tracking-[-0.01em]" style={{ color: C.accent, fontFamily: '"Cormorant Garamond","Playfair Display",Georgia,serif' }}>$100K</div>
          </div>
          <div className="rounded-[12px] p-3.5" style={{ background: C.bgAlt, border: '1px solid ' + C.border }}>
            <div className="text-[10.5px] uppercase tracking-[0.12em]" style={{ color: C.textMute }}>Pre-money</div>
            <div className="text-[22px] font-semibold mt-1 tracking-[-0.01em]" style={{ color: C.text, fontFamily: '"Cormorant Garamond","Playfair Display",Georgia,serif' }}>$1.2M</div>
          </div>
          <div className="rounded-[12px] p-3.5" style={{ background: C.bgAlt, border: '1px solid ' + C.border }}>
            <div className="text-[10.5px] uppercase tracking-[0.12em]" style={{ color: C.textMute }}>Ownership</div>
            <div className="text-[22px] font-semibold mt-1 tracking-[-0.01em]" style={{ color: C.text, fontFamily: '"Cormorant Garamond","Playfair Display",Georgia,serif' }}>7.69%</div>
          </div>
          <div className="rounded-[12px] p-3.5" style={{ background: 'rgba(123,196,168,0.10)', border: '1px solid rgba(123,196,168,0.28)' }}>
            <div className="text-[10.5px] uppercase tracking-[0.12em]" style={{ color: C.accent2 }}>Returns</div>
            <div className="text-[15px] font-semibold mt-1 leading-tight" style={{ color: C.accent2 }}>Monthly profit share<br/>+ growing equity</div>
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-3 mb-7">
          {[
            { icon: Award, t: 'Profitable today', s: '$250K FY · 70.9% GM' },
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
   FOUR-MONTH RAMP
   ───────────────────────────────────────────────────────── */
const FourMonthRamp = () => (
  <Section id="ramp" label="The 4-Month Plan" withDivider
    title="From 6 rings/month to 100, in four months."
    intro="The month-by-month plan backing the run-rate. Sales mix on the left, ad spend in the middle, and the resulting revenue / gross margin / contribution on the right.">

    {/* THREE SIDE-BY-SIDE TABLES */}
    <div className="grid lg:grid-cols-3 gap-4 mb-5">
      {/* Sales table */}
      <Card testid="ramp-sales-table">
        <div className="text-[11.5px] uppercase tracking-[0.12em] mb-3" style={{ color: C.accent }}>Rings sold (by channel)</div>
        <div className="overflow-x-auto -mx-2">
          <table className="w-full text-[12px]">
            <thead>
              <tr style={{ borderBottom: '1px solid ' + C.border }}>
                <th className="text-left py-2 px-2 text-[10px] uppercase tracking-[0.1em]" style={{ color: C.textDim }}></th>
                {RAMP_DATA.map(r => <th key={r.m} className="text-right py-2 px-1 text-[10px] uppercase tracking-[0.1em]" style={{ color: C.textDim }}>{r.m}</th>)}
              </tr>
            </thead>
            <tbody>
              {[
                ['Etsy', 'etsy'], ['Web (Meta/TT/Google)', 'web'], ['Resellers', 'resellers'], ['eBay', 'ebay'], ['Referrals', 'referrals'],
              ].map(([label, key]) => (
                <tr key={key} style={{ borderBottom: '1px solid ' + C.border }}>
                  <td className="py-2 px-2" style={{ color: C.textMute }}>{label}</td>
                  {RAMP_DATA.map(r => <td key={r.m} className="py-2 px-1 text-right" style={{ color: C.text }}>{r[key]}</td>)}
                </tr>
              ))}
              <tr>
                <td className="py-2.5 px-2 font-semibold" style={{ color: C.accent }}>Total rings</td>
                {RAMP_DATA.map(r => <td key={r.m} className="py-2.5 px-1 text-right font-semibold" style={{ color: C.accent }}>{r.rings}</td>)}
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      {/* Ad spend table */}
      <Card testid="ramp-spend-table">
        <div className="text-[11.5px] uppercase tracking-[0.12em] mb-3" style={{ color: C.accent }}>Ad spend (by channel)</div>
        <div className="overflow-x-auto -mx-2">
          <table className="w-full text-[12px]">
            <thead>
              <tr style={{ borderBottom: '1px solid ' + C.border }}>
                <th className="text-left py-2 px-2 text-[10px] uppercase tracking-[0.1em]" style={{ color: C.textDim }}></th>
                {RAMP_DATA.map(r => <th key={r.m} className="text-right py-2 px-1 text-[10px] uppercase tracking-[0.1em]" style={{ color: C.textDim }}>{r.m}</th>)}
              </tr>
            </thead>
            <tbody>
              {[
                ['Etsy',   [3000, 3000, 3000, 3000]],
                ['Meta',   [1500, 2500, 3500, 4500]],
                ['TikTok', [1500, 2000, 2500, 3000]],
                ['Google', [900, 1500, 2000, 2500]],
                ['eBay',   [900, 1200, 1500, 1500]],
              ].map(([label, vals]) => (
                <tr key={label} style={{ borderBottom: '1px solid ' + C.border }}>
                  <td className="py-2 px-2" style={{ color: C.textMute }}>{label}</td>
                  {vals.map((v, i) => <td key={i} className="py-2 px-1 text-right" style={{ color: C.text }}>${(v / 1000).toFixed(1)}k</td>)}
                </tr>
              ))}
              <tr>
                <td className="py-2.5 px-2 font-semibold" style={{ color: C.accent }}>Total</td>
                {RAMP_DATA.map(r => <td key={r.m} className="py-2.5 px-1 text-right font-semibold" style={{ color: C.accent }}>${(r.adSpend / 1000).toFixed(1)}k</td>)}
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      {/* Revenue / GM / Contribution */}
      <Card testid="ramp-financials-table">
        <div className="text-[11.5px] uppercase tracking-[0.12em] mb-3" style={{ color: C.accent }}>Revenue · GM · Contribution</div>
        <div className="overflow-x-auto -mx-2">
          <table className="w-full text-[12px]">
            <thead>
              <tr style={{ borderBottom: '1px solid ' + C.border }}>
                <th className="text-left py-2 px-2 text-[10px] uppercase tracking-[0.1em]" style={{ color: C.textDim }}></th>
                {RAMP_DATA.map(r => <th key={r.m} className="text-right py-2 px-1 text-[10px] uppercase tracking-[0.1em]" style={{ color: C.textDim }}>{r.m}</th>)}
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid ' + C.border }}>
                <td className="py-2 px-2" style={{ color: C.textMute }}>Revenue</td>
                {RAMP_DATA.map(r => <td key={r.m} className="py-2 px-1 text-right" style={{ color: C.text }}>${(r.revenue / 1000).toFixed(0)}k</td>)}
              </tr>
              <tr style={{ borderBottom: '1px solid ' + C.border }}>
                <td className="py-2 px-2" style={{ color: C.textMute }}>Gross margin</td>
                {RAMP_DATA.map(r => <td key={r.m} className="py-2 px-1 text-right" style={{ color: C.accent2 }}>${(r.gm / 1000).toFixed(1)}k</td>)}
              </tr>
              <tr style={{ borderBottom: '1px solid ' + C.border }}>
                <td className="py-2 px-2" style={{ color: C.textMute }}>− Ads</td>
                {RAMP_DATA.map(r => <td key={r.m} className="py-2 px-1 text-right" style={{ color: C.textDim }}>${(r.adSpend / 1000).toFixed(1)}k</td>)}
              </tr>
              <tr style={{ borderBottom: '1px solid ' + C.border }}>
                <td className="py-2 px-2" style={{ color: C.textMute }}>− Ops</td>
                {RAMP_DATA.map(r => <td key={r.m} className="py-2 px-1 text-right" style={{ color: C.textDim }}>${(r.opsSpend / 1000).toFixed(1)}k</td>)}
              </tr>
              <tr>
                <td className="py-2.5 px-2 font-semibold" style={{ color: C.accent }}>Net contribution</td>
                {RAMP_DATA.map(r => <td key={r.m} className="py-2.5 px-1 text-right font-semibold" style={{ color: C.accent }}>${(r.contribution / 1000).toFixed(1)}k</td>)}
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>

    {/* Visuals — GM vs Contribution */}
    <div className="grid lg:grid-cols-2 gap-5 mb-5">
      <Card testid="ramp-chart-rings">
        <div className="text-[14px] font-semibold mb-2" style={{ color: C.text }}>Rings sold by channel</div>
        <div style={{ width: '100%', height: 260 }}>
          <ResponsiveContainer>
            <BarChart data={RAMP_DATA} margin={{ top: 6, right: 6, bottom: 0, left: -16 }}>
              <CartesianGrid strokeDasharray="3 4" stroke={C.border} vertical={false} />
              <XAxis dataKey="m" stroke={C.textMute} tick={{ fontSize: 11 }} />
              <YAxis stroke={C.textMute} tick={{ fontSize: 11 }} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(212,175,55,0.06)' }} />
              <Legend wrapperStyle={{ fontSize: 11, color: C.textMute, paddingTop: 6 }} />
              <Bar dataKey="etsy" stackId="r" name="Etsy" fill="#D4AF37" />
              <Bar dataKey="web" stackId="r" name="Web" fill="#7BC4A8" />
              <Bar dataKey="resellers" stackId="r" name="Resellers" fill="#C58E5A" />
              <Bar dataKey="ebay" stackId="r" name="eBay" fill="#A88FC9" />
              <Bar dataKey="referrals" stackId="r" name="Referrals" fill="#6B95A8" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card testid="ramp-chart-contribution">
        <div className="text-[14px] font-semibold mb-2" style={{ color: C.text }}>Gross margin vs net contribution</div>
        <div style={{ width: '100%', height: 260 }}>
          <ResponsiveContainer>
            <BarChart data={RAMP_DATA} margin={{ top: 6, right: 6, bottom: 0, left: -8 }}>
              <CartesianGrid strokeDasharray="3 4" stroke={C.border} vertical={false} />
              <XAxis dataKey="m" stroke={C.textMute} tick={{ fontSize: 11 }} />
              <YAxis stroke={C.textMute} tick={{ fontSize: 11 }} tickFormatter={(v) => '$' + Math.round(v / 1000) + 'k'} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(212,175,55,0.06)' }} />
              <Legend wrapperStyle={{ fontSize: 11, color: C.textMute, paddingTop: 6 }} />
              <Bar dataKey="contribution" name="Net contribution" stackId="a" fill={C.accent} />
              <Bar dataKey="totalSpend" name="Cost (ads + ops)" stackId="a" fill="#6B95A8" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>

    {/* 4-month totals */}
    <Card>
      <div className="text-[11.5px] uppercase tracking-[0.12em] mb-3" style={{ color: C.accent }}>4-month deployment totals</div>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Stat value="265" label="Rings shipped" accent />
        <Stat value="$424K" label="Revenue" />
        <Stat value="$185.5K" label="Gross margin" />
        <Stat value="$114.5K" label="Net contribution" sub="GM − ads − ops" />
        <Stat value="$45K" label="Ad budget" sub="$7.8k M1 → $14.5k M4" />
      </div>
      <div className="mt-4 rounded-[12px] p-4 flex items-center gap-3" style={{ background: 'rgba(123,196,168,0.08)', border: '1px solid rgba(123,196,168,0.25)' }}>
        <Box size={15} style={{ color: C.accent2 }} />
        <span className="text-[13px] leading-[1.5]" style={{ color: C.text }}>
          Plus <strong>$20-25K rolling reseller inventory</strong> — working capital, not burn. Stays in the business as funded stock across 4 active resellers.
        </span>
      </div>
    </Card>
  </Section>
);

/* ─────────────────────────────────────────────────────────
   THREE-YEAR PROJECTION
   ───────────────────────────────────────────────────────── */
const fmtM = (n) => '$' + (n / 1000000).toFixed(2) + 'M';
const fmtK = (n) => '$' + Math.round(n / 1000) + 'K';
const ThreeYearProjection = () => (
  <Section id="projection" label="3-Year Outlook" withDivider
    title="Engagement rings are the wedge. Jewelry expansion compounds the LTV."
    intro="Engagement rings are the customer-acquisition wedge. Wedding bands, anniversary jewelry, studs, and tennis bracelets unlock real lifetime value — and the reseller network becomes a recurring distribution channel.">
    <Card testid="projection-chart">
      <div style={{ width: '100%', height: 320 }}>
        <ResponsiveContainer>
          <BarChart data={THREE_YEAR} margin={{ top: 6, right: 6, bottom: 0, left: -8 }}>
            <CartesianGrid strokeDasharray="3 4" stroke={C.border} vertical={false} />
            <XAxis dataKey="y" stroke={C.textMute} tick={{ fontSize: 12 }} />
            <YAxis stroke={C.textMute} tick={{ fontSize: 11 }} tickFormatter={(v) => '$' + (v / 1000000).toFixed(1) + 'M'} />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(212,175,55,0.06)' }} />
            <Legend wrapperStyle={{ fontSize: 12, color: C.textMute, paddingTop: 6 }} />
            <Bar dataKey="ringRev" stackId="t" name="Engagement-ring revenue" fill="#D4AF37" />
            <Bar dataKey="jewelryRev" stackId="t" name="Jewelry expansion" fill="#7BC4A8" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>

    {/* Per-year bubble cards */}
    <div className="mt-5 grid lg:grid-cols-3 gap-3">
      {THREE_YEAR.map((y, i) => (
        <Card key={i}>
          <div className="flex items-baseline justify-between mb-3">
            <span className="text-[12px] uppercase tracking-[0.14em]" style={{ color: C.accent }}>{y.y}</span>
            <span className="text-[11px]" style={{ color: C.textDim }}>{y.rings.toLocaleString()} rings</span>
          </div>
          <div className="text-[32px] font-semibold tracking-[-0.01em] leading-none" style={{ color: C.text, fontFamily: '"Cormorant Garamond","Playfair Display",Georgia,serif' }}>
            {fmtM(y.total)}
          </div>
          <div className="text-[12px] mb-3" style={{ color: C.textMute }}>Total revenue</div>
          <div className="grid grid-cols-2 gap-2 text-[12.5px]">
            <div>
              <div className="text-[10.5px] uppercase tracking-[0.1em]" style={{ color: C.textDim }}>Ring rev</div>
              <div style={{ color: C.text }}>{fmtM(y.ringRev)}</div>
            </div>
            <div>
              <div className="text-[10.5px] uppercase tracking-[0.1em]" style={{ color: C.textDim }}>Jewelry</div>
              <div style={{ color: C.accent2 }}>{y.jewelryRev >= 1000000 ? fmtM(y.jewelryRev) : fmtK(y.jewelryRev)}</div>
            </div>
            <div>
              <div className="text-[10.5px] uppercase tracking-[0.1em]" style={{ color: C.textDim }}>GM</div>
              <div style={{ color: C.accent }}>{fmtM(y.gm)}</div>
            </div>
            <div>
              <div className="text-[10.5px] uppercase tracking-[0.1em]" style={{ color: C.textDim }}>Op. contrib</div>
              <div style={{ color: C.accent }}>{fmtM(y.opContrib)}</div>
            </div>
          </div>
        </Card>
      ))}
    </div>

    {/* Full table */}
    <Card className="mt-5" testid="projection-table">
      <div className="text-[11.5px] uppercase tracking-[0.12em] mb-3" style={{ color: C.accent }}>Three-year financial summary</div>
      <div className="overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead>
            <tr style={{ borderBottom: '1px solid ' + C.border }}>
              <th className="text-left py-2 px-2 text-[10.5px] uppercase tracking-[0.1em]" style={{ color: C.textDim }}>Year</th>
              <th className="text-right py-2 px-2 text-[10.5px] uppercase tracking-[0.1em]" style={{ color: C.textDim }}>Rings</th>
              <th className="text-right py-2 px-2 text-[10.5px] uppercase tracking-[0.1em]" style={{ color: C.textDim }}>Ring revenue</th>
              <th className="text-right py-2 px-2 text-[10.5px] uppercase tracking-[0.1em]" style={{ color: C.textDim }}>Expansion revenue</th>
              <th className="text-right py-2 px-2 text-[10.5px] uppercase tracking-[0.1em]" style={{ color: C.textDim }}>Total revenue</th>
              <th className="text-right py-2 px-2 text-[10.5px] uppercase tracking-[0.1em]" style={{ color: C.textDim }}>Gross margin</th>
              <th className="text-right py-2 px-2 text-[10.5px] uppercase tracking-[0.1em]" style={{ color: C.textDim }}>Op. contribution</th>
            </tr>
          </thead>
          <tbody>
            {THREE_YEAR.map((y) => (
              <tr key={y.y} style={{ borderBottom: '1px solid ' + C.border }}>
                <td className="py-3 px-2 font-semibold" style={{ color: C.accent }}>{y.y}</td>
                <td className="py-3 px-2 text-right" style={{ color: C.text }}>{y.rings.toLocaleString()}</td>
                <td className="py-3 px-2 text-right" style={{ color: C.text }}>{fmtM(y.ringRev)}</td>
                <td className="py-3 px-2 text-right" style={{ color: C.text }}>{y.jewelryRev >= 1000000 ? fmtM(y.jewelryRev) : fmtK(y.jewelryRev)}</td>
                <td className="py-3 px-2 text-right font-semibold" style={{ color: C.text }}>{fmtM(y.total)}</td>
                <td className="py-3 px-2 text-right" style={{ color: C.accent2 }}>{fmtM(y.gm)}</td>
                <td className="py-3 px-2 text-right font-semibold" style={{ color: C.accent }}>{fmtM(y.opContrib)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>

    <div className="mt-5 px-5 py-4 rounded-[14px] flex items-center gap-3"
      style={{ background: 'rgba(123,196,168,0.08)', border: '1px solid rgba(123,196,168,0.25)' }}>
      <TrendingUp size={16} style={{ color: C.accent2 }} />
      <span className="text-[13.5px] leading-[1.5]" style={{ color: C.text }}>
        From <strong>$1.75M</strong> in Year 1 to <strong>$5.60M</strong> in Year 3 — a <strong>3.2×</strong> revenue compound with the same founder, same model, expanded SKUs.
      </span>
    </div>
  </Section>
);

/* ─────────────────────────────────────────────────────────
   LIFETIME VALUE
   ───────────────────────────────────────────────────────── */
const CUSTOMER_LTV = [
  { type: 'Engagement Ring',                 rev: 1600, gm: 700,  note: 'First purchase' },
  { type: 'Wedding Bands (couple)',          rev: 1000, gm: 450,  note: '3-12 mo later' },
  { type: 'Future Jewelry (1-2 items)',      rev: 1200, gm: 480,  note: 'Gifting / occasions' },
  { type: 'Anniversary Jewelry',             rev: 2000, gm: 800,  note: 'Year 3+' },
  { type: 'Referral (new customer / 2 yrs)', rev: 1800, gm: 720,  note: 'Word-of-mouth' },
];
const CUSTOMER_LTV_TOTAL = CUSTOMER_LTV.reduce((s, x) => ({ rev: s.rev + x.rev, gm: s.gm + x.gm }), { rev: 0, gm: 0 });

const LifetimeValue = () => (
  <Section id="ltv" label="Lifetime Value" withDivider
    title="The first ring is just the start of the customer relationship."
    intro="Customers come for the engagement ring — they come back for the wedding bands, the anniversary, the gifts. The reseller network compounds the same effect with funded inventory.">

    {/* Two-column: Customer LTV (left) · Reseller LTV (right) */}
    <div className="grid lg:grid-cols-2 gap-5">
      {/* Customer LTV */}
      <Card testid="ltv-customer">
        <div className="flex items-center gap-2 mb-3">
          <Users size={15} style={{ color: C.accent }} />
          <span className="text-[12px] font-semibold uppercase tracking-[0.14em]" style={{ color: C.accent }}>Customer LTV</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[12.5px]">
            <thead>
              <tr style={{ borderBottom: '1px solid ' + C.border }}>
                <th className="text-left py-2 px-1.5 text-[10px] uppercase tracking-[0.1em]" style={{ color: C.textDim }}>Purchase</th>
                <th className="text-right py-2 px-1.5 text-[10px] uppercase tracking-[0.1em]" style={{ color: C.textDim }}>Revenue</th>
                <th className="text-right py-2 px-1.5 text-[10px] uppercase tracking-[0.1em]" style={{ color: C.textDim }}>GM</th>
              </tr>
            </thead>
            <tbody>
              {CUSTOMER_LTV.map((row, i) => (
                <tr key={i} style={{ borderBottom: '1px solid ' + C.border }}>
                  <td className="py-2 px-1.5">
                    <div style={{ color: C.text }}>{row.type}</div>
                    <div className="text-[10.5px]" style={{ color: C.textDim }}>{row.note}</div>
                  </td>
                  <td className="py-2 px-1.5 text-right" style={{ color: C.text }}>${row.rev.toLocaleString()}</td>
                  <td className="py-2 px-1.5 text-right" style={{ color: C.accent2 }}>${row.gm.toLocaleString()}</td>
                </tr>
              ))}
              <tr>
                <td className="py-2.5 px-1.5 font-semibold" style={{ color: C.accent }}>Total LTV</td>
                <td className="py-2.5 px-1.5 text-right font-semibold" style={{ color: C.accent }}>${CUSTOMER_LTV_TOTAL.rev.toLocaleString()}</td>
                <td className="py-2.5 px-1.5 text-right font-semibold" style={{ color: C.accent }}>${CUSTOMER_LTV_TOTAL.gm.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="mt-4 rounded-[12px] p-3.5" style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.25)' }}>
          <div className="text-[11px] uppercase tracking-[0.12em] mb-1" style={{ color: C.accent }}>Base case (ring + 1-2 follow-ups)</div>
          <div className="text-[13.5px]" style={{ color: C.text }}>
            ~<strong>$2,800</strong> revenue · ~<strong>$1,326</strong> gross margin per customer.
          </div>
        </div>
      </Card>

      {/* Reseller LTV */}
      <Card testid="ltv-reseller">
        <div className="flex items-center gap-2 mb-3">
          <Box size={15} style={{ color: C.accent2 }} />
          <span className="text-[12px] font-semibold uppercase tracking-[0.14em]" style={{ color: C.accent2 }}>Reseller LTV</span>
        </div>
        <div className="space-y-2.5">
          {[
            ['Sales per reseller / month', '2'],
            ['Active duration', '18 months'],
            ['Total customers acquired', '36'],
            ['GM per customer (base)', '$1,326'],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between text-[13px]" style={{ borderBottom: '1px solid ' + C.border, paddingBottom: 8 }}>
              <span style={{ color: C.textMute }}>{k}</span>
              <span style={{ color: C.text }}>{v}</span>
            </div>
          ))}
          <div className="rounded-[12px] p-4 mt-2" style={{ background: 'rgba(123,196,168,0.10)', border: '1px solid rgba(123,196,168,0.3)' }}>
            <div className="text-[11px] uppercase tracking-[0.12em] mb-1" style={{ color: C.accent2 }}>LTV per reseller</div>
            <div className="text-[28px] font-semibold tracking-[-0.01em]" style={{ color: C.accent2, fontFamily: '"Cormorant Garamond","Playfair Display",Georgia,serif' }}>$47,736</div>
            <div className="text-[11.5px] mt-1" style={{ color: C.textMute }}>36 customers × $1,326 GM each</div>
          </div>
        </div>

        {/* Network effect */}
        <div className="mt-5">
          <div className="text-[11px] uppercase tracking-[0.12em] mb-2" style={{ color: C.accent }}>Network effect</div>
          <div className="grid grid-cols-2 gap-2.5">
            <div className="rounded-[12px] p-3.5" style={{ background: C.bgAlt, border: '1px solid ' + C.border }}>
              <div className="text-[11px]" style={{ color: C.textMute }}>20 resellers</div>
              <div className="text-[20px] font-semibold mt-0.5" style={{ color: C.text, fontFamily: '"Cormorant Garamond","Playfair Display",Georgia,serif' }}>$954,720</div>
              <div className="text-[10.5px] mt-0.5" style={{ color: C.textDim }}>Total GM</div>
            </div>
            <div className="rounded-[12px] p-3.5" style={{ background: 'rgba(212,175,55,0.10)', border: '1px solid rgba(212,175,55,0.3)' }}>
              <div className="text-[11px]" style={{ color: C.accent }}>40 resellers</div>
              <div className="text-[20px] font-semibold mt-0.5" style={{ color: C.accent, fontFamily: '"Cormorant Garamond","Playfair Display",Georgia,serif' }}>$1.91M</div>
              <div className="text-[10.5px] mt-0.5" style={{ color: C.textDim }}>Total GM</div>
            </div>
          </div>
        </div>
      </Card>
    </div>

    <div className="mt-5 px-5 py-4 rounded-[14px] flex items-center gap-3"
      style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.25)' }}>
      <Lightbulb size={16} style={{ color: C.accent }} />
      <span className="text-[13.5px] leading-[1.5]" style={{ color: C.text }}>
        Every reseller funded with $800 of inventory returns <strong>~$47,736 in lifetime gross margin</strong>. The $25K reseller-inventory line in the Use of Funds isn't a cost — it's seed capital for a recurring network.
      </span>
    </div>
  </Section>
);

/* ─────────────────────────────────────────────────────────
   INVESTOR RETURNS FRAMING
   $100K at $1.2M pre-money → 100 / (1200 + 100) = 7.69% ownership.
   Returns to investor have TWO components:
     1) Monthly income — 7.69% of operating contribution, distributed monthly
     2) Capital appreciation — 7.69% of the company's growing valuation
   ───────────────────────────────────────────────────────── */
const OWNERSHIP_PCT = 0.0769;        // 7.69%
const INVESTMENT = 100000;            // $100K

// Per-year investor income calculations (7.69% of operating contribution)
const INCOME_YEARS = THREE_YEAR.map((y) => {
  const annual = Math.round(y.opContrib * OWNERSHIP_PCT);
  const monthly = Math.round(annual / 12);
  return { year: y.y, opContrib: y.opContrib, annual, monthly };
});
const TOTAL_3YR_INCOME = INCOME_YEARS.reduce((s, x) => s + x.annual, 0);

const InvestorReturns = () => {
  const finalEquityValue = Math.round(5000000 * OWNERSHIP_PCT); // illustrative @ $5M valuation
  const totalReturn = TOTAL_3YR_INCOME + finalEquityValue;
  const totalMultiple = (totalReturn / INVESTMENT).toFixed(2);

  return (
    <Section id="returns" label="Investor Returns" withDivider
      title="$100K at a $1.2M valuation = 7.69% ownership."
      intro="Returns come from two places: a monthly share of operating profit (think of it like recurring income) and the growing value of the equity stake itself.">

      {/* Headline stats */}
      <Card className="mb-5">
        <div className="grid sm:grid-cols-4 gap-3">
          <Stat value="$100K" label="Investment" accent />
          <Stat value="$1.2M" label="Pre-money valuation" />
          <Stat value="7.69%" label="Investor ownership" sub="100 / (1,200 + 100)" />
          <Stat value="Equity" label="Instrument" sub="Income + appreciation" />
        </div>
      </Card>

      {/* Two-pillar layout: monthly income + valuation growth */}
      <div className="grid lg:grid-cols-2 gap-5">

        {/* Pillar 1: Monthly Income */}
        <Card testid="investor-monthly-income">
          <div className="flex items-center gap-2 mb-2">
            <Banknote size={16} style={{ color: C.accent2 }} />
            <div className="text-[11.5px] uppercase tracking-[0.14em]" style={{ color: C.accent2 }}>1. Monthly Income</div>
          </div>
          <div className="text-[18px] font-semibold leading-[1.3] mb-1" style={{ color: C.text, fontFamily: '"Cormorant Garamond","Playfair Display",Georgia,serif' }}>
            7.69% of operating profit, distributed monthly.
          </div>
          <p className="text-[12.5px] leading-[1.55] mb-4" style={{ color: C.textMute }}>
            As soon as the business is operating-profitable each month, the investor receives <strong>7.69% of that month's operating contribution</strong> — pro-rata, in cash. This is recurring income, not deferred to an exit.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr style={{ borderBottom: '1px solid ' + C.border }}>
                  <th className="text-left py-2 px-2 text-[10.5px] uppercase tracking-[0.12em]" style={{ color: C.textDim }}>Year</th>
                  <th className="text-right py-2 px-2 text-[10.5px] uppercase tracking-[0.12em]" style={{ color: C.textDim }}>Op. profit</th>
                  <th className="text-right py-2 px-2 text-[10.5px] uppercase tracking-[0.12em]" style={{ color: C.textDim }}>Investor / mo</th>
                  <th className="text-right py-2 px-2 text-[10.5px] uppercase tracking-[0.12em]" style={{ color: C.accent2 }}>Investor / yr</th>
                </tr>
              </thead>
              <tbody>
                {INCOME_YEARS.map((y, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid ' + C.border }}>
                    <td className="py-2.5 px-2 font-semibold" style={{ color: C.text }}>{y.year}</td>
                    <td className="py-2.5 px-2 text-right" style={{ color: C.textMute }}>${(y.opContrib / 1000).toFixed(0)}K</td>
                    <td className="py-2.5 px-2 text-right font-semibold" style={{ color: C.text }}>${y.monthly.toLocaleString()}</td>
                    <td className="py-2.5 px-2 text-right font-semibold" style={{ color: C.accent2, fontFamily: '"Cormorant Garamond","Playfair Display",Georgia,serif', fontSize: 16 }}>${y.annual.toLocaleString()}</td>
                  </tr>
                ))}
                <tr>
                  <td className="py-2.5 px-2 font-semibold" style={{ color: C.text }}>3-yr total</td>
                  <td className="py-2.5 px-2 text-right" style={{ color: C.textDim }}>—</td>
                  <td className="py-2.5 px-2 text-right" style={{ color: C.textDim }}>—</td>
                  <td className="py-2.5 px-2 text-right font-semibold" style={{ color: C.accent2, fontSize: 18, fontFamily: '"Cormorant Garamond","Playfair Display",Georgia,serif' }}>${TOTAL_3YR_INCOME.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-4 rounded-[12px] p-3.5" style={{ background: 'rgba(123,196,168,0.10)', border: '1px solid rgba(123,196,168,0.3)' }}>
            <div className="text-[11px] uppercase tracking-[0.12em] mb-1" style={{ color: C.accent2 }}>Year-3 monthly run-rate</div>
            <div className="text-[26px] font-semibold tracking-[-0.01em] leading-none" style={{ color: C.accent2, fontFamily: '"Cormorant Garamond","Playfair Display",Georgia,serif' }}>
              ${INCOME_YEARS[2].monthly.toLocaleString()}<span className="text-[14px] font-normal" style={{ color: C.textMute }}> / month</span>
            </div>
            <div className="text-[11.5px] mt-1" style={{ color: C.textMute }}>7.69% of Y3 op-contribution (${(INCOME_YEARS[2].opContrib / 1000000).toFixed(2)}M) — paid out monthly.</div>
          </div>
        </Card>

        {/* Pillar 2: Growing Valuation */}
        <Card testid="investor-valuation-growth">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={16} style={{ color: C.accent }} />
            <div className="text-[11.5px] uppercase tracking-[0.14em]" style={{ color: C.accent }}>2. Growing Valuation</div>
          </div>
          <div className="text-[18px] font-semibold leading-[1.3] mb-1" style={{ color: C.text, fontFamily: '"Cormorant Garamond","Playfair Display",Georgia,serif' }}>
            The 7.69% stake grows with the company.
          </div>
          <p className="text-[12.5px] leading-[1.55] mb-4" style={{ color: C.textMute }}>
            On top of the monthly income, the equity itself appreciates. Here's what the 7.69% stake is worth at common DTC valuation outcomes.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr style={{ borderBottom: '1px solid ' + C.border }}>
                  <th className="text-left py-2 px-2 text-[10.5px] uppercase tracking-[0.12em]" style={{ color: C.textDim }}>TLJ valued at</th>
                  <th className="text-right py-2 px-2 text-[10.5px] uppercase tracking-[0.12em]" style={{ color: C.textDim }}>Stake worth</th>
                  <th className="text-right py-2 px-2 text-[10.5px] uppercase tracking-[0.12em]" style={{ color: C.accent }}>Multiple</th>
                </tr>
              </thead>
              <tbody>
                {RETURN_SCENARIOS.map((s, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid ' + C.border }}>
                    <td className="py-2.5 px-2" style={{ color: C.text }}>${(s.fcv / 1000000).toFixed(0)}M</td>
                    <td className="py-2.5 px-2 text-right font-semibold" style={{ color: C.text }}>${s.stake.toLocaleString()}</td>
                    <td className="py-2.5 px-2 text-right font-semibold" style={{ color: s.mult >= 3 ? C.accent : C.text, fontFamily: '"Cormorant Garamond","Playfair Display",Georgia,serif', fontSize: 16 }}>{s.mult.toFixed(2)}×</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2.5">
            <div className="rounded-[12px] p-3" style={{ background: C.bgAlt, border: '1px solid ' + C.border }}>
              <div className="text-[10.5px] uppercase tracking-[0.12em] mb-0.5" style={{ color: C.accent }}>Path to $5M</div>
              <div className="text-[11.5px] leading-[1.45]" style={{ color: C.textMute }}>End of Y1 at ~$1.75M revenue + jewelry — 3× revenue multiple for high-margin DTC.</div>
            </div>
            <div className="rounded-[12px] p-3" style={{ background: C.bgAlt, border: '1px solid ' + C.border }}>
              <div className="text-[10.5px] uppercase tracking-[0.12em] mb-0.5" style={{ color: C.accent }}>Path to $10M</div>
              <div className="text-[11.5px] leading-[1.45]" style={{ color: C.textMute }}>Tracks with Y2 ($3.06M revenue / $1.32M GM). No clock — held through Y3+.</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Combined return summary */}
      <Card className="mt-5" testid="investor-total-return">
        <div className="text-[11.5px] uppercase tracking-[0.14em] mb-3" style={{ color: C.accent }}>Combined 3-year picture (illustrative @ $5M valuation)</div>
        <div className="grid sm:grid-cols-4 gap-3">
          <div className="rounded-[12px] p-3.5" style={{ background: 'rgba(123,196,168,0.10)', border: '1px solid rgba(123,196,168,0.28)' }}>
            <div className="text-[10.5px] uppercase tracking-[0.12em]" style={{ color: C.accent2 }}>Monthly income (3 yr)</div>
            <div className="text-[22px] font-semibold mt-1 tracking-[-0.01em]" style={{ color: C.accent2, fontFamily: '"Cormorant Garamond","Playfair Display",Georgia,serif' }}>${TOTAL_3YR_INCOME.toLocaleString()}</div>
          </div>
          <div className="rounded-[12px] p-3.5" style={{ background: 'rgba(212,175,55,0.10)', border: '1px solid rgba(212,175,55,0.28)' }}>
            <div className="text-[10.5px] uppercase tracking-[0.12em]" style={{ color: C.accent }}>Equity @ $5M</div>
            <div className="text-[22px] font-semibold mt-1 tracking-[-0.01em]" style={{ color: C.accent, fontFamily: '"Cormorant Garamond","Playfair Display",Georgia,serif' }}>${finalEquityValue.toLocaleString()}</div>
          </div>
          <div className="rounded-[12px] p-3.5" style={{ background: C.bgAlt, border: '1px solid ' + C.border }}>
            <div className="text-[10.5px] uppercase tracking-[0.12em]" style={{ color: C.textMute }}>Total return</div>
            <div className="text-[22px] font-semibold mt-1 tracking-[-0.01em]" style={{ color: C.text, fontFamily: '"Cormorant Garamond","Playfair Display",Georgia,serif' }}>${totalReturn.toLocaleString()}</div>
          </div>
          <div className="rounded-[12px] p-3.5" style={{ background: C.bgAlt, border: '1px solid ' + C.accent }}>
            <div className="text-[10.5px] uppercase tracking-[0.12em]" style={{ color: C.accent }}>On $100K</div>
            <div className="text-[28px] font-semibold mt-1 tracking-[-0.01em] leading-none" style={{ color: C.accent, fontFamily: '"Cormorant Garamond","Playfair Display",Georgia,serif' }}>{totalMultiple}×</div>
          </div>
        </div>
        <div className="mt-3 text-[11.5px] leading-[1.55]" style={{ color: C.textDim }}>
          Equity figure uses an illustrative $5M valuation — achievable by end of Y1. Monthly distributions begin in the first operating-profitable month and scale with op-contribution. Investor holds equity, so upside continues past Y3.
        </div>
      </Card>
    </Section>
  );
};

/* ─────────────────────────────────────────────────────────
   AI CHAT WIDGET — investor Q&A
   ───────────────────────────────────────────────────────── */
const SAMPLE_QUESTIONS = [
  'What\'s the current vs target run rate?',
  'How are you using the $100K?',
  'Show me the unit economics',
  'What\'s the 4-month plan?',
  'Why this valuation?',
];

const ChatWidget = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hi — I'm The Local Jewel's investor-brief assistant. Ask me about traction, unit economics, the 4-month plan, the use of funds, or anything else from the deck." },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);
  const sessionId = useRef('pitch_' + Math.random().toString(36).slice(2, 10));

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, sending]);

  const send = async (text) => {
    const q = (text || input).trim();
    if (!q || sending) return;
    setInput('');
    const token = localStorage.getItem(TOKEN_KEY);
    const newHistory = [...messages, { role: 'user', content: q }];
    setMessages(newHistory);
    setSending(true);
    try {
      const res = await axios.post(BACKEND_URL + '/api/pitch/chat', {
        token,
        session_id: sessionId.current,
        message: q,
        history: messages,
      }, { timeout: 60000 });
      setMessages(m => [...m, { role: 'assistant', content: res.data.reply }]);
    } catch (e) {
      setMessages(m => [...m, { role: 'assistant', content: 'Sorry — I hit an error. Try again in a moment, or contact ansh@thelocaljewel.com directly.' }]);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {/* Floating launcher */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          data-testid="pitch-chat-launcher"
          className="fixed bottom-5 right-5 z-50 inline-flex items-center gap-2 px-5 py-3 rounded-full text-[14px] font-medium transition-all duration-300 hover:scale-105"
          style={{
            background: C.accent, color: C.bg,
            boxShadow: '0 14px 32px rgba(212,175,55,0.4), 0 2px 6px rgba(0,0,0,0.3)',
          }}
        >
          <Bot size={17} />
          <span>Ask anything about this brief</span>
        </button>
      )}

      {/* Panel */}
      {open && (
        <div data-testid="pitch-chat-panel"
          className="fixed z-50 bottom-5 right-5 left-5 sm:left-auto rounded-[18px] flex flex-col overflow-hidden"
          style={{
            background: C.surface,
            border: '1px solid ' + C.border,
            width: 'min(420px, calc(100vw - 40px))',
            height: 'min(620px, calc(100vh - 80px))',
            boxShadow: '0 30px 70px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.05) inset',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid ' + C.border, background: C.bgAlt }}>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, ' + C.accent + ', #B8932F)' }}>
                <Diamond size={14} style={{ color: C.bg }} />
              </div>
              <div>
                <div className="text-[13px] font-semibold leading-none" style={{ color: C.text }}>Investor Q&A</div>
                <div className="text-[10px] uppercase tracking-[0.14em] mt-0.5" style={{ color: C.accent }}>AI · trained on the brief</div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} data-testid="pitch-chat-close"
              className="p-1.5 rounded-full hover:bg-[rgba(244,236,221,0.08)]" style={{ color: C.textMute }}>
              <X size={16} />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={'flex gap-2 ' + (m.role === 'user' ? 'justify-end' : 'justify-start')}>
                {m.role === 'assistant' && (
                  <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: 'rgba(212,175,55,0.15)' }}>
                    <Bot size={12} style={{ color: C.accent }} />
                  </div>
                )}
                <div data-testid={'pitch-chat-msg-' + m.role}
                  className="rounded-[12px] px-3 py-2 max-w-[78%] text-[13px] leading-[1.5] whitespace-pre-wrap"
                  style={{
                    background: m.role === 'user' ? C.accent : C.bgAlt,
                    color: m.role === 'user' ? C.bg : C.text,
                    border: m.role === 'user' ? 'none' : '1px solid ' + C.border,
                  }}>
                  {m.content}
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex gap-2 items-center">
                <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: 'rgba(212,175,55,0.15)' }}>
                  <Bot size={12} style={{ color: C.accent }} />
                </div>
                <div className="rounded-[12px] px-3 py-2 text-[12.5px]" style={{ background: C.bgAlt, border: '1px solid ' + C.border, color: C.textMute }}>
                  <Loader2 size={13} className="inline animate-spin mr-1" /> Thinking…
                </div>
              </div>
            )}
          </div>

          {/* Suggestions (only at start) */}
          {messages.length <= 1 && !sending && (
            <div className="px-4 pb-2 flex flex-wrap gap-1.5">
              {SAMPLE_QUESTIONS.map((s, i) => (
                <button key={i} onClick={() => send(s)}
                  className="text-[11px] px-2 py-1 rounded-full transition-colors"
                  style={{ background: C.bgAlt, color: C.textMute, border: '1px solid ' + C.border }}>
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <form onSubmit={(e) => { e.preventDefault(); send(); }} className="px-3 py-3 flex items-center gap-2" style={{ borderTop: '1px solid ' + C.border, background: C.bgAlt }}>
            <input
              type="text" value={input} onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about traction, terms, plan…"
              data-testid="pitch-chat-input"
              disabled={sending}
              maxLength={800}
              className="flex-1 px-3 py-2.5 rounded-[10px] text-[13px] outline-none"
              style={{ background: C.surface, border: '1px solid ' + C.border, color: C.text }}
            />
            <button type="submit" disabled={sending || !input.trim()} data-testid="pitch-chat-send"
              className="w-10 h-10 rounded-[10px] flex items-center justify-center transition-opacity"
              style={{ background: C.accent, color: C.bg, opacity: (sending || !input.trim()) ? 0.4 : 1 }}>
              <Send size={15} />
            </button>
          </form>
        </div>
      )}
    </>
  );
};

/* ─────────────────────────────────────────────────────────
   FOOTER
   ───────────────────────────────────────────────────────── */
const Footer = () => (
  <footer className="border-t mt-6" style={{ borderColor: C.border, color: C.textDim }}>
    <div className="max-w-6xl mx-auto px-5 sm:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11.5px]">
      <div className="flex items-center gap-2" data-testid="pitch-footer-logo">
        <img src="/tlj-logomark.png" alt="The Local Jewel" className="w-5 h-5 object-contain opacity-90" draggable="false" />
        <span>The Local Jewel — Custom diamond jewelry, Orlando, FL · IGI / GIA certified</span>
      </div>
      <div>© {new Date().getFullYear()} · Confidential · Do not share without consent</div>
    </div>
  </footer>
);
