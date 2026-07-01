'use client';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Truck, Gem, RefreshCw } from 'lucide-react';

const TRUST = [
  { icon: Gem, label: 'IGI Certified', sub: 'Lab-grown, conflict-free' },
  { icon: Truck, label: 'Free Insured Shipping', sub: 'Discreet & tracked' },
  { icon: RefreshCw, label: '30-Day Returns', sub: 'Hassle-free exchanges' },
  { icon: ShieldCheck, label: 'Lifetime Warranty', sub: 'On every piece' },
];

export default function StoreFooter() {
  const navigate = useNavigate();
  return (
    <footer className="store mt-20" style={{ fontFamily: "'Outfit', Inter, sans-serif", background: 'var(--lj-surface)' }}>
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
          <img src="/logo-main.png" alt="The Local Jewel" className="h-10 mb-3" />
          <p className="text-[13px] leading-relaxed" style={{ color: 'var(--lj-muted)' }}>The most personal engagement ring buying experience online. Hand-crafted, made to order.</p>
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] mb-3" style={{ color: 'var(--lj-muted)' }}>Shop</div>
          <ul className="space-y-2">
            <li><button onClick={() => navigate('/collections/engagement-rings')} style={{ color: 'var(--lj-text)' }}>Engagement Rings</button></li>
            <li><button onClick={() => navigate('/collections/wedding-bands')} style={{ color: 'var(--lj-text)' }}>Wedding Bands</button></li>
            <li><button onClick={() => navigate('/collections')} style={{ color: 'var(--lj-text)' }}>All Collections</button></li>
          </ul>
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] mb-3" style={{ color: 'var(--lj-muted)' }}>Company</div>
          <ul className="space-y-2">
            <li><button onClick={() => navigate('/projects')} style={{ color: 'var(--lj-text)' }}>Past Projects</button></li>
            <li><button onClick={() => navigate('/blog')} style={{ color: 'var(--lj-text)' }}>Journal</button></li>
            <li><button onClick={() => navigate('/contact')} style={{ color: 'var(--lj-text)' }}>Contact</button></li>
          </ul>
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] mb-3" style={{ color: 'var(--lj-muted)' }}>Get in touch</div>
          <a href="tel:+15857108292" className="block mb-1" style={{ color: 'var(--lj-accent)' }}>+1 (585) 710-8292</a>
          <button onClick={() => navigate('/')} className="mt-2 px-5 py-2.5 text-[13px] tracking-wide font-medium" style={{ background: 'var(--lj-accent)', color: '#fff' }}>Start a Custom Design</button>
        </div>
      </div>
      <div className="text-center py-5 text-[12px]" style={{ color: 'var(--lj-muted)', borderTop: '1px solid var(--lj-border)' }}>
        © {new Date().getFullYear()} The Local Jewel · <button onClick={() => navigate('/privacy')} style={{ color: 'inherit' }}>Privacy</button> · <button onClick={() => navigate('/terms')} style={{ color: 'inherit' }}>Terms</button>
      </div>
    </footer>
  );
}