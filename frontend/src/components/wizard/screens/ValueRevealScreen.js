import React, { useState, useEffect, useRef } from 'react';
import { useWizard } from '../../../context/WizardContext';
import { ArrowLeft, ArrowRight, Shield, Sparkles } from 'lucide-react';
import { trackEvent } from '../../../utils/analytics';
import CountUp from 'react-countup';

export default function ValueRevealScreen() {
  const { goNext, goBack, state } = useWizard();
  const [revealed, setRevealed] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const hasTracked = useRef(false);
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  useEffect(() => { if (!hasTracked.current) { trackEvent('tlj_value_reveal_view', { savings_variant: '$4,000-$8,000' }, { lead_id: state.leadId }); hasTracked.current = true; } if (prefersReducedMotion) { setRevealed(true); setShowContent(true); } else { const t1 = setTimeout(() => setRevealed(true), 800); const t2 = setTimeout(() => setShowContent(true), 1200); return () => { clearTimeout(t1); clearTimeout(t2); }; } }, [prefersReducedMotion, state.leadId]);
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-10 max-w-[520px] mx-auto w-full text-center">
      <div className="w-16 h-16 rounded-full flex items-center justify-center mb-8" style={{ background: 'rgba(15,94,76,0.08)', border: '1px solid rgba(15,94,76,0.15)', opacity: revealed ? 1 : 0, transition: 'opacity 600ms var(--lj-ease)' }}><Sparkles size={28} style={{ color: 'var(--lj-accent)' }} /></div>
      <p className="text-[16px] leading-[24px] mb-4" style={{ color: 'var(--lj-muted)', opacity: revealed ? 1 : 0, transition: 'opacity 400ms var(--lj-ease)' }}>Based on what you're looking for...</p>
      <h2 className="text-[13px] leading-[18px] uppercase tracking-widest mb-3 font-medium" style={{ color: 'var(--lj-accent)', opacity: revealed ? 1 : 0, transition: 'opacity 400ms var(--lj-ease) 200ms' }}>Customers like you typically save</h2>
      <div className="mb-6" data-testid="value-reveal-savings-amount" style={{ opacity: revealed ? 1 : 0, transform: revealed ? 'translateY(0)' : 'translateY(8px)', transition: 'all 600ms var(--lj-ease) 400ms' }}>
        <span className="text-[48px] leading-[56px] font-bold" style={{ color: 'var(--lj-accent)' }}>{revealed ? (prefersReducedMotion ? '$4,000 – $8,000' : <>${'$'}<CountUp end={4000} duration={1.2} separator="," /> – ${`$`}<CountUp end={8000} duration={1.5} separator="," /></>) : '$0'}</span>
      </div>
      <p className="text-[16px] leading-[24px] mb-8 max-w-sm" style={{ color: 'var(--lj-muted)', opacity: showContent ? 1 : 0, transition: 'opacity 400ms var(--lj-ease)' }}>compared to Brilliant Earth, Grown Brilliance, and retail jewelers.</p>
      <p className="text-[16px] leading-[24px] mb-8 max-w-sm italic" style={{ color: 'var(--lj-text)', opacity: showContent ? 1 : 0, transition: 'opacity 400ms var(--lj-ease) 200ms' }}>"Same GIA & IGI Certified diamonds. Same quality. You're just not paying for their marketing budget."</p>
      <div className="flex items-center gap-3 mb-10" style={{ opacity: showContent ? 1 : 0, transition: 'opacity 400ms var(--lj-ease) 400ms' }}>
        <div className="px-3 py-1.5 rounded-full text-[13px] font-medium" style={{ background: '#E8F5F1', color: 'var(--lj-accent)', border: '1px solid #C8E6DE' }}><Shield size={14} className="inline mr-1" /> GIA Certified</div>
        <div className="px-3 py-1.5 rounded-full text-[13px] font-medium" style={{ background: '#E8F5F1', color: 'var(--lj-accent)', border: '1px solid #C8E6DE' }}><Shield size={14} className="inline mr-1" /> IGI Certified</div>
      </div>
      <button onClick={() => goNext('value_reveal')} data-testid="value-reveal-continue-button" className="w-full max-w-sm min-h-[52px] px-6 rounded-[14px] font-medium text-[16px] flex items-center justify-center gap-2 transition-all duration-300 active:scale-[0.99]" style={{ background: 'var(--lj-accent)', color: '#FFFFFF', boxShadow: '0 4px 20px rgba(15,94,76,0.2)', opacity: showContent ? 1 : 0, transition: 'opacity 400ms var(--lj-ease) 600ms', pointerEvents: showContent ? 'auto' : 'none' }}>Get My Personalized Quote <ArrowRight size={18} /></button>
      <p className="mt-4 text-[13px]" style={{ color: 'var(--lj-muted)', opacity: showContent ? 1 : 0, transition: 'opacity 400ms var(--lj-ease) 800ms' }}>No obligation. Private consultation.</p>
      <button onClick={goBack} className="mt-4 flex items-center gap-1.5 text-[14px] font-medium transition-colors duration-300 hover:underline" style={{ color: 'var(--lj-muted)', opacity: showContent ? 1 : 0, transition: 'opacity 400ms var(--lj-ease) 900ms' }}><ArrowLeft size={15} /> Go back and edit</button>
    </div>
  );
}
