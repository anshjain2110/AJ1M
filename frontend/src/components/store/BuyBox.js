import React, { useState, useMemo, useEffect } from 'react';
import { ShoppingBag, Lock, Minus, Plus, Clock, ShieldCheck, Truck } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useCountdown, fmtCountdown } from '../SaleAnnouncementBar';
import {
  METAL_TIERS, availableTiers, availableCaratsForTier, variantPrice,
  metalLabel, applySale, money, COLOR_SWATCH,
} from '../../utils/variantOptions';

// "Buy this piece" box shown on a project's detail page once it's buyable
// (i.e. it lives in a collection and has a price matrix). Metal + carat drive
// the exact price from the matrix; the active site-wide sale discounts it.
export default function BuyBox({ project }) {
  const { addItem, openCart } = useCart();
  const matrix = useMemo(() => project.price_matrix || {}, [project.price_matrix]);
  const sale = project.sale || null;

  const tiers = useMemo(() => availableTiers(matrix), [matrix]);
  const [tier, setTier] = useState(tiers[0]?.id || '');
  const tierObj = METAL_TIERS.find((m) => m.id === tier);
  const [color, setColor] = useState(tierObj?.colors?.length ? 'Yellow' : '');
  const carats = useMemo(() => availableCaratsForTier(matrix, tier), [matrix, tier]);
  const [carat, setCarat] = useState(carats[0] || '');
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const left = useCountdown(sale && sale.ends_at);

  // Keep colour + carat valid whenever the metal tier changes
  useEffect(() => {
    const t = METAL_TIERS.find((m) => m.id === tier);
    if (t?.colors?.length) { setColor((c) => (t.colors.includes(c) ? c : 'Yellow')); } else { setColor(''); }
    const cs = availableCaratsForTier(matrix, tier);
    setCarat((c) => (cs.includes(c) ? c : (cs[0] || '')));
  }, [tier, matrix]);

  const base = variantPrice(matrix, tier, carat);
  const price = sale ? applySale(base, sale) : base;
  const available = base > 0;

  const buildLine = () => ({
    product_slug: project.slug,
    title: project.title,
    image: project.hero_image_url || (project.gallery && project.gallery[0] && project.gallery[0].url) || '',
    price,
    metal_tier: tier,
    metal_color: color,
    metal: metalLabel(tier, color),
    carat,
    size: '',
    quantity: qty,
  });

  const addToBag = () => { if (available) { addItem(buildLine()); setAdded(true); setTimeout(() => setAdded(false), 1600); } };
  const buyNow = () => { if (available) { addItem(buildLine()); openCart(); } };

  const SelButton = ({ active, disabled, onClick, children, testid }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      data-testid={testid}
      className="px-3.5 py-2 text-[13px] rounded-[10px] transition-all disabled:opacity-35 disabled:line-through"
      style={{
        border: active ? '1.5px solid var(--lj-accent)' : '1px solid var(--lj-border)',
        color: active ? 'var(--lj-accent)' : 'var(--lj-text)',
        background: active ? 'rgba(15,94,76,0.06)' : 'transparent',
      }}
    >
      {children}
    </button>
  );

  return (
    <div data-testid="buy-box" className="rounded-[18px] p-5 sm:p-6"
      style={{ border: '1.5px solid var(--lj-accent)', background: 'var(--lj-surface)', boxShadow: '0 10px 34px rgba(15,94,76,0.12)' }}>
      <div className="flex items-center gap-2 mb-3">
        <ShoppingBag size={15} style={{ color: 'var(--lj-accent)' }} />
        <span className="text-[12px] font-bold uppercase tracking-[0.16em]" style={{ color: 'var(--lj-accent)' }}>Buy this piece</span>
      </div>

      {/* Price */}
      <div className="flex items-end gap-2.5 flex-wrap">
        <span data-testid="buy-box-price" className="text-[30px] sm:text-[34px] font-semibold leading-none" style={{ color: 'var(--lj-text)' }}>{money(price)}</span>
        {sale && base > 0 && <span className="text-[16px] line-through mb-1" style={{ color: 'var(--lj-muted)' }}>{money(base)}</span>}
        {sale && <span className="text-[11px] font-bold mb-1.5 px-2 py-0.5 rounded-full" style={{ background: 'var(--lj-danger, #C0392B)', color: '#fff' }}>{Math.round(sale.percent)}% OFF</span>}
      </div>
      {sale && left && (
        <div data-testid="buy-box-countdown" className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold mt-1.5" style={{ color: 'var(--lj-danger, #C0392B)' }}>
          <Clock size={13} /> Sale ends in {fmtCountdown(left)}
        </div>
      )}

      {/* Metal tier */}
      <div className="mt-5">
        <div className="text-[11.5px] uppercase tracking-[0.14em] mb-2" style={{ color: 'var(--lj-muted)' }}>
          Metal: <span style={{ color: 'var(--lj-text)' }}>{metalLabel(tier, color) || '—'}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {tiers.map((m) => (
            <SelButton key={m.id} active={tier === m.id} onClick={() => setTier(m.id)} testid={`buy-metal-${m.id}`}>{m.label}</SelButton>
          ))}
        </div>
      </div>

      {/* Gold colour (free choice) */}
      {tierObj && tierObj.colors.length > 0 && (
        <div className="mt-4">
          <div className="text-[11.5px] uppercase tracking-[0.14em] mb-2" style={{ color: 'var(--lj-muted)' }}>
            Colour: <span style={{ color: 'var(--lj-text)' }}>{color}</span>
          </div>
          <div className="flex items-center gap-2.5">
            {tierObj.colors.map((c) => (
              <button key={c} onClick={() => setColor(c)} data-testid={`buy-color-${c.toLowerCase()}`} aria-label={c}
                className="w-9 h-9 rounded-full transition-transform hover:scale-105"
                style={{ background: COLOR_SWATCH[c], border: color === c ? '2.5px solid var(--lj-accent)' : '1px solid var(--lj-border)', boxShadow: color === c ? '0 0 0 2px rgba(15,94,76,0.15)' : 'none' }} />
            ))}
          </div>
        </div>
      )}

      {/* Carat weight */}
      <div className="mt-4">
        <div className="text-[11.5px] uppercase tracking-[0.14em] mb-2" style={{ color: 'var(--lj-muted)' }}>
          Carat weight: <span style={{ color: 'var(--lj-text)' }}>{carat ? `${carat} ct` : '—'}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {carats.map((c) => (
            <SelButton key={c} active={carat === c} onClick={() => setCarat(c)} testid={`buy-carat-${c}`}>{c} ct</SelButton>
          ))}
        </div>
      </div>

      {/* Quantity + actions */}
      <div className="mt-6 flex items-center gap-3">
        <div className="flex items-center rounded-[10px]" style={{ border: '1px solid var(--lj-border)' }}>
          <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="px-3 py-3" aria-label="Decrease" data-testid="buy-qty-minus"><Minus size={15} /></button>
          <span className="px-2 text-[14px] min-w-[28px] text-center" data-testid="buy-qty">{qty}</span>
          <button onClick={() => setQty((q) => q + 1)} className="px-3 py-3" aria-label="Increase" data-testid="buy-qty-plus"><Plus size={15} /></button>
        </div>
        <button onClick={addToBag} disabled={!available} data-testid="buy-add-to-bag"
          className="flex-1 py-3.5 rounded-[12px] text-[14px] tracking-wide font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ border: '1.5px solid var(--lj-accent)', color: 'var(--lj-accent)' }}>
          {added ? 'Added ✓' : 'Add to Bag'}
        </button>
      </div>
      <button onClick={buyNow} disabled={!available} data-testid="buy-now"
        className="mt-3 w-full py-3.5 rounded-[12px] text-[14px] tracking-wide font-medium flex items-center justify-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-50"
        style={{ background: 'var(--lj-accent)', color: '#fff' }}>
        <Lock size={15} /> Buy It Now
      </button>

      {!available && (
        <p className="mt-2 text-[12px]" style={{ color: 'var(--lj-danger, #C0392B)' }} data-testid="buy-unavailable">This combination isn't available — pick another metal or carat.</p>
      )}

      <div className="grid grid-cols-2 gap-3 mt-5 pt-4" style={{ borderTop: '1px solid var(--lj-border)' }}>
        <div className="flex items-center gap-2 text-[12px]" style={{ color: 'var(--lj-muted)' }}><Truck size={15} style={{ color: 'var(--lj-accent)' }} /> Free insured shipping</div>
        <div className="flex items-center gap-2 text-[12px]" style={{ color: 'var(--lj-muted)' }}><ShieldCheck size={15} style={{ color: 'var(--lj-accent)' }} /> Lifetime warranty</div>
      </div>
    </div>
  );
}
