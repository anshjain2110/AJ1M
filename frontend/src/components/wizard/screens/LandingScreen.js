import React, { useState } from 'react';
import { Star, Shield, Users, ArrowRight, ChevronRight, ChevronDown } from 'lucide-react';
import { useWizard } from '../../../context/WizardContext';
import { trackEvent } from '../../../utils/analytics';

const HERO_IMAGE = 'https://images.unsplash.com/photo-1605089315716-64d4e9696796?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=800';

// Configurable comparison data (easy to update / admin-configurable later)
const COMPARISON = {
  savingsAmount: '$4,200',
  example: {
    ringType: '1.5ct Oval Solitaire Engagement Ring',
    centerStone: '1.52ct Oval',
    colorClarity: 'F / VS1',
    metal: '14k White Gold',
    certification: 'GIA Certified',
    retailPrice: '$12,800',
    tljPrice: '$8,600',
    savings: '$4,200',
  },
};

export default function LandingScreen() {
  const { startWizard, state } = useWizard();
  const [compareOpen, setCompareOpen] = useState(false);

  const handleStartWizard = async () => {
    trackEvent('tlj_cta_start_click', { cta_id: 'hero_cta' });
    await startWizard();
  };

  const handleCompareOpen = () => {
    if (!compareOpen) {
      trackEvent('tlj_savings_compare_open', {});
    }
    setCompareOpen(!compareOpen);
  };

  const handleSavingsCta = async () => {
    trackEvent('tlj_savings_cta_click', {});
    await startWizard();
  };

  React.useEffect(() => {
    trackEvent('tlj_landing_view', { session_id: state.sessionId });
  }, [state.sessionId]);

  const ex = COMPARISON.example;

  return (
    <div className="flex-1 flex flex-col">
      {/* Hero */}
      <div className="relative px-4 pt-8 pb-12 flex flex-col items-center text-center">
        <div
          className="w-48 h-48 md:w-56 md:h-56 rounded-full overflow-hidden mb-8 mx-auto"
          style={{ boxShadow: '0 0 60px rgba(15,94,76,0.1), var(--lj-shadow-2)', border: '2px solid rgba(15,94,76,0.15)' }}
        >
          <img src={HERO_IMAGE} alt="Premium diamond ring" className="w-full h-full object-cover" loading="eager" />
        </div>
        <h1 className="text-[28px] leading-[34px] font-semibold tracking-[-0.01em] mb-4 max-w-md" style={{ color: 'var(--lj-text)' }}>
          Get Your Dream Ring Without the Markup
        </h1>

        {/* Savings Proof — inline above badges */}
        <p className="text-[16px] leading-[24px] mb-2 max-w-sm" style={{ color: 'var(--lj-text)' }}>
          On average, our clients save <span className="font-semibold" style={{ color: 'var(--lj-accent)' }}>{COMPARISON.savingsAmount}</span> per piece.
        </p>
        <p className="text-[14px] leading-[20px] mb-4" style={{ color: 'var(--lj-muted)' }}>
          Compared to traditional retail jewelry pricing.
        </p>

        {/* Expand trigger */}
        <button
          onClick={handleCompareOpen}
          data-testid="savings-compare-trigger"
          className="flex items-center gap-1.5 mb-5 text-[14px] font-medium transition-colors duration-300 hover:opacity-80"
          style={{ color: 'var(--lj-accent)' }}
        >
          {compareOpen ? 'Hide comparison' : 'See a real comparison'}
          <ChevronDown size={16} className="transition-transform duration-300" style={{ transform: compareOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
        </button>

        {/* Inline accordion — comparison table */}
        <div
          className="w-full max-w-lg overflow-hidden transition-all duration-500 mb-4"
          style={{ maxHeight: compareOpen ? '800px' : '0px', opacity: compareOpen ? 1 : 0 }}
        >
          <div className="grid md:grid-cols-2 gap-3">
            {/* Traditional Retail */}
            <div className="p-4 rounded-[14px]" style={{ background: 'var(--lj-surface)', border: '1px solid var(--lj-border)' }}>
              <h4 className="text-[13px] font-medium mb-3 text-center" style={{ color: 'var(--lj-muted)' }}>Traditional Retail</h4>
              <div className="space-y-2.5">
                {[['Ring Type', ex.ringType], ['Center Stone', ex.centerStone], ['Color / Clarity', ex.colorClarity], ['Metal', ex.metal], ['Certification', ex.certification]].map(([label, value]) => (
                  <div key={label} className="flex justify-between text-[13px]">
                    <span style={{ color: 'var(--lj-muted)' }}>{label}</span>
                    <span className="font-medium text-right" style={{ color: 'var(--lj-text)' }}>{value}</span>
                  </div>
                ))}
                <div className="pt-2.5 mt-2.5" style={{ borderTop: '1px solid var(--lj-border)' }}>
                  <div className="flex justify-between items-center">
                    <span className="text-[13px]" style={{ color: 'var(--lj-muted)' }}>Price</span>
                    <span className="text-[18px] font-semibold" style={{ color: 'var(--lj-text)' }}>{ex.retailPrice}</span>
                  </div>
                </div>
              </div>
            </div>
            {/* The Local Jewel */}
            <div className="p-4 rounded-[14px]" style={{ background: 'var(--lj-surface)', border: '2px solid var(--lj-accent)' }}>
              <h4 className="text-[13px] font-medium mb-3 text-center" style={{ color: 'var(--lj-accent)' }}>The Local Jewel</h4>
              <div className="space-y-2.5">
                {[['Ring Type', ex.ringType], ['Center Stone', ex.centerStone], ['Color / Clarity', ex.colorClarity], ['Metal', ex.metal], ['Certification', ex.certification]].map(([label, value]) => (
                  <div key={label} className="flex justify-between text-[13px]">
                    <span style={{ color: 'var(--lj-muted)' }}>{label}</span>
                    <span className="font-medium text-right" style={{ color: 'var(--lj-text)' }}>{value}</span>
                  </div>
                ))}
                <div className="pt-2.5 mt-2.5" style={{ borderTop: '1px solid rgba(15,94,76,0.2)' }}>
                  <div className="flex justify-between items-center">
                    <span className="text-[13px]" style={{ color: 'var(--lj-muted)' }}>Price</span>
                    <span className="text-[18px] font-semibold" style={{ color: 'var(--lj-accent)' }}>{ex.tljPrice}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4 text-center">
            <p className="text-[14px] mb-3" style={{ color: 'var(--lj-text)' }}>Estimated savings: <span className="font-semibold text-[16px]" style={{ color: 'var(--lj-accent)' }}>{ex.savings}</span></p>
            <button onClick={handleSavingsCta} data-testid="savings-cta-button" className="min-h-[44px] px-6 rounded-[14px] font-medium text-[14px] inline-flex items-center gap-2 transition-all duration-300 active:scale-[0.99]" style={{ background: 'var(--lj-accent)', color: '#FFFFFF' }}>See my savings <ArrowRight size={16} /></button>
            <p className="mt-3 text-[11px]" style={{ color: 'var(--lj-muted)', opacity: 0.7 }}>Example based on a recent client purchase and comparable retail pricing.</p>
          </div>
        </div>

        <div className="flex items-center gap-4 mb-8">
          <div className="px-3 py-1.5 rounded-full text-[13px] font-medium" style={{ background: '#E8F5F1', color: 'var(--lj-accent)', border: '1px solid #C8E6DE' }}>GIA Certified</div>
          <div className="px-3 py-1.5 rounded-full text-[13px] font-medium" style={{ background: '#E8F5F1', color: 'var(--lj-accent)', border: '1px solid #C8E6DE' }}>IGI Certified</div>
        </div>
        <button onClick={handleStartWizard} data-testid="landing-start-wizard-button"
          className="w-full max-w-sm min-h-[52px] px-6 rounded-[14px] font-medium text-[16px] flex items-center justify-center gap-2 transition-all duration-300 active:scale-[0.99]"
          style={{ background: 'var(--lj-accent)', color: '#FFFFFF', boxShadow: '0 4px 20px rgba(15,94,76,0.2)' }}>
          Get My Free Quote <ArrowRight size={18} />
        </button>
        <a href="https://thelocaljewel.com" target="_blank" rel="noopener noreferrer"
          className="mt-4 text-[13px] leading-[18px] flex items-center gap-1 transition-colors duration-300" style={{ color: 'var(--lj-muted)' }}>
          or browse our collection <ChevronRight size={14} />
        </a>
      </div>

      {/* Social Proof Bar */}
      <div className="px-4 py-5 flex items-center justify-center gap-6 md:gap-10 overflow-x-auto" style={{ borderTop: '1px solid var(--lj-border)', borderBottom: '1px solid var(--lj-border)' }}>
        <div className="flex items-center gap-2 flex-shrink-0"><Star size={16} style={{ color: 'var(--lj-accent)' }} fill="var(--lj-accent)" /><span className="text-[13px] whitespace-nowrap" style={{ color: 'var(--lj-muted)' }}><strong style={{ color: 'var(--lj-text)' }}>4.7</strong> stars (70+ reviews)</span></div>
        <div className="flex items-center gap-2 flex-shrink-0"><Users size={16} style={{ color: 'var(--lj-accent)' }} /><span className="text-[13px] whitespace-nowrap" style={{ color: 'var(--lj-muted)' }}><strong style={{ color: 'var(--lj-text)' }}>100+</strong> happy customers</span></div>
        <div className="flex items-center gap-2 flex-shrink-0"><Shield size={16} style={{ color: 'var(--lj-accent)' }} /><span className="text-[13px] whitespace-nowrap" style={{ color: 'var(--lj-muted)' }}>Avg. <strong style={{ color: 'var(--lj-text)' }}>$5,000</strong> saved</span></div>
      </div>

      {/* Testimonials */}
      <div className="px-4 py-10" style={{ borderTop: '1px solid var(--lj-border)' }}>
        <h2 className="text-[22px] leading-[28px] font-medium mb-6 text-center" style={{ color: 'var(--lj-text)' }}>What Our Clients Say</h2>
        <div className="space-y-4 max-w-md mx-auto">
          {[
            { name: 'Sarah M.', text: 'AJ found me the perfect engagement ring at nearly half the price of what I was quoted at a retail jeweler. The quality is incredible.', rating: 5 },
            { name: 'Mike T.', text: "Saved over $6,000 on my wife's anniversary ring. Same GIA certified diamond, better price. Highly recommend.", rating: 5 },
            { name: 'Jessica L.', text: 'The personalized service was outstanding. AJ took the time to understand exactly what I wanted and delivered beyond expectations.', rating: 5 },
          ].map((review, i) => (
            <div key={i} className="p-5 rounded-[14px]" style={{ background: 'var(--lj-surface)', border: '1px solid var(--lj-border)' }}>
              <div className="flex items-center gap-1 mb-3">
                {Array.from({ length: review.rating }).map((_, j) => (
                  <Star key={j} size={14} fill="var(--lj-accent)" style={{ color: 'var(--lj-accent)' }} />
                ))}
              </div>
              <p className="text-[16px] leading-[24px] mb-3" style={{ color: 'var(--lj-text)' }}>"{review.text}"</p>
              <span className="text-[13px] leading-[18px]" style={{ color: 'var(--lj-muted)' }}>— {review.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="px-4 pb-10 flex justify-center">
        <button onClick={handleStartWizard} data-testid="landing-bottom-cta"
          className="w-full max-w-sm min-h-[52px] px-6 rounded-[14px] font-medium text-[16px] flex items-center justify-center gap-2 transition-all duration-300 active:scale-[0.99]"
          style={{ background: 'var(--lj-accent)', color: '#FFFFFF', boxShadow: '0 4px 20px rgba(15,94,76,0.2)' }}>
          Start Your Custom Quote <ArrowRight size={18} />
        </button>
      </div>

      {/* Footer */}
      <div className="px-4 py-8 text-center" style={{ borderTop: '1px solid var(--lj-border)' }}>
        <p className="text-[13px] mb-3" style={{ color: 'var(--lj-muted)' }}>
          Already submitted a quote? <a href="/login" className="font-medium underline" style={{ color: 'var(--lj-accent)' }}>Login to your account</a>
        </p>
        <a href="/admin/login" className="text-[12px]" style={{ color: 'var(--lj-muted)', opacity: 0.5 }}>Admin</a>
      </div>
    </div>
  );
}
