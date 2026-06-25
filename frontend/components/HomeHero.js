'use client';

import { useState, useEffect } from 'react';
import { ArrowRight, Sparkles, ShieldCheck, Clock } from 'lucide-react';
import QuickQuoteModal from './QuickQuoteModal';

export default function HomeHero() {
  const [open, setOpen] = useState(false);
  const [stage, setStage] = useState(0);
  const stages = ['/hero-render-1.jpeg', '/hero-render-2.jpeg', '/hero-render-3.jpeg', '/hero-render-4.jpeg'];

  useEffect(() => {
    const id = setInterval(() => setStage((s) => (s + 1) % stages.length), 3500);
    return () => clearInterval(id);
  }, [stages.length]);

  return (
    <section data-testid="home-hero" className="relative w-full"
      style={{ background: 'linear-gradient(180deg, var(--lj-surface) 0%, var(--lj-bg) 100%)', borderBottom: '1px solid var(--lj-border)' }}>
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none opacity-60"
        style={{ background: 'radial-gradient(70% 40% at 50% 0%, rgba(15,94,76,0.08), transparent 70%)' }} />

      <div className="relative max-w-6xl mx-auto px-5 sm:px-8 pt-8 sm:pt-14 pb-10 sm:pb-16 grid lg:grid-cols-[1.05fr_0.95fr] gap-10 lg:gap-12 items-center">
        <div>
          <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] mb-4 px-3 py-1.5 rounded-full"
            style={{ background: 'rgba(15,94,76,0.08)', color: 'var(--lj-accent)' }}>
            <Sparkles size={12} /> Custom in 90 seconds
          </div>

          <h1 className="text-[32px] sm:text-[40px] lg:text-[46px] leading-[1.06] tracking-[-0.02em] font-semibold mb-4" style={{ color: 'var(--lj-text)' }}>
            The most personal engagement ring buying experience <span style={{ color: 'var(--lj-accent)' }}>online.</span>
          </h1>

          <p className="text-[15px] sm:text-[17px] leading-[1.55] max-w-xl mb-7" style={{ color: 'var(--lj-muted)' }}>
            Paste a link, drop an image, or describe what you have in mind. Our designers send back 3D renders and a written quote within 24-48 hours.
          </p>

          <button onClick={() => setOpen(true)} data-testid="home-hero-cta"
            className="w-full sm:w-auto min-h-[56px] px-8 rounded-[14px] font-medium text-[16px] inline-flex items-center justify-center gap-2.5 transition-all duration-300 active:scale-[0.99] hover:shadow-[0_10px_28px_rgba(15,94,76,0.28)]"
            style={{ background: 'var(--lj-accent)', color: '#FFFFFF', boxShadow: '0 8px 22px rgba(15,94,76,0.22)' }}>
            Get me a quote <ArrowRight size={18} />
          </button>

          <div className="mt-3 inline-flex items-center gap-2.5 text-[11.5px] font-medium tracking-[0.01em]" style={{ color: 'var(--lj-muted)' }}>
            <span className="inline-flex items-center gap-1.5">
              <Clock size={12} strokeWidth={2.2} style={{ color: 'var(--lj-accent)', opacity: 0.85 }} />
              Takes about 90 seconds
            </span>
            <span className="w-[3px] h-[3px] rounded-full" style={{ background: 'var(--lj-muted)', opacity: 0.35 }} />
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck size={12} strokeWidth={2.2} style={{ color: 'var(--lj-accent)', opacity: 0.85 }} />
              No payment required
            </span>
          </div>
        </div>

        <div className="relative flex justify-center items-center min-h-[420px]">
          <div aria-hidden="true" className="absolute -inset-8 rounded-full opacity-60"
            style={{ background: 'radial-gradient(closest-side, rgba(15,94,76,0.18), transparent 75%)', filter: 'blur(20px)' }} />
          <div className="relative w-full max-w-[340px] aspect-[3/4] rounded-[24px] overflow-hidden" style={{ boxShadow: '0 30px 80px -20px rgba(0,0,0,0.4)' }}>
            {stages.map((src, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={src} src={src} alt="Custom ring render" className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700" style={{ opacity: stage === i ? 1 : 0 }} />
            ))}
            <div className="absolute bottom-0 left-0 right-0 p-4" style={{ background: 'linear-gradient(0deg, rgba(0,0,0,0.55), transparent)' }}>
              <p className="text-[11px] uppercase tracking-[0.2em] text-white/80">Your custom render</p>
              <p className="text-[13px] text-white">Hand-crafted in Winter Park, FL</p>
            </div>
          </div>
        </div>
      </div>

      {open && <QuickQuoteModal onClose={() => setOpen(false)} />}
    </section>
  );
}
