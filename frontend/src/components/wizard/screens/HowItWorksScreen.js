import React, { useEffect } from 'react';
import { ArrowLeft, ArrowRight, PenTool, Eye, Gem, Sparkles, ShieldCheck, Clock } from 'lucide-react';
import { useWizard } from '../../../context/WizardContext';
import { trackEvent } from '../../../utils/analytics';

const STEPS = [
  {
    n: '01',
    icon: PenTool,
    eyebrow: 'Step 1',
    title: 'Share your vision',
    desc:
      "Tell us about your dream piece — a Pinterest screenshot, a rough sketch, or just a feeling. No idea is too wild. We've built one-of-a-kind alphabet diamonds, hidden halos, and pieces no one else can.",
    accent: 'Inspiration · Sketches · Ideas',
  },
  {
    n: '02',
    icon: Eye,
    eyebrow: 'Step 2',
    title: 'See it in 3D — before we cut a stone',
    desc:
      'Within 24–48 hours, our designers send you photorealistic 3D renders of your piece from every angle. Request unlimited edits until it looks exactly the way you imagined.',
    accent: 'Photoreal renders · Unlimited revisions',
  },
  {
    n: '03',
    icon: Gem,
    eyebrow: 'Step 3',
    title: "Once it's perfect, we build it",
    desc:
      'Master jewelers handcraft your piece using IGI/GIA-certified diamonds and ethically-sourced metals. Free insured shipping anywhere in the world, with photos at every milestone.',
    accent: 'IGI / GIA certified · Insured global shipping',
  },
];

const ASSURANCES = [
  { icon: Clock, label: '24-48 hr design turnaround' },
  { icon: ShieldCheck, label: 'No charge until you approve the design' },
  { icon: Sparkles, label: 'Custom cuts no one else can make' },
];

export default function HowItWorksScreen() {
  const { goNext, dispatch, state } = useWizard();

  useEffect(() => {
    trackEvent('tlj_howitworks_view', {}, { lead_id: state.leadId });
  }, [state.leadId]);

  const handleContinue = () => {
    trackEvent('tlj_howitworks_continue', {}, { lead_id: state.leadId });
    goNext('how_it_works');
  };

  const handleBack = () => {
    trackEvent('tlj_howitworks_back', {}, { lead_id: state.leadId });
    dispatch({ type: 'SET_SCREEN', screen: 'landing' });
  };

  return (
    <div
      data-testid="how-it-works-screen"
      className="flex-1 flex flex-col"
      style={{ background: 'var(--lj-bg)' }}
    >
      {/* Back button — top-left, contextually scoped to this screen */}
      <div className="px-4 pt-4">
        <button
          onClick={handleBack}
          data-testid="how-it-works-back-button"
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-[14px] font-medium transition-colors duration-300 hover:bg-[#F0F0EE]"
          style={{ color: 'var(--lj-accent)' }}
          aria-label="Go back to home"
        >
          <ArrowLeft size={18} />
          <span>Back</span>
        </button>
      </div>

      {/* Hero */}
      <div className="px-4 pt-4 pb-6 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5"
          style={{ background: 'rgba(15,94,76,0.08)', border: '1px solid rgba(15,94,76,0.15)' }}>
          <Sparkles size={13} style={{ color: 'var(--lj-accent)' }} />
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: 'var(--lj-accent)' }}>
            Custom Design Studio
          </span>
        </div>
        <h1
          className="text-[34px] sm:text-[40px] leading-[1.1] font-semibold tracking-[-0.02em] max-w-xl mx-auto mb-4"
          style={{ color: 'var(--lj-text)', fontFamily: 'var(--lj-serif, "Cormorant Garamond", "Playfair Display", Georgia, serif)' }}
        >
          Here's how it works.
        </h1>
        <p className="text-[16px] sm:text-[17px] leading-[1.55] max-w-md mx-auto" style={{ color: 'var(--lj-muted)' }}>
          Three simple steps to your dream piece — designed with you, made for you.
        </p>
      </div>

      {/* Steps */}
      <div className="px-4 pb-2">
        <div className="max-w-2xl mx-auto relative">
          {/* vertical connector line */}
          <div
            aria-hidden="true"
            className="absolute left-[35px] sm:left-[39px] top-[60px] bottom-[60px] w-px"
            style={{ background: 'linear-gradient(to bottom, transparent, var(--lj-border) 12%, var(--lj-border) 88%, transparent)' }}
          />

          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <div
                key={step.n}
                data-testid={`how-it-works-step-${i + 1}`}
                className="relative flex gap-4 sm:gap-6 py-6 first:pt-2 last:pb-2"
                style={{
                  opacity: 0,
                  animation: `tljFadeUp 600ms var(--lj-ease, cubic-bezier(0.22, 1, 0.36, 1)) ${i * 140}ms forwards`,
                }}
              >
                {/* Step badge */}
                <div className="relative flex-shrink-0">
                  <div
                    className="w-[72px] h-[72px] sm:w-[80px] sm:h-[80px] rounded-full flex items-center justify-center relative z-10"
                    style={{
                      background: 'var(--lj-surface, #FFFFFF)',
                      border: '1px solid var(--lj-border)',
                      boxShadow: '0 8px 28px rgba(15,94,76,0.08), 0 2px 6px rgba(0,0,0,0.04)',
                    }}
                  >
                    <Icon size={26} strokeWidth={1.5} style={{ color: 'var(--lj-accent)' }} />
                  </div>
                  <div
                    className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold z-20"
                    style={{
                      background: 'var(--lj-accent)',
                      color: '#FFFFFF',
                      boxShadow: '0 2px 6px rgba(15,94,76,0.3)',
                    }}
                  >
                    {step.n}
                  </div>
                </div>

                {/* Step content */}
                <div className="flex-1 min-w-0 pt-1">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.16em] mb-1.5" style={{ color: 'var(--lj-accent)', opacity: 0.85 }}>
                    {step.eyebrow}
                  </div>
                  <h3
                    className="text-[22px] sm:text-[24px] leading-[1.2] font-semibold mb-2 tracking-[-0.01em]"
                    style={{ color: 'var(--lj-text)', fontFamily: 'var(--lj-serif, "Cormorant Garamond", "Playfair Display", Georgia, serif)' }}
                  >
                    {step.title}
                  </h3>
                  <p className="text-[15px] leading-[1.6] mb-3" style={{ color: 'var(--lj-muted)' }}>
                    {step.desc}
                  </p>
                  <div
                    className="inline-flex items-center text-[12px] font-medium px-2.5 py-1 rounded-full"
                    style={{
                      background: 'rgba(15,94,76,0.06)',
                      color: 'var(--lj-accent)',
                      border: '1px solid rgba(15,94,76,0.12)',
                    }}
                  >
                    {step.accent}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Assurances */}
      <div className="px-4 mt-2 mb-8">
        <div
          className="max-w-2xl mx-auto rounded-[18px] px-5 py-5 sm:px-6 sm:py-6"
          style={{
            background: 'var(--lj-surface, #FFFFFF)',
            border: '1px solid var(--lj-border)',
          }}
        >
          <div className="grid sm:grid-cols-3 gap-4 sm:gap-3">
            {ASSURANCES.map((a, i) => {
              const Icon = a.icon;
              return (
                <div key={i} className="flex items-center gap-2.5 sm:flex-col sm:text-center">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(15,94,76,0.08)' }}
                  >
                    <Icon size={16} style={{ color: 'var(--lj-accent)' }} />
                  </div>
                  <span className="text-[13px] leading-[1.35] font-medium" style={{ color: 'var(--lj-text)' }}>
                    {a.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="px-4 pb-12 flex flex-col items-center">
        <button
          onClick={handleContinue}
          data-testid="how-it-works-continue-button"
          className="w-full max-w-sm min-h-[54px] px-6 rounded-[14px] font-medium text-[16px] flex items-center justify-center gap-2 transition-all duration-300 active:scale-[0.99] hover:opacity-95"
          style={{
            background: 'var(--lj-accent)',
            color: '#FFFFFF',
            boxShadow: '0 4px 22px rgba(15,94,76,0.22)',
          }}
        >
          Start designing my piece
          <ArrowRight size={18} />
        </button>
        <p className="mt-3 text-[12px]" style={{ color: 'var(--lj-muted)' }}>
          Takes about 90 seconds · No payment required
        </p>
      </div>

      {/* Local animation keyframes — scoped via styled tag */}
      <style>{`
        @keyframes tljFadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
