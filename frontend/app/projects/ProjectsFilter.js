'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ChevronRight, Loader2 } from 'lucide-react';
import PriceTag from '../../components/PriceTag';

const TAG_LABELS = {
  engagement_ring: 'Engagement Rings', wedding_band: 'Wedding Bands', oval: 'Oval', radiant: 'Radiant',
  emerald: 'Emerald', cushion: 'Cushion', princess: 'Princess', pear: 'Pear', round: 'Round',
  hidden_halo: 'Hidden Halo', solitaire: 'Solitaire', side_stones: 'Side Stones', three_stone: 'Three Stone',
  pave: 'Pavé', lab_grown: 'Lab Grown', igi_certified: 'IGI Certified', gia_certified: 'GIA Certified',
  white_gold: 'White Gold', yellow_gold: 'Yellow Gold', rose_gold: 'Rose Gold', platinum: 'Platinum',
  '3ct': '3+ Carat', '4ct': '4+ Carat', '5ct': '5+ Carat',
};

export default function ProjectsFilter({ projects = [], tags = [] }) {
  const [activeTag, setActiveTag] = useState('all');
  const labelFor = (t) => TAG_LABELS[t] || (t || '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  const filtered = useMemo(() => {
    if (activeTag === 'all') return projects;
    return projects.filter((p) => (p.tags || []).includes(activeTag));
  }, [projects, activeTag]);
  const topTags = tags.slice(0, 8);

  return (
    <>
      {topTags.length > 0 && (
        <div className="px-4 pb-6">
          <div className="max-w-4xl mx-auto flex flex-wrap gap-2 justify-center" data-testid="projects-filter-chips">
            <button onClick={() => setActiveTag('all')} data-testid="filter-chip-all"
              className="px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-all duration-200"
              style={{
                background: activeTag === 'all' ? 'var(--lj-accent)' : 'var(--lj-surface)',
                color: activeTag === 'all' ? '#FFFFFF' : 'var(--lj-text)',
                border: '1px solid ' + (activeTag === 'all' ? 'var(--lj-accent)' : 'var(--lj-border)'),
              }}>
              All <span className="opacity-70 ml-1">{projects.length}</span>
            </button>
            {topTags.map((t) => (
              <button key={t.tag} onClick={() => setActiveTag(t.tag)} data-testid={`filter-chip-${t.tag}`}
                className="px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-all duration-200"
                style={{
                  background: activeTag === t.tag ? 'var(--lj-accent)' : 'var(--lj-surface)',
                  color: activeTag === t.tag ? '#FFFFFF' : 'var(--lj-text)',
                  border: '1px solid ' + (activeTag === t.tag ? 'var(--lj-accent)' : 'var(--lj-border)'),
                }}>
                {labelFor(t.tag)} <span className="opacity-70 ml-1">{t.count}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <section className="px-4 pb-16 flex-1">
        <div className="max-w-6xl mx-auto">
          {filtered.length === 0 ? (
            <div className="py-20 text-center" style={{ color: 'var(--lj-muted)' }}>
              <p className="text-[15px]">No projects in this category yet.</p>
              <button onClick={() => setActiveTag('all')} className="mt-3 text-[14px] underline" style={{ color: 'var(--lj-accent)' }}>
                Show all projects
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
              {filtered.map((p, i) => (
                <Link key={p.project_id || p.slug} href={`/projects/${p.slug}`} data-testid={`project-card-${p.slug}`}
                  className="group block rounded-[18px] overflow-hidden transition-all duration-300 hover:-translate-y-1 no-underline"
                  style={{ background: 'var(--lj-surface)', border: '1px solid var(--lj-border)', boxShadow: '0 4px 14px rgba(15,94,76,0.04)', color: 'inherit' }}>
                  <div className="relative aspect-[4/3] overflow-hidden" style={{ background: 'var(--lj-bg)' }}>
                    {p.hero_image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.hero_image_url} alt={p.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" loading={i < 3 ? 'eager' : 'lazy'} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center" style={{ color: 'var(--lj-muted)' }}>No image</div>
                    )}
                    {p.featured && (
                      <div className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-[0.1em]"
                        style={{ background: 'rgba(255,255,255,0.92)', color: 'var(--lj-accent)' }}>Featured</div>
                    )}
                    {(p.price !== null && p.price !== undefined && p.price !== '') && (
                      <div className="absolute top-3 right-3">
                        <PriceTag price={p.price} prefix={p.price_prefix} currency={p.price_currency} testid={`project-card-price-${p.slug}`} />
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <h3 className="text-[19px] sm:text-[20px] leading-[1.25] font-semibold mb-1.5 tracking-[-0.01em]"
                      style={{ color: 'var(--lj-text)', fontFamily: 'var(--lj-serif, "Cormorant Garamond", "Playfair Display", Georgia, serif)' }}>
                      {p.title}
                    </h3>
                    {p.subtitle && <p className="text-[13px] leading-[1.5] mb-3" style={{ color: 'var(--lj-muted)' }}>{p.subtitle}</p>}
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {(p.tags || []).slice(0, 3).map((t) => (
                        <span key={t} className="text-[11px] px-2 py-0.5 rounded-full"
                          style={{ background: 'rgba(15,94,76,0.06)', color: 'var(--lj-accent)', border: '1px solid rgba(15,94,76,0.12)' }}>
                          {labelFor(t)}
                        </span>
                      ))}
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
    </>
  );
}
