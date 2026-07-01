'use client';
import React, { useEffect } from 'react';
import { ArrowRight, MessageCircle, Sparkles } from 'lucide-react';
import { trackEvent } from '../utils/analytics';

export default function CutsPage() {
  useEffect(() => {
    // Capture UTM src param for DM tracking
    const params = new URLSearchParams(window.location.search);
    const src = params.get('src') || 'direct';
    trackEvent('tlj_cuts_page_view', { src });
  }, []);

  const handleCTA = (type) => {
    const params = new URLSearchParams(window.location.search);
    const src = params.get('src') || 'direct';
    trackEvent('tlj_cuts_cta_click', { type, src });
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--lj-bg)' }}>
      {/* Minimal header — just logo, no nav */}
      <div className="px-4 py-4 flex justify-center" style={{ borderBottom: '1px solid var(--lj-border)' }}>
        <a href="/"><img src="/logo-main.png" alt="The Local Jewel" className="h-10 object-contain" /></a>
      </div>

      {/* Hero */}
      <div className="px-4 pt-10 pb-6 text-center max-w-lg mx-auto">
        <div className="flex justify-center mb-4">
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(15,94,76,0.08)' }}>
            <Sparkles size={20} style={{ color: 'var(--lj-accent)' }} />
          </div>
        </div>
        <h1 className="text-[26px] leading-[32px] font-semibold tracking-[-0.01em] mb-3" style={{ color: 'var(--lj-text)' }}>
          Here are some cuts you probably haven't seen before.
        </h1>
        <p className="text-[15px] leading-[22px]" style={{ color: 'var(--lj-muted)' }}>
          We custom cut diamonds into any shape — letters, symbols, initials, and beyond.
        </p>
      </div>

      {/* Image showcase */}
      <div className="px-4 pb-8 max-w-lg mx-auto">
        {/* Alphabet diamonds — full width */}
        <div className="rounded-[14px] overflow-hidden mb-3" style={{ border: '1px solid var(--lj-border)' }}>
          <img src="/custom-cut-1.jpeg" alt="Custom cut diamond alphabet — A to Z" className="w-full h-auto" />
        </div>
        <p className="text-[12px] text-center mb-6" style={{ color: 'var(--lj-muted)' }}>A–Z alphabet diamonds, custom cut in-house</p>

        {/* Tree shapes + ring side by side */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="rounded-[14px] overflow-hidden" style={{ border: '1px solid var(--lj-border)' }}>
            <img src="/custom-cut-2.jpeg" alt="Custom cut diamond trees and symbols" className="w-full h-auto" />
          </div>
          <div className="rounded-[14px] overflow-hidden" style={{ border: '1px solid var(--lj-border)' }}>
            <img src="/custom-cut-ring.jpg" alt="Custom letter diamond ring" className="w-full h-full object-cover" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 text-[12px] text-center mb-8" style={{ color: 'var(--lj-muted)' }}>
          <span>Custom shapes & symbols</span>
          <span>Set into 14K gold rings</span>
        </div>

        {/* Separator */}
        <div className="flex items-center gap-4 mb-8">
          <div className="flex-1 h-px" style={{ background: 'var(--lj-border)' }} />
          <span className="text-[12px] font-medium" style={{ color: 'var(--lj-muted)' }}>INTERESTED?</span>
          <div className="flex-1 h-px" style={{ background: 'var(--lj-border)' }} />
        </div>

        {/* CTAs */}
        <div className="space-y-3">
          <a
            href="https://www.instagram.com/thelocaljewel/"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => handleCTA('dm')}
            className="w-full min-h-[52px] rounded-[14px] font-medium text-[16px] flex items-center justify-center gap-2.5 transition-all duration-300 active:scale-[0.99]"
            style={{ background: 'var(--lj-accent)', color: '#FFFFFF', boxShadow: '0 4px 20px rgba(15,94,76,0.2)' }}
          >
            <MessageCircle size={18} /> Want one of these? Let's talk
          </a>
          <a
            href="/?utm_source=cuts_page"
            onClick={() => handleCTA('wizard')}
            className="w-full min-h-[48px] rounded-[14px] font-medium text-[15px] flex items-center justify-center gap-2 transition-all duration-300"
            style={{ background: 'var(--lj-surface)', color: 'var(--lj-text)', border: '1px solid var(--lj-border)' }}
          >
            Or get a free custom quote <ArrowRight size={16} />
          </a>
        </div>

        {/* Trust line */}
        <p className="text-[12px] text-center mt-6" style={{ color: 'var(--lj-muted)' }}>
          The Local Jewel · Custom Diamond Jewelry · Worldwide Shipping
        </p>
      </div>
    </div>
  );
}