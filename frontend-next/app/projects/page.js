import Link from 'next/link';
import { ArrowRight, Sparkles, ChevronRight } from 'lucide-react';
import StoreLayout from '../../components/store/StoreLayout';
import PriceTag from '../../components/PriceTag';
import ProjectsFilter from './ProjectsFilter';
import { apiGet } from '../../lib/api';
import { SITE_BASE_URL } from '../../lib/seoSchema';

// Refresh every 60s so new projects surface.
export const revalidate = 60;

const TAG_LABELS = {
  engagement_ring: 'Engagement Rings', wedding_band: 'Wedding Bands', oval: 'Oval', radiant: 'Radiant',
  emerald: 'Emerald', cushion: 'Cushion', princess: 'Princess', pear: 'Pear', round: 'Round',
  hidden_halo: 'Hidden Halo', solitaire: 'Solitaire', side_stones: 'Side Stones', three_stone: 'Three Stone',
  pave: 'Pavé', lab_grown: 'Lab Grown', igi_certified: 'IGI Certified', gia_certified: 'GIA Certified',
  white_gold: 'White Gold', yellow_gold: 'Yellow Gold', rose_gold: 'Rose Gold', platinum: 'Platinum',
  '3ct': '3+ Carat', '4ct': '4+ Carat', '5ct': '5+ Carat',
};
const labelFor = (t) => TAG_LABELS[t] || (t || '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

export const metadata = {
  title: 'Past Projects — Custom Lab Diamond Rings & Jewelry',
  description: "Browse real custom diamond pieces built by The Local Jewel — engagement rings, hidden halos, ovals, radiants and more. Every project includes specs, the design journey, and the customer story.",
  alternates: { canonical: '/projects' },
  openGraph: {
    title: 'Past Projects — The Local Jewel',
    description: 'Real custom diamond jewelry, designed and built for our clients. See the journey from sketch to final piece.',
    url: `${SITE_BASE_URL}/projects`,
    type: 'website',
  },
};

export default async function ProjectsIndexPage() {
  const data = await apiGet('/api/projects', { revalidate: 60, tags: ['projects'] }).catch(() => null);
  const projects = (data && data.projects) || [];
  const tags = (data && data.tags) || [];

  return (
    <StoreLayout>
      <main className="min-h-screen flex flex-col" style={{ background: 'var(--lj-bg)' }} data-testid="projects-index-page">
        <section className="px-4 pt-12 pb-8 text-center">
          <div className="max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4" style={{ background: 'rgba(15,94,76,0.08)', border: '1px solid rgba(15,94,76,0.15)' }}>
              <Sparkles size={13} style={{ color: 'var(--lj-accent)' }} />
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: 'var(--lj-accent)' }}>Past Projects</span>
            </div>
            <h1 className="text-[32px] sm:text-[48px] leading-[1.05] font-semibold tracking-[-0.02em] mb-4" style={{ color: 'var(--lj-text)', fontFamily: 'var(--lj-serif, "Cormorant Garamond", "Playfair Display", Georgia, serif)' }}>
              Real pieces. Real customers. Real journeys.
            </h1>
            <p className="text-[15px] sm:text-[17px] leading-[1.55] max-w-xl mx-auto" style={{ color: 'var(--lj-muted)' }}>
              Every custom diamond piece we&apos;ve designed and built. See the sketches, the 3D renders, and the final ring — alongside the people who wear them.
            </p>
          </div>
        </section>

        <ProjectsFilter projects={projects} tags={tags} />

        <section className="px-4 py-14 text-center" style={{ borderTop: '1px solid var(--lj-border)' }}>
          <div className="max-w-xl mx-auto">
            <h2 className="text-[26px] sm:text-[34px] leading-[1.15] font-semibold mb-3 tracking-[-0.01em]" style={{ color: 'var(--lj-text)', fontFamily: 'var(--lj-serif, "Cormorant Garamond", "Playfair Display", Georgia, serif)' }}>
              Ready to design your own?
            </h2>
            <p className="text-[15px] leading-[1.55] mb-6" style={{ color: 'var(--lj-muted)' }}>
              Tell us your vision. We&apos;ll send you 3D renders within 48 hours — no payment required until you approve the design.
            </p>
            <Link href="/" data-testid="projects-index-cta"
              className="inline-flex items-center justify-center gap-2 min-h-[52px] px-7 rounded-[14px] font-medium text-[16px] transition-all duration-300 active:scale-[0.99] hover:opacity-95 no-underline"
              style={{ background: 'var(--lj-accent)', color: '#FFFFFF', boxShadow: '0 4px 20px rgba(15,94,76,0.22)' }}>
              Start your custom piece <ArrowRight size={18} />
            </Link>
            <p className="mt-3 text-[12px]" style={{ color: 'var(--lj-muted)' }}>
              Takes about 90 seconds · No payment required
            </p>
          </div>
        </section>
      </main>
    </StoreLayout>
  );
}
