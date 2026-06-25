/**
 * Temporary homepage placeholder for the side-by-side migration. The CRA app
 * still serves the real homepage on port 3000 (production preview). Once we
 * port the wizard + hero sections this will become the real SSR homepage.
 */
export const metadata = {
  title: 'The Local Jewel — Custom Diamond Jewelry, Hand-Crafted in Winter Park, FL',
  description:
    'Independent custom jewelry studio specializing in lab-grown diamond engagement rings, wedding bands, and fine jewelry. Hand-crafted to order in Winter Park, Florida. Ships in 2–5 business days.',
  alternates: { canonical: '/' },
};

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-16 text-center" data-testid="home-page">
      <p className="text-[11px] uppercase tracking-[0.22em] mb-3" style={{ color: 'var(--lj-muted)' }}>The Local Jewel</p>
      <h1 className="text-4xl sm:text-5xl lg:text-6xl mb-4 font-serif" style={{ color: 'var(--lj-text)' }}>
        Custom diamond jewelry, made for you.
      </h1>
      <p className="text-[16px] max-w-xl mb-8" style={{ color: 'var(--lj-muted)' }}>
        Lab-grown diamond engagement rings, wedding bands, and fine jewelry — hand-crafted to order in Winter Park, Florida.
        Ships in 2–5 business days.
      </p>
      <a href="/collections" className="px-7 py-3.5 rounded-full text-[13.5px] font-semibold no-underline" style={{ background: 'var(--lj-accent)', color: '#fff' }}>
        Shop collections
      </a>
      <p className="mt-10 text-[11px]" style={{ color: 'var(--lj-muted)' }}>
        Migration in progress — the production site at thelocaljewel.com is unaffected.
      </p>
    </main>
  );
}
