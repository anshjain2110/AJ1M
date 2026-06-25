import Link from 'next/link';
import { ShieldCheck, Truck, Gem, RefreshCw } from 'lucide-react';

const TRUST = [
  { icon: Gem, label: 'IGI Certified', sub: 'Lab-grown, conflict-free' },
  { icon: Truck, label: 'Free Insured Shipping', sub: 'Discreet & tracked' },
  { icon: RefreshCw, label: '30-Day Returns', sub: 'Hassle-free exchanges' },
  { icon: ShieldCheck, label: 'Lifetime Warranty', sub: 'On every piece' },
];

/**
 * StoreFooter — server component (no interactivity).
 * All links are real <a href> via next/link → bots see them in raw HTML.
 */
export default function StoreFooter() {
  return (
    <footer className="store mt-20" style={{ fontFamily: "'Outfit', Inter, sans-serif", background: 'var(--lj-surface)' }} data-testid="store-footer">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 grid grid-cols-2 md:grid-cols-4 gap-6" style={{ borderBottom: '1px solid var(--lj-border)' }}>
        {TRUST.map((t) => (
          <div key={t.label} className="flex items-start gap-3">
            <t.icon size={22} style={{ color: 'var(--lj-accent)' }} />
            <div>
              <div className="text-[13px] font-medium" style={{ color: 'var(--lj-text)' }}>{t.label}</div>
              <div className="text-[12px]" style={{ color: 'var(--lj-muted)' }}>{t.sub}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 grid grid-cols-2 md:grid-cols-4 gap-8 text-[14px]">
        <div className="col-span-2 md:col-span-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-main.png" alt="The Local Jewel" className="h-10 mb-3" />
          <p className="text-[13px] leading-relaxed" style={{ color: 'var(--lj-muted)' }}>The most personal engagement ring buying experience online. Hand-crafted, made to order.</p>
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] mb-3" style={{ color: 'var(--lj-muted)' }}>Shop</div>
          <ul className="space-y-2">
            <li><Link href="/collections/engagement-rings" className="no-underline" style={{ color: 'var(--lj-text)' }}>Engagement Rings</Link></li>
            <li><Link href="/collections/wedding-bands" className="no-underline" style={{ color: 'var(--lj-text)' }}>Wedding Bands</Link></li>
            <li><Link href="/collections" className="no-underline" style={{ color: 'var(--lj-text)' }}>All Collections</Link></li>
          </ul>
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] mb-3" style={{ color: 'var(--lj-muted)' }}>Company</div>
          <ul className="space-y-2">
            <li><Link href="/projects" className="no-underline" style={{ color: 'var(--lj-text)' }}>Past Projects</Link></li>
            <li><Link href="/blog" className="no-underline" style={{ color: 'var(--lj-text)' }}>Journal</Link></li>
            <li><Link href="/contact" className="no-underline" style={{ color: 'var(--lj-text)' }}>Contact</Link></li>
          </ul>
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] mb-3" style={{ color: 'var(--lj-muted)' }}>Get in touch</div>
          <a href="tel:+15857108292" className="block mb-1" style={{ color: 'var(--lj-accent)' }}>+1 (585) 710-8292</a>
          <a href="mailto:ansh@thelocaljewel.com" className="block" style={{ color: 'var(--lj-accent)' }}>ansh@thelocaljewel.com</a>
          <address className="not-italic text-[12px] mt-2" style={{ color: 'var(--lj-muted)' }}>
            480 N Orlando Ave<br />Winter Park, FL 32789
          </address>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-5 flex flex-wrap items-center justify-between text-[12px]" style={{ borderTop: '1px solid var(--lj-border)', color: 'var(--lj-muted)' }}>
        <span>© {new Date().getFullYear()} The Local Jewel. All rights reserved.</span>
        <div className="flex gap-4">
          <Link href="/privacy" className="no-underline" style={{ color: 'inherit' }}>Privacy</Link>
          <Link href="/terms" className="no-underline" style={{ color: 'inherit' }}>Terms</Link>
        </div>
      </div>
    </footer>
  );
}
