import React, { useState, useEffect, useRef } from 'react';
import { useWizard } from '../../../context/WizardContext';
import { ArrowLeft, ArrowRight, Shield, Sparkles, Loader2, Lock, User, Mail, Phone as PhoneIcon, MessageSquare, X } from 'lucide-react';
import { trackEvent } from '../../../utils/analytics';
import CountUp from 'react-countup';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

const SAVINGS_BY_CARAT = {
  '0.5_0.9': [1000, 1500],
  '1.0_1.4': [2000, 2500],
  '1.5_1.9': [3000, 3500],
  '2.0_2.9': [4000, 4500],
  '3.0_plus': [5000, 5500],
  'not_sure': [3000, 5000],
};

function getVariant(sessionId, config) {
  if (config.lead_capture_mode === 'variant_a') return 'A';
  if (config.lead_capture_mode === 'variant_b') return 'B';
  // Auto: hash session ID to get consistent 50/50 split
  const stored = sessionStorage.getItem('tlj_ab_variant');
  if (stored) return stored;
  let hash = 0;
  for (let i = 0; i < sessionId.length; i++) { hash = ((hash << 5) - hash) + sessionId.charCodeAt(i); hash |= 0; }
  const variant = (Math.abs(hash) % 100) < (config.variant_a_weight || 50) ? 'A' : 'B';
  sessionStorage.setItem('tlj_ab_variant', variant);
  return variant;
}

export default function ValueRevealScreen() {
  const { goNext, goBack, state, submitLead } = useWizard();
  const [revealed, setRevealed] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [variant, setVariant] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [form, setForm] = useState({ first_name: '', phone: '', email: '', notes: '' });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const hasTracked = useRef(false);
  const popupTimer = useRef(null);
  const revealTimestamp = useRef(null);
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const caratRange = state.answers.carat_range || 'not_sure';
  const [savingsLow, savingsHigh] = SAVINGS_BY_CARAT[caratRange] || SAVINGS_BY_CARAT['not_sure'];

  // Fetch A/B config and assign variant
  useEffect(() => {
    axios.get(`${BACKEND_URL}/api/abtest/config`).then(res => {
      const v = getVariant(state.sessionId || 'default', res.data);
      setVariant(v);
    }).catch(() => setVariant('A'));
  }, [state.sessionId]);

  // Reveal animation
  useEffect(() => {
    if (prefersReducedMotion) { setRevealed(true); setShowContent(true); }
    else {
      const t1 = setTimeout(() => setRevealed(true), 800);
      const t2 = setTimeout(() => setShowContent(true), 1200);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
  }, [prefersReducedMotion]);

  // Track variant shown + trigger popup for B
  useEffect(() => {
    if (!variant || hasTracked.current) return;
    hasTracked.current = true;
    revealTimestamp.current = Date.now();
    trackEvent('tlj_value_reveal_view', { savings_variant: `$${savingsLow.toLocaleString()}-$${savingsHigh.toLocaleString()}`, carat_range: caratRange }, { lead_id: state.leadId });
    trackEvent('tlj_ab_variant_shown', { variant }, { lead_id: state.leadId });

    if (variant === 'B') {
      popupTimer.current = setTimeout(() => setShowPopup(true), 3000);
    }
    return () => { if (popupTimer.current) clearTimeout(popupTimer.current); };
  }, [variant, savingsLow, savingsHigh, caratRange, state.leadId]);

  // Form handlers for Variant B popup
  const validate = () => {
    const e = {};
    if (!form.first_name.trim()) e.first_name = 'Please enter your name';
    if (!form.phone.trim()) e.phone = 'Please enter your phone number';
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Please enter a valid email';
    return e;
  };

  const handlePopupSubmit = async () => {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    setSubmitError('');
    const timeToSubmit = Date.now() - (revealTimestamp.current || Date.now());
    trackEvent('tlj_ab_form_completed', { variant: 'B', time_to_submit_ms: timeToSubmit }, { lead_id: state.leadId });
    try {
      await submitLead(form);
    } catch (err) {
      setSubmitError('Something went wrong. Please try again.');
    }
  };

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleVariantAContinue = () => {
    const timeToSubmit = Date.now() - (revealTimestamp.current || Date.now());
    trackEvent('tlj_ab_form_completed', { variant: 'A', time_to_submit_ms: timeToSubmit, action: 'clicked_continue' }, { lead_id: state.leadId });
    goNext('value_reveal');
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-10 max-w-[520px] mx-auto w-full text-center">
      <div className="w-16 h-16 rounded-full flex items-center justify-center mb-8" style={{ background: 'rgba(15,94,76,0.08)', border: '1px solid rgba(15,94,76,0.15)', opacity: revealed ? 1 : 0, transition: 'opacity 600ms var(--lj-ease)' }}><Sparkles size={28} style={{ color: 'var(--lj-accent)' }} /></div>
      <p className="text-[16px] leading-[24px] mb-4" style={{ color: 'var(--lj-muted)', opacity: revealed ? 1 : 0, transition: 'opacity 400ms var(--lj-ease)' }}>Based on what you're looking for...</p>
      <h2 className="text-[13px] leading-[18px] uppercase tracking-widest mb-3 font-medium" style={{ color: 'var(--lj-accent)', opacity: revealed ? 1 : 0, transition: 'opacity 400ms var(--lj-ease) 200ms' }}>Customers like you typically save</h2>
      <div className="mb-6" data-testid="value-reveal-savings-amount" style={{ opacity: revealed ? 1 : 0, transform: revealed ? 'translateY(0)' : 'translateY(8px)', transition: 'all 600ms var(--lj-ease) 400ms' }}>
        <span className="text-[48px] leading-[56px] font-bold" style={{ color: 'var(--lj-accent)' }}>
          {revealed ? (
            prefersReducedMotion
              ? `$${savingsLow.toLocaleString()} – $${savingsHigh.toLocaleString()}`
              : <><span>$</span><CountUp end={savingsLow} duration={1.2} separator="," /><span> – $</span><CountUp end={savingsHigh} duration={1.5} separator="," /></>
          ) : '$0'}
        </span>
      </div>
      <p className="text-[16px] leading-[24px] mb-8 max-w-sm" style={{ color: 'var(--lj-muted)', opacity: showContent ? 1 : 0, transition: 'opacity 400ms var(--lj-ease)' }}>compared to Brilliant Earth, Grown Brilliance, and retail jewelers.</p>
      <p className="text-[16px] leading-[24px] mb-8 max-w-sm italic" style={{ color: 'var(--lj-text)', opacity: showContent ? 1 : 0, transition: 'opacity 400ms var(--lj-ease) 200ms' }}>"Same GIA & IGI Certified diamonds. Same quality. You're just not paying for their marketing budget."</p>
      <div className="flex items-center gap-3 mb-10" style={{ opacity: showContent ? 1 : 0, transition: 'opacity 400ms var(--lj-ease) 400ms' }}>
        <div className="px-3 py-1.5 rounded-full text-[13px] font-medium" style={{ background: '#E8F5F1', color: 'var(--lj-accent)', border: '1px solid #C8E6DE' }}><Shield size={14} className="inline mr-1" /> GIA Certified</div>
        <div className="px-3 py-1.5 rounded-full text-[13px] font-medium" style={{ background: '#E8F5F1', color: 'var(--lj-accent)', border: '1px solid #C8E6DE' }}><Shield size={14} className="inline mr-1" /> IGI Certified</div>
      </div>

      {/* Variant A: Show CTA button */}
      {variant === 'A' && (
        <>
          <button onClick={handleVariantAContinue} data-testid="value-reveal-continue-button" className="w-full max-w-sm min-h-[52px] px-6 rounded-[14px] font-medium text-[16px] flex items-center justify-center gap-2 transition-all duration-300 active:scale-[0.99]" style={{ background: 'var(--lj-accent)', color: '#FFFFFF', boxShadow: '0 4px 20px rgba(15,94,76,0.2)', opacity: showContent ? 1 : 0, transition: 'opacity 400ms var(--lj-ease) 600ms', pointerEvents: showContent ? 'auto' : 'none' }}>Get My Personalized Quote <ArrowRight size={18} /></button>
          <p className="mt-4 text-[13px]" style={{ color: 'var(--lj-muted)', opacity: showContent ? 1 : 0, transition: 'opacity 400ms var(--lj-ease) 800ms' }}>No obligation. Private consultation.</p>
          <button onClick={goBack} className="mt-4 flex items-center gap-1.5 text-[14px] font-medium transition-colors duration-300 hover:underline" style={{ color: 'var(--lj-muted)', opacity: showContent ? 1 : 0, transition: 'opacity 400ms var(--lj-ease) 900ms' }}><ArrowLeft size={15} /> Go back and edit</button>
        </>
      )}

      {/* Variant B: No button, just trust text + back link */}
      {variant === 'B' && (
        <>
          <p className="text-[13px]" style={{ color: 'var(--lj-muted)', opacity: showContent ? 1 : 0, transition: 'opacity 400ms var(--lj-ease) 600ms' }}>No obligation. Private consultation.</p>
          <button onClick={goBack} className="mt-4 flex items-center gap-1.5 text-[14px] font-medium transition-colors duration-300 hover:underline" style={{ color: 'var(--lj-muted)', opacity: showContent ? 1 : 0, transition: 'opacity 400ms var(--lj-ease) 700ms' }}><ArrowLeft size={15} /> Go back and edit</button>
        </>
      )}

      {/* Variant B: Popup form */}
      {variant === 'B' && showPopup && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center" onClick={() => setShowPopup(false)}>
          <div className="absolute inset-0 bg-black/30" style={{ animation: 'fadeIn 300ms var(--lj-ease)' }} />
          <div
            className="relative w-full max-w-[440px] max-h-[90vh] overflow-y-auto rounded-t-[20px] sm:rounded-[20px] p-5"
            style={{ background: 'var(--lj-bg)', border: '1px solid var(--lj-border)', boxShadow: 'var(--lj-shadow-2)', animation: 'slideUp 400ms var(--lj-ease)' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Close */}
            <button onClick={() => setShowPopup(false)} className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#F0F0EE] transition-colors">
              <X size={18} style={{ color: 'var(--lj-muted)' }} />
            </button>

            {/* Header */}
            <div className="mb-5 pr-8">
              <h3 className="text-[20px] font-medium" style={{ color: 'var(--lj-text)' }}>Get your personalized quote</h3>
              <p className="text-[13px] mt-1" style={{ color: 'var(--lj-muted)' }}>We'll reach out within 24 hours with your custom pricing.</p>
            </div>

            {/* Form */}
            <div className="space-y-3">
              <div>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--lj-muted)' }} />
                  <input type="text" value={form.first_name} onChange={e => handleChange('first_name', e.target.value)} placeholder="First name *" className="w-full min-h-[44px] pl-10 pr-4 py-2.5 rounded-[10px] text-[15px]" style={{ background: 'var(--lj-surface)', border: `1.5px solid ${errors.first_name ? 'var(--lj-danger)' : 'var(--lj-border)'}`, color: 'var(--lj-text)' }} />
                </div>
                {errors.first_name && <p className="mt-1 text-[12px]" style={{ color: 'var(--lj-danger)' }}>{errors.first_name}</p>}
              </div>
              <div>
                <div className="relative">
                  <PhoneIcon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--lj-muted)' }} />
                  <input type="tel" value={form.phone} onChange={e => handleChange('phone', e.target.value)} placeholder="Phone number *" className="w-full min-h-[44px] pl-10 pr-4 py-2.5 rounded-[10px] text-[15px]" style={{ background: 'var(--lj-surface)', border: `1.5px solid ${errors.phone ? 'var(--lj-danger)' : 'var(--lj-border)'}`, color: 'var(--lj-text)' }} />
                </div>
                {errors.phone && <p className="mt-1 text-[12px]" style={{ color: 'var(--lj-danger)' }}>{errors.phone}</p>}
              </div>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--lj-muted)' }} />
                <input type="email" value={form.email} onChange={e => handleChange('email', e.target.value)} placeholder="Email (optional)" className="w-full min-h-[44px] pl-10 pr-4 py-2.5 rounded-[10px] text-[15px]" style={{ background: 'var(--lj-surface)', border: `1.5px solid ${errors.email ? 'var(--lj-danger)' : 'var(--lj-border)'}`, color: 'var(--lj-text)' }} />
              </div>
              <div className="relative">
                <MessageSquare size={16} className="absolute left-3.5 top-3" style={{ color: 'var(--lj-muted)' }} />
                <textarea value={form.notes} onChange={e => handleChange('notes', e.target.value)} placeholder="Anything else? (optional)" rows={2} className="w-full min-h-[60px] pl-10 pr-4 py-2.5 rounded-[10px] text-[15px] resize-none" style={{ background: 'var(--lj-surface)', border: '1.5px solid var(--lj-border)', color: 'var(--lj-text)' }} />
              </div>
            </div>

            {submitError && <p className="mt-2 text-[12px] text-center" style={{ color: 'var(--lj-danger)' }}>{submitError}</p>}

            <button onClick={handlePopupSubmit} disabled={state.isSubmitting} className="w-full mt-4 min-h-[48px] rounded-[14px] font-medium text-[15px] flex items-center justify-center gap-2 transition-all active:scale-[0.99]" style={{ background: 'var(--lj-accent)', color: '#FFFFFF' }}>
              {state.isSubmitting ? <><Loader2 size={16} className="animate-spin" /> Submitting...</> : <><span>Get My Free Quote</span><ArrowRight size={16} /></>}
            </button>

            <div className="flex items-center justify-center gap-1.5 mt-3">
              <Lock size={12} style={{ color: 'var(--lj-muted)' }} />
              <p className="text-[11px]" style={{ color: 'var(--lj-muted)' }}>Your info stays private. No spam, ever.</p>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
