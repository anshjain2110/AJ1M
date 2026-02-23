import React, { useState } from 'react';
import { Star, Shield, Users, ArrowRight, ChevronRight, ChevronDown, ChevronLeft, ExternalLink } from 'lucide-react';
import { useWizard } from '../../../context/WizardContext';
import { trackEvent } from '../../../utils/analytics';

const HERO_IMAGE = '/hero-photo.jpeg';

const COMPARISON = {
  savingsAmount: '$4,200',
  example: {
    ring: '4.5ct Radiant Hidden Halo',
    type: 'Engagement Ring',
    centerStone: '3ct Radiant',
    colorClarity: 'F / VS1',
    metal: '14K White Gold',
    retailCert: 'IGI Certified',
    tljCert: 'IGI - LG687583822',
    tljCertLink: 'https://api.igi.org/viewpdf.php?r=LG687583822&json=[{%22REPORT%20NUMBER%22:%22LG687583822%22,%22REPORT%20DATE%22:%22March%208,%202025%22,%22DESCRIPTION%22:%22LABORATORY%20GROWN%20DIAMOND%22,%22SHAPE%20AND%20CUT%22:%22CUT%20CORNERED%20RECTANGULAR%20MODIFIED%20BRILLIANT%22,%22CARAT%20WEIGHT%22:%223.01%20Carats%22,%22COLOR%20GRADE%22:%22F%22,%22CLARITY%20GRADE%22:%22VS%201%22,%22CUT%20GRADE%22:%22%22,%22POLISH%22:%22EXCELLENT%22,%22SYMMETRY%22:%22EXCELLENT%22,%22Measurements%22:%2210.48%20x%207.11%20x%204.68%20mm%22,%22Table%20Size%22:%2262%%22,%22Crown%20Height%22:%2213.5%%20-%2042%C2%B0%22,%22Pavilion%20Depth%22:%2248%%20-%2033.3%C2%B0%22,%22Girdle%20Thickness%22:%22SLIGHTLY%20THICK%22,%22Culet%22:%22POINTED%22,%22Total%20Depth%22:%2265.8%%22,%22FLUORESCENCE%22:%22NONE%22,%22COMMENTS%22:%22This%20Laboratory%20Grown%20Diamond%20was%20created%20by%20Chemical%20Vapor%20Deposition%20(CVD)%20growth%20process%22,%22Inscription(s)%22:%22IGI%20LG687583822%22,%22.%22:%22%22,%22REPORT_SUF%22:%22LEGAL%22,%22PDF_FLAG%22:%22Y%22,%22REPORT1_PDF%22:%22FDR687583822.pdf%22,%22REPORT2_PDF%22:%22%22,%22GOODS_FLAG%22:%22L%22,%22HNA_FLAG%22:%22N%22,%22REC_DIA_DTL_ID%22:0,%22LOCATION_MST_ID%22:2,%22REPORT_TYPE%22:87,%22REPORT_FORMAT%22:280,%22REPORT_VIDEO%22:%22%22,%22REPORT_IMAGE%22:%22%22,%22ECERT_FLAG%22:%22N%22}]',
    tljProductLink: 'https://www.etsy.com/listing/1899846111/44-carat-radiant-shaped-certified',
    retailPrice: '$12,800',
    tljPrice: '$8,600',
    savings: '$4,200',
    competitors: [
      { name: 'Brilliant Earth', url: 'https://www.brilliantearth.com/lab-diamonds-search/?shapes=Radiant&carats_min=4&carats_max=5' },
      { name: 'Grown Brilliance', url: 'https://www.grownbrilliance.com/collections/radiant-lab-grown-diamond-engagement-rings' },
      { name: 'Blue Nile', url: 'https://www.bluenile.com/diamond-search?shape=RA&minCarat=4&maxCarat=5&labGrown=true' },
    ],
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
              <h4 className="text-[13px] font-medium mb-2 text-center" style={{ color: 'var(--lj-muted)' }}>Traditional Retail</h4>
              {/* Competitor links right under title */}
              <div className="flex flex-wrap justify-center gap-1.5 mb-3">
                {ex.competitors.map((c, ci) => (
                  <a key={ci} href={c.url} target="_blank" rel="noopener noreferrer" className="text-[11px] px-2 py-1 rounded-full transition-colors hover:bg-[#EDEDEB]" style={{ color: 'var(--lj-muted)', border: '1px solid var(--lj-border)' }}>
                    {c.name} ↗
                  </a>
                ))}
              </div>
              <div className="space-y-2.5">
                {[['Ring', ex.ring], ['Type', ex.type], ['Center Stone', ex.centerStone], ['Color / Clarity', ex.colorClarity], ['Metal', ex.metal], ['Certification', ex.retailCert]].map(([label, value]) => (
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
              <h4 className="text-[13px] font-medium mb-2 text-center" style={{ color: 'var(--lj-accent)' }}>The Local Jewel</h4>
              {/* Store link right under title */}
              <div className="flex justify-center mb-3">
                <a href={ex.tljProductLink} target="_blank" rel="noopener noreferrer" className="text-[11px] px-2 py-1 rounded-full transition-colors hover:opacity-80" style={{ color: 'var(--lj-accent)', border: '1px solid rgba(15,94,76,0.2)' }}>
                  View this piece ↗
                </a>
              </div>
              <div className="space-y-2.5">
                {[['Ring', ex.ring], ['Type', ex.type], ['Center Stone', ex.centerStone], ['Color / Clarity', ex.colorClarity], ['Metal', ex.metal]].map(([label, value]) => (
                  <div key={label} className="flex justify-between text-[13px]">
                    <span style={{ color: 'var(--lj-muted)' }}>{label}</span>
                    <span className="font-medium text-right" style={{ color: 'var(--lj-text)' }}>{value}</span>
                  </div>
                ))}
                {/* Certification with link */}
                <div className="flex justify-between text-[13px]">
                  <span style={{ color: 'var(--lj-muted)' }}>Certification</span>
                  <a href={ex.tljCertLink} target="_blank" rel="noopener noreferrer" className="font-medium text-right underline decoration-dotted underline-offset-2 hover:opacity-80 transition-opacity" style={{ color: 'var(--lj-accent)' }}>
                    {ex.tljCert}
                  </a>
                </div>
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
          <div className="flex items-center gap-3">
            <a href="https://www.instagram.com/thelocaljewel/" target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0" style={{ border: '2px solid var(--lj-border)', background: '#000000' }}>
              <img src="/ig-avatar.png" alt="thelocaljewel" className="w-full h-full object-cover" />
            </a>
            <div>
              <a href="https://www.instagram.com/thelocaljewel/" target="_blank" rel="noopener noreferrer" className="text-[16px] font-medium block hover:underline" style={{ color: 'var(--lj-text)' }}>thelocaljewel</a>
              <p className="text-[13px]" style={{ color: 'var(--lj-muted)' }}>Follow us on Instagram</p>
            </div>
          </div>
          <a href="https://www.instagram.com/thelocaljewel/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-medium transition-colors hover:opacity-90" style={{ background: 'var(--lj-accent)', color: '#FFFFFF' }}>
            Follow
          </a>
        </div>
        <div className="overflow-x-auto flex justify-center" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <div className="flex gap-1.5 px-4"  style={{ maxWidth: '100%' }}>
            {[
              { img: 'https://i.etsystatic.com/56104482/r/il/e5be99/6823344673/il_340x270.6823344673_akr1.jpg', caption: '4.4ct Radiant Hidden Halo Ring', url: 'https://www.etsy.com/listing/1899846111/44-carat-radiant-shaped-certified' },
              { img: 'https://i.etsystatic.com/56104482/r/il/c58bdd/6557149529/il_340x270.6557149529_j2mm.jpg', caption: '4.12ct Radiant Yellow Gold Ring', url: 'https://www.etsy.com/listing/1844478237/412-carat-radiant-diamond-ring-14k' },
              { img: 'https://i.etsystatic.com/56104482/r/il/acc787/6625116803/il_340x270.6625116803_8utf.jpg', caption: '3.32ct Oval Diamond Ring', url: 'https://www.etsy.com/listing/1846334388/332-carat-oval-igi-certified-diamond' },
              { img: 'https://i.etsystatic.com/56104482/r/il/9c1489/6665834265/il_340x270.6665834265_ee2y.jpg', caption: '2.03ct Oval Solitaire Ring', url: 'https://www.etsy.com/listing/1854673466/203-carat-f-vvs2-oval-solitaire-diamond' },
              { img: 'https://i.etsystatic.com/56104482/r/il/55d3fa/6640478330/il_340x270.6640478330_jzty.jpg', caption: '4.13ct Oval Ring Set', url: 'https://www.etsy.com/listing/1873477215/413-carat-oval-diamond-ring-set-igi' },
              { img: 'https://i.etsystatic.com/56104482/r/il/2e9925/7063688688/il_340x270.7063688688_9xro.jpg', caption: '3.74ct Emerald Cut Ring', url: 'https://www.etsy.com/listing/4343394593/374-carat-emerald-cut-diamond-ring-14k' },
            ].map((post, i) => (
              <a key={i} href={post.url} target="_blank" rel="noopener noreferrer" className="relative flex-shrink-0 w-[150px] h-[150px] md:w-[185px] md:h-[185px] rounded-[10px] overflow-hidden group">
                <img src={post.img} alt={post.caption} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex flex-col items-center justify-center p-2">
                  <span className="text-[12px] text-white text-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 leading-tight font-medium">{post.caption}</span>
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
