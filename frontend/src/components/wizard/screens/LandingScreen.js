import React, { useState } from 'react';
import { Star, Shield, Users, ArrowRight, ChevronRight, ChevronDown, ChevronLeft, ExternalLink } from 'lucide-react';
import { useWizard } from '../../../context/WizardContext';
import { trackEvent } from '../../../utils/analytics';

const HERO_IMAGE = 'https://images.unsplash.com/photo-1605089315716-64d4e9696796?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=800';

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

// Real Etsy reviews scraped from thelocaljewel shop
const ETSY_REVIEWS = [
  { name: 'Narindra', date: 'Feb 13, 2026', rating: 5, text: "The store's communication is prompt, responsive, and respectful. Great quality. Would recommend.", product: '4.4ct Radiant Diamond Ring – Hidden Halo – 14K White Gold', productImg: 'https://i.etsystatic.com/6823344673/r/il/e5be99/6823344673/il_170x135.6823344673_akr1.jpg', customerImg: 'https://i.etsystatic.com/iap/bf7cda/7755045309/iap_300x300.7755045309_guh7483e.jpg' },
  { name: 'Eesa', date: 'Jun 20, 2025', rating: 5, text: "Absolutely blown away. The ring is stunning, sparkles like crazy, beautifully made, and exactly as described. It even comes in a sleek box with a light at the top. Shipping was fast, seller was great.", product: '3.32ct Oval IGI Certified Ring – Hidden Halo – White Gold', productImg: 'https://i.etsystatic.com/6625116803/r/il/acc787/6625116803/il_170x135.6625116803_8utf.jpg', customerImg: 'https://i.etsystatic.com/iap/54d3bc/6957003366/iap_300x300.6957003366_j5hy4cnq.jpg' },
  { name: 'Pam', date: 'Nov 26, 2025', rating: 5, text: "This ring is absolutely beautiful! High quality, brilliant shine and sparkles. The owner communicates exceptionally, letting me know where in the process everything is. I highly recommend. I'll certainly be a repeat customer.", product: '3.30ct Pear Shaped Ring – Hidden Halo – 14K White Gold', productImg: 'https://i.etsystatic.com/6794562112/r/il/516b8f/6794562112/il_170x135.6794562112_a19b.jpg' },
  { name: 'ULT', date: 'Jul 23, 2025', rating: 5, text: "Came super fast! Ansh the owner was very helpful during the buying process, quality of the item was superb for the price. Will be a returning customer, such an awesome experience.", product: '4.4ct Radiant Diamond Ring – Hidden Halo – 14K White Gold', productImg: 'https://i.etsystatic.com/6823344673/r/il/e5be99/6823344673/il_170x135.6823344673_akr1.jpg', customerImg: 'https://i.etsystatic.com/iap/5fa4c6/7093470467/iap_300x300.7093470467_owf00rzy.jpg' },
  { name: 'Russell Stacy', date: 'Jan 19, 2026', rating: 5, text: "Very beautiful craftsmanship. Ring met more than our expectations.", product: '4.12ct Radiant Ring – 14K Yellow Gold Hidden Halo', productImg: 'https://i.etsystatic.com/6557149529/r/il/c58bdd/6557149529/il_170x135.6557149529_j2mm.jpg' },
  { name: 'Gina Schroeder', date: 'Jun 21, 2025', rating: 5, text: "This ring is beautiful! And I couldn't believe how fast the seller got it to me. I would highly recommend them. Will be ordering from them again.", product: '3.32ct Oval IGI Certified Ring – Hidden Halo – White Gold', productImg: 'https://i.etsystatic.com/6625116803/r/il/acc787/6625116803/il_170x135.6625116803_8utf.jpg' },
  { name: 'Jamie Pung', date: 'May 21, 2025', rating: 5, text: "Even more beautiful in person. We couldn't be happier with this ring!", product: '2.03ct Oval IGI Certified Ring – Solitaire – 14K White Gold', productImg: 'https://i.etsystatic.com/6665834265/r/il/9c1489/6665834265/il_170x135.6665834265_ee2y.jpg' },
  { name: 'Gina Osmer', date: 'Apr 17, 2025', rating: 5, text: "Beautiful ring and courteous customer service! Responded to my questions immediately!", product: '4.4ct Radiant Diamond Ring – Hidden Halo – 14K White Gold', productImg: 'https://i.etsystatic.com/6823344673/r/il/e5be99/6823344673/il_170x135.6823344673_akr1.jpg' },
];

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
        <h1 className="text-[28px] leading-[34px] font-semibold tracking-[-0.01em] mb-5 max-w-md" style={{ color: 'var(--lj-text)' }}>
          Join a community that buys diamond jewelry the smarter way.
        </h1>

        {/* Savings Proof — inline above badges */}
        <p className="text-[18px] leading-[26px] mb-2 max-w-sm" style={{ color: 'var(--lj-text)' }}>
          On average, our clients save <span className="font-semibold" style={{ color: 'var(--lj-accent)' }}>{COMPARISON.savingsAmount}</span>/piece.
        </p>
        <p className="text-[14px] leading-[20px] mb-5" style={{ color: 'var(--lj-muted)' }}>
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
