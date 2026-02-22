import React, { useState } from 'react';
import { Star, Shield, Users, ArrowRight, ChevronRight, ChevronDown, ChevronLeft, ExternalLink } from 'lucide-react';
import { useWizard } from '../../../context/WizardContext';
import { trackEvent } from '../../../utils/analytics';

const HERO_IMAGE = '/hero-photo.jpeg';

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

      {/* Etsy Reviews Section */}
      <div className="px-4 py-10" style={{ borderTop: '1px solid var(--lj-border)' }}>
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-[22px] leading-[28px] font-medium mb-1" style={{ color: 'var(--lj-text)' }}>Verified Etsy Reviews</h2>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={14} fill={i < 4 ? 'var(--lj-accent)' : 'none'} style={{ color: 'var(--lj-accent)' }} />)}
                </div>
                <span className="text-[14px] font-medium" style={{ color: 'var(--lj-text)' }}>4.93</span>
                <span className="text-[13px]" style={{ color: 'var(--lj-muted)' }}>(15 reviews)</span>
              </div>
            </div>
            <a href="https://www.etsy.com/shop/thelocaljewel#reviews" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium transition-colors hover:bg-[#F0F0EE]" style={{ color: 'var(--lj-accent)', border: '1px solid var(--lj-border)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="var(--lj-accent)"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm4.95 16.95l-2.55-4.41-2.55 4.41-4.95-.72 3.6-3.51-.84-4.95L12 9.18l2.34-1.41-.84 4.95 3.6 3.51-4.95.72z"/></svg>
              View on Etsy <ExternalLink size={12} />
            </a>
          </div>

          {/* Reviews carousel */}
          <div className="space-y-4">
            {ETSY_REVIEWS.slice(0, 5).map((review, i) => (
              <div key={i} className="p-5 rounded-[14px]" style={{ background: 'var(--lj-surface)', border: '1px solid var(--lj-border)' }}>
                {/* Review header */}
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-[14px] font-semibold" style={{ background: 'rgba(15,94,76,0.08)', color: 'var(--lj-accent)' }}>
                    {review.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-[14px] font-medium" style={{ color: 'var(--lj-text)' }}>{review.name}</span>
                      <span className="text-[12px]" style={{ color: 'var(--lj-muted)' }}>{review.date}</span>
                    </div>
                    <div className="flex items-center gap-0.5 mt-0.5">
                      {Array.from({ length: review.rating }).map((_, j) => <Star key={j} size={12} fill="var(--lj-accent)" style={{ color: 'var(--lj-accent)' }} />)}
                    </div>
                  </div>
                </div>

                {/* Review text */}
                <p className="text-[15px] leading-[22px] mb-3" style={{ color: 'var(--lj-text)' }}>"{review.text}"</p>

                {/* Product + customer photos */}
                <div className="flex items-center gap-3">
                  {review.productImg && (
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <img src={review.productImg} alt={review.product} className="w-11 h-11 rounded-[8px] object-cover flex-shrink-0" style={{ border: '1px solid var(--lj-border)' }} />
                      <span className="text-[12px] leading-[16px] truncate" style={{ color: 'var(--lj-muted)' }}>{review.product}</span>
                    </div>
                  )}
                  {review.customerImg && (
                    <img src={review.customerImg} alt="Customer photo" className="w-14 h-14 rounded-[8px] object-cover flex-shrink-0" style={{ border: '1px solid var(--lj-border)' }} />
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* View all link */}
          <div className="mt-5 text-center">
            <a href="https://www.etsy.com/shop/thelocaljewel#reviews" target="_blank" rel="noopener noreferrer" className="text-[14px] font-medium inline-flex items-center gap-1.5 transition-colors hover:opacity-80" style={{ color: 'var(--lj-accent)' }}>
              See all 15 reviews on Etsy <ExternalLink size={14} />
            </a>
          </div>
        </div>
      </div>

      {/* Instagram Feed Section */}
      <div className="py-10" style={{ borderTop: '1px solid var(--lj-border)' }}>
        <div className="px-4 max-w-2xl mx-auto mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-[22px] leading-[28px] font-medium" style={{ color: 'var(--lj-text)' }}>Follow Us on Instagram</h2>
            <p className="text-[14px] mt-1" style={{ color: 'var(--lj-muted)' }}>@thelocaljewel</p>
          </div>
          <a href="https://www.instagram.com/thelocaljewel" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-medium transition-colors hover:bg-[#F0F0EE]" style={{ color: 'var(--lj-accent)', border: '1px solid var(--lj-border)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
            Follow <ExternalLink size={12} />
          </a>
        </div>
        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex gap-1 px-4" style={{ width: 'max-content' }}>
            {[
              { img: 'https://scontent.cdninstagram.com/v/t51.82787-15/554685583_17896498668302708_5017119465267370785_n.jpg?stp=dst-jpg_e35_tt6&_nc_cat=111&ccb=7-5&_nc_sid=18de74&_nc_ohc=xfZaZdKkajQQ7kNvwH64gdP&_nc_zt=23&_nc_ht=scontent.cdninstagram.com&oh=00_AfsQW-JlWIr1y3ZBezBrZY_aztjGt3OP7BrPqxLdGNS8hg&oe=699E5942', caption: 'Red flags when buying diamonds' },
              { img: 'https://scontent.cdninstagram.com/v/t51.82787-15/551387339_17896213902302708_1785570489136753055_n.jpg?stp=dst-jpg_e35_tt6&_nc_cat=105&ccb=7-5&_nc_sid=18de74&_nc_ohc=sBzehxTF58kQ7kNvwEvb2kJ&_nc_zt=23&_nc_ht=scontent.cdninstagram.com&oh=00_Afuw3P6YAUyBG1JKxNMQLQKC2yyr1ebtM1ae9A0_vunwfg&oe=699E5AEF', caption: 'Crafted with love' },
              { img: 'https://scontent.cdninstagram.com/v/t51.82787-15/543596898_17894743872302708_6425509269160822061_n.jpg?stp=dst-jpg_e35_tt6&_nc_cat=106&ccb=7-5&_nc_sid=18de74&_nc_ohc=js4bkX6pEd4Q7kNvwFVpyd_&_nc_zt=23&_nc_ht=scontent.cdninstagram.com&oh=00_Afv5PtpEWacHcF9QXllNdK9QlXOvkLLbQmCqUR5AftjvoQ&oe=699E7016', caption: '3.55ct Oval Diamond Ring' },
              { img: 'https://scontent.cdninstagram.com/v/t51.75761-15/467406358_17856821388302708_6860073839234662996_n.jpg?stp=dst-jpg_e35_tt6&_nc_cat=103&ccb=7-5&_nc_sid=18de74&_nc_ohc=5nqhWkfoTRkQ7kNvwFl1ZAI&_nc_zt=23&_nc_ht=scontent.cdninstagram.com&oh=00_Afuh7tqJB1qA_AG3kr4r_V1albpGKdjkdMfMCMEJO_8n1g&oe=699E5767', caption: 'Simplicity in Luxury' },
            ].map((post, i) => (
              <a key={i} href="https://www.instagram.com/thelocaljewel" target="_blank" rel="noopener noreferrer" className="relative flex-shrink-0 w-[160px] h-[160px] md:w-[200px] md:h-[200px] rounded-[10px] overflow-hidden group">
                <img src={post.img} alt={post.caption} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="white" className="opacity-0 group-hover:opacity-100 transition-opacity duration-300"><rect x="2" y="2" width="20" height="20" rx="5" ry="5" fill="none" stroke="white" strokeWidth="2"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" fill="none" stroke="white" strokeWidth="2"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" stroke="white" strokeWidth="2"/></svg>
                </div>
              </a>
            ))}
          </div>
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
