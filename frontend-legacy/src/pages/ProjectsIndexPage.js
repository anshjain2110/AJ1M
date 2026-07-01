import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import axios from 'axios';
import { ArrowRight, Sparkles, ChevronRight, Loader2 } from 'lucide-react';
import PublicHeader from '../components/PublicHeader';
import PriceTag from '../components/PriceTag';
import ProjectInquiryChat from '../components/ProjectInquiryChat';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

// Map raw tags → friendly chip labels
const TAG_LABELS = {
  engagement_ring: 'Engagement Rings',
  wedding_band: 'Wedding Bands',
  oval: 'Oval',
  radiant: 'Radiant',
  emerald: 'Emerald',
  cushion: 'Cushion',
  princess: 'Princess',
  pear: 'Pear',
  round: 'Round',
  hidden_halo: 'Hidden Halo',
  solitaire: 'Solitaire',
  side_stones: 'Side Stones',
  three_stone: 'Three Stone',
  pave: 'Pavé',
  lab_grown: 'Lab Grown',
  igi_certified: 'IGI Certified',
  gia_certified: 'GIA Certified',
  white_gold: 'White Gold',
  yellow_gold: 'Yellow Gold',
  rose_gold: 'Rose Gold',
  platinum: 'Platinum',
  '3ct': '3+ Carat',
  '4ct': '4+ Carat',
  '5ct': '5+ Carat',
};

const labelFor = (t) => TAG_LABELS[t] || t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

export default function ProjectsIndexPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [tags, setTags] = useState([]);
  const [activeTag, setActiveTag] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    axios.get(`${BACKEND_URL}/api/projects`).then(res => {
      if (!mounted) return;
      setProjects(res.data.projects || []);
      setTags(res.data.tags || []);
    }).catch(() => {
      // empty state
    }).finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const filtered = useMemo(() => {
    if (activeTag === 'all') return projects;
    return projects.filter(p => (p.tags || []).includes(activeTag));
  }, [projects, activeTag]);

  // Show top 8 tag chips
  const topTags = tags.slice(0, 8);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--lj-bg)' }} data-testid="projects-index-page">
      <Helmet>
        <title>Past Projects — Custom Lab Diamond Rings & Jewelry | The Local Jewel</title>
        <meta name="description" content="Browse real custom diamond pieces built by The Local Jewel — engagement rings, hidden halos, ovals, radiants and more. Every project includes specs, the design journey, and the customer story." />
        <link rel="canonical" href="https://thelocaljewel.com/projects" />
        <meta property="og:title" content="Past Projects — The Local Jewel" />
        <meta property="og:description" content="Real custom diamond jewelry, designed and built for our clients. See the journey from sketch to final piece." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://thelocaljewel.com/projects" />
      </Helmet>

      <PublicHeader />

      {/* Hero */}
      <section className="px-4 pt-12 pb-8 text-center">
        <div className="max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4"
            style={{ background: 'rgba(15,94,76,0.08)', border: '1px solid rgba(15,94,76,0.15)' }}>
            <Sparkles size={13} style={{ color: 'var(--lj-accent)' }} />
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: 'var(--lj-accent)' }}>
              Past Projects
            </span>
          </div>
          <h1
            className="text-[32px] sm:text-[48px] leading-[1.05] font-semibold tracking-[-0.02em] mb-4"
            style={{ color: 'var(--lj-text)', fontFamily: 'var(--lj-serif, "Cormorant Garamond", "Playfair Display", Georgia, serif)' }}
          >
            Real pieces. Real customers. Real journeys.
          </h1>
          <p className="text-[15px] sm:text-[17px] leading-[1.55] max-w-xl mx-auto" style={{ color: 'var(--lj-muted)' }}>
            Every custom diamond piece we've designed and built. See the sketches, the 3D renders, and the final ring — alongside the people who wear them.
          </p>
        </div>
      </section>

      {/* Filter chips */}
      {topTags.length > 0 && (
        <div className="px-4 pb-6">
          <div className="max-w-4xl mx-auto flex flex-wrap gap-2 justify-center" data-testid="projects-filter-chips">
            <button
              onClick={() => setActiveTag('all')}
              data-testid="filter-chip-all"
              className="px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-all duration-200"
              style={{
                background: activeTag === 'all' ? 'var(--lj-accent)' : 'var(--lj-surface)',
                color: activeTag === 'all' ? '#FFFFFF' : 'var(--lj-text)',
                border: '1px solid ' + (activeTag === 'all' ? 'var(--lj-accent)' : 'var(--lj-border)'),
              }}
            >
              All <span className="opacity-70 ml-1">{projects.length}</span>
            </button>
            {topTags.map(t => (
              <button
                key={t.tag}
                onClick={() => setActiveTag(t.tag)}
                data-testid={`filter-chip-${t.tag}`}
                className="px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-all duration-200"
                style={{
                  background: activeTag === t.tag ? 'var(--lj-accent)' : 'var(--lj-surface)',
                  color: activeTag === t.tag ? '#FFFFFF' : 'var(--lj-text)',
                  border: '1px solid ' + (activeTag === t.tag ? 'var(--lj-accent)' : 'var(--lj-border)'),
                }}
              >
                {labelFor(t.tag)} <span className="opacity-70 ml-1">{t.count}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Grid */}
      <section className="px-4 pb-16 flex-1">
        <div className="max-w-6xl mx-auto">
          {loading ? (
            <div className="py-20 flex items-center justify-center" style={{ color: 'var(--lj-muted)' }}>
              <Loader2 size={22} className="animate-spin mr-2" /> Loading projects…
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center" style={{ color: 'var(--lj-muted)' }}>
              <p className="text-[15px]">No projects in this category yet.</p>
              <button onClick={() => setActiveTag('all')} className="mt-3 text-[14px] underline" style={{ color: 'var(--lj-accent)' }}>
                Show all projects
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
              {filtered.map((p, i) => (
                <Link
                  key={p.project_id}
                  to={`/projects/${p.slug}`}
                  data-testid={`project-card-${p.slug}`}
                  className="group block rounded-[18px] overflow-hidden transition-all duration-300 hover:-translate-y-1"
                  style={{
                    background: 'var(--lj-surface)',
                    border: '1px solid var(--lj-border)',
                    boxShadow: '0 4px 14px rgba(15,94,76,0.04)',
                  }}
                >
                  <div className="relative aspect-[4/3] overflow-hidden" style={{ background: 'var(--lj-bg)' }}>
                    {p.hero_image_url ? (
                      <img
                        src={p.hero_image_url}
                        alt={p.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        loading={i < 3 ? 'eager' : 'lazy'}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center" style={{ color: 'var(--lj-muted)' }}>No image</div>
                    )}
                    {p.featured && (
                      <div className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-[0.1em]"
                        style={{ background: 'rgba(255,255,255,0.92)', color: 'var(--lj-accent)' }}>
                        Featured
                      </div>
                    )}
                    {(p.price !== null && p.price !== undefined && p.price !== '') && (
                      <div className="absolute top-3 right-3">
                        <PriceTag price={p.price} prefix={p.price_prefix} currency={p.price_currency} testid={`project-card-price-${p.slug}`} />
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <h3
                      className="text-[19px] sm:text-[20px] leading-[1.25] font-semibold mb-1.5 tracking-[-0.01em]"
                      style={{ color: 'var(--lj-text)', fontFamily: 'var(--lj-serif, "Cormorant Garamond", "Playfair Display", Georgia, serif)' }}
                    >
                      {p.title}
                    </h3>
                    {p.subtitle && (
                      <p className="text-[13px] leading-[1.5] mb-3" style={{ color: 'var(--lj-muted)' }}>{p.subtitle}</p>
                    )}
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {(p.tags || []).slice(0, 3).map(t => (
                        <span key={t} className="text-[11px] px-2 py-0.5 rounded-full"
                          style={{ background: 'rgba(15,94,76,0.06)', color: 'var(--lj-accent)', border: '1px solid rgba(15,94,76,0.12)' }}>
                          {labelFor(t)}
                        </span>
                      ))}
                    </div>
                    {/* Marketplace-style inquiry chat embedded in card */}
                    <div className="mb-3">
                      <ProjectInquiryChat project={p} compact />
                    </div>
                    <div className="flex items-center justify-between text-[13px] font-medium" style={{ color: 'var(--lj-accent)' }}>
                      <span>View the journey</span>
                      <ChevronRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-14 text-center" style={{ borderTop: '1px solid var(--lj-border)' }}>
        <div className="max-w-xl mx-auto">
          <h2
            className="text-[26px] sm:text-[34px] leading-[1.15] font-semibold mb-3 tracking-[-0.01em]"
            style={{ color: 'var(--lj-text)', fontFamily: 'var(--lj-serif, "Cormorant Garamond", "Playfair Display", Georgia, serif)' }}
          >
            Ready to design your own?
          </h2>
          <p className="text-[15px] leading-[1.55] mb-6" style={{ color: 'var(--lj-muted)' }}>
            Tell us your vision. We'll send you 3D renders within 48 hours — no payment required until you approve the design.
          </p>
          <button
            onClick={() => navigate('/')}
            data-testid="projects-index-cta"
            className="inline-flex items-center justify-center gap-2 min-h-[52px] px-7 rounded-[14px] font-medium text-[16px] transition-all duration-300 active:scale-[0.99] hover:opacity-95"
            style={{ background: 'var(--lj-accent)', color: '#FFFFFF', boxShadow: '0 4px 20px rgba(15,94,76,0.22)' }}
          >
            Start your custom piece <ArrowRight size={18} />
          </button>
          <p className="mt-3 text-[12px]" style={{ color: 'var(--lj-muted)' }}>
            Takes about 90 seconds · No payment required
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-4 py-8 text-center" style={{ borderTop: '1px solid var(--lj-border)' }}>
        <div className="flex items-center justify-center gap-3 text-[12px] flex-wrap" style={{ color: 'var(--lj-muted)' }}>
          <a href="/" className="hover:underline">Home</a>
          <span>·</span>
          <a href="/projects" className="hover:underline">Projects</a>
          <span>·</span>
          <a href="/blog" className="hover:underline">Journal</a>
          <span>·</span>
          <a href="/contact" className="hover:underline">Contact</a>
          <span>·</span>
          <a href="/privacy" className="hover:underline">Privacy</a>
          <span>·</span>
          <a href="/terms" className="hover:underline">Terms</a>
        </div>
      </footer>
    </div>
  );
}
