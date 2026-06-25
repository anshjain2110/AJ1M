'use client';

import { useState, useEffect } from 'react';
import { ShoppingBag, Plus, Minus, Lock, Loader2 } from 'lucide-react';
import axios from 'axios';
import { useCart } from '../CartContext';

const money = (n, currency = 'USD') =>
  `${currency === 'USD' ? '$' : `${currency} `}${Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

/**
 * ProductBuyBox — the interactive variant + price + add-to-cart panel.
 * Server-rendered HTML on the page already has the title, description, hero
 * image and price text, so this component only handles the buy-flow side that
 * requires JavaScript.
 */
export default function ProductBuyBox({ project }) {
  const { addItem } = useCart();
  const matrix = project.price_matrix || {};
  const productType = project.product_type;
  const metalKeys = Object.keys(matrix);
  const [metal, setMetal] = useState(metalKeys[0] || '');
  const [carat, setCarat] = useState('');
  const [qty, setQty] = useState(1);
  const [size, setSize] = useState('');
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  // Caret options for the active metal (filter out the legacy "0" placeholder
  // used by metal-only products like wedding bands).
  const carats = metal && matrix[metal] ? Object.keys(matrix[metal]).filter((c) => c !== '0') : [];

  useEffect(() => {
    setCarat(carats[0] || '');
  }, [metal]); // eslint-disable-line react-hooks/exhaustive-deps

  const price = (() => {
    if (!metal || !matrix[metal]) return project.from_price || 0;
    const row = matrix[metal];
    if (carat && row[carat] != null) return Number(row[carat]);
    if (row['0'] != null) return Number(row['0']);
    const first = Object.values(row)[0];
    return Number(first || 0);
  })();

  const currency = (project.price_currency || 'USD').toUpperCase();
  const hasCarat = carats.length > 0;
  const needsSize = !['pendant_studs', 'tennis_bracelet', 'necklace'].includes(productType);

  const handleAdd = async () => {
    if (adding) return;
    setAdding(true);
    try {
      addItem({
        product_slug: project.slug,
        title: project.title,
        image: project.hero_image_url,
        unit: price,
        quantity: qty,
        metal,
        metal_tier: metal,
        carat: carat || '0',
        size: size || '',
      });
      setAdded(true);
      setTimeout(() => setAdded(false), 2200);
    } finally { setAdding(false); }
  };

  return (
    <div className="space-y-4" data-testid="pdp-buy-box">
      {/* Metal selector */}
      {metalKeys.length > 1 && (
        <div>
          <div className="text-[11px] uppercase tracking-[0.12em] font-semibold mb-2" style={{ color: 'var(--lj-muted)' }}>Metal</div>
          <div className="flex flex-wrap gap-2" data-testid="metal-options">
            {metalKeys.map((m) => (
              <button key={m} onClick={() => setMetal(m)} data-testid={`metal-option-${m}`}
                className="px-3.5 py-2 rounded-full text-[13px] font-medium transition-colors"
                style={metal === m
                  ? { background: 'var(--lj-accent)', color: '#fff', border: '1px solid var(--lj-accent)' }
                  : { background: '#fff', color: 'var(--lj-text)', border: '1px solid var(--lj-border)' }}>
                {m}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Carat selector */}
      {hasCarat && (
        <div>
          <div className="text-[11px] uppercase tracking-[0.12em] font-semibold mb-2" style={{ color: 'var(--lj-muted)' }}>Carat</div>
          <div className="flex flex-wrap gap-2" data-testid="carat-options">
            {carats.map((c) => (
              <button key={c} onClick={() => setCarat(c)} data-testid={`carat-option-${c}`}
                className="px-3.5 py-2 rounded-full text-[13px] font-medium transition-colors"
                style={carat === c
                  ? { background: 'var(--lj-accent)', color: '#fff', border: '1px solid var(--lj-accent)' }
                  : { background: '#fff', color: 'var(--lj-text)', border: '1px solid var(--lj-border)' }}>
                {c} ct
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Size */}
      {needsSize && (
        <div>
          <div className="text-[11px] uppercase tracking-[0.12em] font-semibold mb-2" style={{ color: 'var(--lj-muted)' }}>Size (optional)</div>
          <input type="text" placeholder="e.g. 6.5" value={size} onChange={(e) => setSize(e.target.value)} data-testid="size-input"
            className="w-full sm:w-32 min-h-[40px] px-3 rounded-[10px] text-[14px] outline-none"
            style={{ background: '#fff', border: '1px solid var(--lj-border)', color: 'var(--lj-text)' }} />
        </div>
      )}

      {/* Price + Qty + Add */}
      <div className="pt-2 flex flex-wrap items-end justify-between gap-3 border-t" style={{ borderColor: 'var(--lj-border)' }}>
        <div>
          <div className="text-[11px] uppercase tracking-[0.12em] font-semibold" style={{ color: 'var(--lj-muted)' }}>Price</div>
          <div className="text-[26px] font-bold" style={{ color: 'var(--lj-text)' }} data-testid="pdp-live-price">{money(price, currency)}</div>
        </div>
        <div className="flex items-center gap-2 rounded-full px-2 py-1" style={{ border: '1px solid var(--lj-border)' }} data-testid="qty-stepper">
          <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-7 h-7 flex items-center justify-center rounded-full" aria-label="Decrease" data-testid="qty-decrease"><Minus size={14} /></button>
          <span className="min-w-[20px] text-center text-[14px] font-semibold">{qty}</span>
          <button onClick={() => setQty(qty + 1)} className="w-7 h-7 flex items-center justify-center rounded-full" aria-label="Increase" data-testid="qty-increase"><Plus size={14} /></button>
        </div>
      </div>

      <button onClick={handleAdd} disabled={adding} data-testid="v2-add-to-bag"
        className="w-full min-h-[52px] rounded-full text-[15px] font-semibold flex items-center justify-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-60"
        style={{ background: added ? '#16A34A' : 'var(--lj-accent)', color: '#fff' }}>
        {adding ? <Loader2 size={18} className="animate-spin" /> : <ShoppingBag size={18} />}
        {added ? 'Added to bag' : 'Add to bag'}
      </button>

      <div className="flex items-center justify-center gap-1.5 text-[11.5px]" style={{ color: 'var(--lj-muted)' }}>
        <Lock size={12} /> Secure checkout · Free insured shipping
      </div>
    </div>
  );
}
