import React from 'react';
import { Star, Shield, Users, ArrowRight, ChevronRight } from 'lucide-react';
import { useWizard } from '../../context/WizardContext';
import { trackEvent } from '../../utils/analytics';

const HERO_IMAGE = 'https://images.unsplash.com/photo-1605089315716-64d4e9696796?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=800';

export default function LandingScreen() {
  const { startWizard, state } = useWizard();

  const handleStartWizard = async () => {
    trackEvent('tlj_cta_start_click', { cta_id: 'hero_cta' });
    await startWizard();
  };

  React.useEffect(() => {
    trackEvent('tlj_landing_view', { session_id: state.sessionId });
  }, [state.sessionId]);

  return (
    <div className="flex-1 flex flex-col">
      {/* Hero Section */}
      <div className="relative px-4 pt-8 pb-12 flex flex-col items-center text-center">
        {/* Hero Image */}
        <div 
          className="w-48 h-48 md:w-56 md:h-56 rounded-full overflow-hidden mb-8 mx-auto"
          style={{ 
            boxShadow: '0 0 60px rgba(201, 168, 106, 0.15), var(--lj-shadow-2)',
            border: '2px solid rgba(201, 168, 106, 0.2)',
          }}
        >
          <img 
            src={HERO_IMAGE}
            alt="Premium diamond ring"
            className="w-full h-full object-cover"
            loading="eager"
          />
        </div>
        
        {/* Headline */}
        <h1 
          className="text-[28px] leading-[34px] font-semibold tracking-[-0.01em] mb-4 max-w-md"
          style={{ color: 'var(--lj-text)' }}
        >
          Get Your Dream Ring Without the Markup
        </h1>
        
        {/* Subtext */}
        <p 
          className="text-[16px] leading-[24px] mb-8 max-w-sm"
          style={{ color: 'var(--lj-muted)' }}
        >
          Same GIA & IGI Certified diamonds. Same quality settings. Fraction of the price.
        </p>
        
        {/* Cert Logos */}
        <div className="flex items-center gap-4 mb-8">
          <div 
            className="px-3 py-1.5 rounded-full text-[13px] font-medium"
            style={{ 
              background: '#1B1610', 
              color: 'var(--lj-accent-2)',
              border: '1px solid #2B241A',
            }}
          >
            GIA Certified
          </div>
          <div 
            className="px-3 py-1.5 rounded-full text-[13px] font-medium"
            style={{ 
              background: '#1B1610', 
              color: 'var(--lj-accent-2)',
              border: '1px solid #2B241A',
            }}
          >
            IGI Certified
          </div>
        </div>
        
        {/* CTA Button */}
        <button
          onClick={handleStartWizard}
          data-testid="landing-start-wizard-button"
          className="w-full max-w-sm min-h-[52px] px-6 rounded-[14px] font-medium text-[16px] flex items-center justify-center gap-2 transition-all duration-300 active:scale-[0.99]"
          style={{ 
            background: 'var(--lj-accent)', 
            color: '#0B0B0C',
            boxShadow: '0 4px 20px rgba(201, 168, 106, 0.25)',
          }}
        >
          Get My Free Quote
          <ArrowRight size={18} />
        </button>
        
        {/* Secondary link */}
        <a 
          href="https://thelocaljewel.com" 
          target="_blank" 
          rel="noopener noreferrer"
          className="mt-4 text-[13px] leading-[18px] flex items-center gap-1 transition-colors duration-300"
          style={{ color: 'var(--lj-muted)' }}
        >
          or browse our collection <ChevronRight size={14} />
        </a>
      </div>
      
      {/* Social Proof Bar */}
      <div 
        className="px-4 py-5 flex items-center justify-center gap-6 md:gap-10 overflow-x-auto"
        style={{ 
          borderTop: '1px solid var(--lj-border)',
          borderBottom: '1px solid var(--lj-border)',
        }}
      >
        <div className="flex items-center gap-2 flex-shrink-0">
          <Star size={16} style={{ color: 'var(--lj-accent)' }} fill="var(--lj-accent)" />
          <span className="text-[13px] leading-[18px] whitespace-nowrap" style={{ color: 'var(--lj-muted)' }}>
            <strong style={{ color: 'var(--lj-text)' }}>4.7</strong> stars (70+ reviews)
          </span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Users size={16} style={{ color: 'var(--lj-accent)' }} />
          <span className="text-[13px] leading-[18px] whitespace-nowrap" style={{ color: 'var(--lj-muted)' }}>
            <strong style={{ color: 'var(--lj-text)' }}>100+</strong> happy customers
          </span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Shield size={16} style={{ color: 'var(--lj-accent)' }} />
          <span className="text-[13px] leading-[18px] whitespace-nowrap" style={{ color: 'var(--lj-muted)' }}>
            Avg. <strong style={{ color: 'var(--lj-text)' }}>$5,000</strong> saved
          </span>
        </div>
      </div>
      
      {/* Testimonials Section */}
      <div className="px-4 py-10">
        <h2 className="text-[22px] leading-[28px] font-medium mb-6 text-center" style={{ color: 'var(--lj-text)' }}>
          What Our Clients Say
        </h2>
        <div className="space-y-4 max-w-md mx-auto">
          {[
            { name: 'Sarah M.', text: 'AJ found me the perfect engagement ring at nearly half the price of what I was quoted at a retail jeweler. The quality is incredible.', rating: 5 },
            { name: 'Mike T.', text: 'Saved over $6,000 on my wife\'s anniversary ring. Same GIA certified diamond, better price. Highly recommend.', rating: 5 },
            { name: 'Jessica L.', text: 'The personalized service was outstanding. AJ took the time to understand exactly what I wanted and delivered beyond expectations.', rating: 5 },
          ].map((review, i) => (
            <div 
              key={i}
              className="p-5 rounded-[14px]"
              style={{ 
                background: 'var(--lj-surface)', 
                border: '1px solid var(--lj-border)',
              }}
            >
              <div className="flex items-center gap-1 mb-3">
                {Array.from({ length: review.rating }).map((_, j) => (
                  <Star key={j} size={14} fill="var(--lj-accent)" style={{ color: 'var(--lj-accent)' }} />
                ))}
              </div>
              <p className="text-[16px] leading-[24px] mb-3" style={{ color: 'var(--lj-text)' }}>
                "{review.text}"
              </p>
              <span className="text-[13px] leading-[18px]" style={{ color: 'var(--lj-muted)' }}>
                \u2014 {review.name}
              </span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Bottom CTA */}
      <div className="px-4 pb-10 flex justify-center">
        <button
          onClick={handleStartWizard}
          data-testid="landing-bottom-cta"
          className="w-full max-w-sm min-h-[52px] px-6 rounded-[14px] font-medium text-[16px] flex items-center justify-center gap-2 transition-all duration-300 active:scale-[0.99]"
          style={{ 
            background: 'var(--lj-accent)', 
            color: '#0B0B0C',
            boxShadow: '0 4px 20px rgba(201, 168, 106, 0.25)',
          }}
        >
          Start Your Custom Quote
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
