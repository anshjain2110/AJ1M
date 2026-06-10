import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { X, Plus, Minus, Trash2, ShoppingBag, Lock, ShieldCheck } from 'lucide-react';
import { useCart } from '../../context/CartContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
const money = (n) => `$${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

export default function CartDrawer() {
  const navigate = useNavigate();
  const { items, open, closeCart, subtotal, updateQty, removeItem, lineKey } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const checkout = async () => {
    setError('');
    setLoading(true);
    try {
      const payload = {
        items: items.map((i) => ({ product_slug: i.product_slug, quantity: i.quantity, metal: i.metal || '', carat: i.carat || '', size: i.size || '' })),
        origin_url: window.location.origin,
      };
      const r = await axios.post(`${BACKEND_URL}/api/checkout/session`, payload);
      if (r.data && r.data.url) {
        window.location.href = r.data.url;
      } else {
        setError('Could not start checkout. Please try again.');
        setLoading(false);
      }
    } catch (e) {
      setError(e?.response?.data?.detail || 'Checkout failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className={`fixed inset-0 z-[70] ${open ? '' : 'pointer-events-none'}`} aria-hidden={!open}>
      <div className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`} onClick={closeCart} />
      <aside
        className={`store absolute right-0 top-0 bottom-0 w-full sm:w-[420px] flex flex-col transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'}`}
        style={{ background: 'var(--lj-bg)', fontFamily: "'Outfit', Inter, sans-serif" }}
        data-testid="cart-drawer"
      >
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--lj-border)' }}>
          <div className="flex items-center gap-2 text-[15px] font-medium" style={{ color: 'var(--lj-text)' }}>
            <ShoppingBag size={18} /> Your Bag
          </div>
          <button onClick={closeCart} aria-label="Close cart" data-testid="cart-close"><X size={22} style={{ color: 'var(--lj-muted)' }} /></button>
        </div>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-4">
            <ShoppingBag size={40} style={{ color: 'var(--lj-border)' }} />
            <p className="text-[15px]" style={{ color: 'var(--lj-muted)' }}>Your bag is empty.</p>
            <button onClick={() => { closeCart(); navigate('/collections'); }} className="px-6 py-3 text-[13px] tracking-wide font-medium" style={{ background: 'var(--lj-accent)', color: '#fff' }} data-testid="cart-shop-btn">
              Shop Collections
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-auto px-5 py-4 space-y-5">
              {items.map((it) => {
                const key = lineKey(it);
                return (
                  <div key={key} className="flex gap-3" data-testid="cart-line">
                    <div className="w-[78px] h-[96px] flex-shrink-0 overflow-hidden" style={{ background: 'var(--lj-surface)' }}>
                      {it.image && <img src={it.image} alt={it.title} className="w-full h-full object-cover" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[14px] font-medium leading-snug" style={{ color: 'var(--lj-text)' }}>{it.title}</div>
                      <div className="text-[12px] mt-0.5" style={{ color: 'var(--lj-muted)' }}>
                        {[it.metal, it.carat, it.size && `Size ${it.size}`].filter(Boolean).join(' · ')}
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center" style={{ border: '1px solid var(--lj-border)' }}>
                          <button onClick={() => updateQty(key, it.quantity - 1)} className="px-2 py-1" aria-label="Decrease" data-testid="cart-qty-minus"><Minus size={13} /></button>
                          <span className="px-2 text-[13px] min-w-[24px] text-center">{it.quantity}</span>
                          <button onClick={() => updateQty(key, it.quantity + 1)} className="px-2 py-1" aria-label="Increase" data-testid="cart-qty-plus"><Plus size={13} /></button>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[14px] font-semibold" style={{ color: 'var(--lj-text)' }}>{money(it.price * it.quantity)}</span>
                          <button onClick={() => removeItem(key)} aria-label="Remove" data-testid="cart-remove"><Trash2 size={15} style={{ color: 'var(--lj-muted)' }} /></button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="px-5 pt-4 pb-5 space-y-3" style={{ borderTop: '1px solid var(--lj-border)' }}>
              <div className="flex items-center justify-between text-[15px]">
                <span style={{ color: 'var(--lj-muted)' }}>Subtotal</span>
                <span className="font-semibold" style={{ color: 'var(--lj-text)' }} data-testid="cart-subtotal">{money(subtotal)}</span>
              </div>
              <p className="text-[12px]" style={{ color: 'var(--lj-muted)' }}>Shipping &amp; taxes calculated at checkout · Free insured shipping</p>

              {error && <p className="text-[13px]" style={{ color: 'var(--lj-danger)' }} data-testid="cart-error">{error}</p>}

              {/* Express checkout (visual) */}
              <button onClick={checkout} disabled={loading} className="w-full py-3 text-[14px] font-semibold rounded-full flex items-center justify-center gap-1.5 disabled:opacity-60" style={{ background: '#000', color: '#fff' }} data-testid="express-apple-pay">
                <svg width="15" height="18" viewBox="0 0 384 512" fill="#fff" aria-hidden="true"><path d="M318.7 268c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-92.6zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/></svg>
                Pay
              </button>
              <button onClick={checkout} disabled={loading} className="w-full py-3 text-[14px] font-semibold rounded-full disabled:opacity-60" style={{ background: '#fff', color: '#3c4043', border: '1px solid #dadce0' }} data-testid="express-google-pay">
                <span style={{ color: '#4285F4' }}>G</span><span style={{ color: '#EA4335' }}>o</span><span style={{ color: '#FBBC05' }}>o</span><span style={{ color: '#4285F4' }}>g</span><span style={{ color: '#34A853' }}>l</span><span style={{ color: '#EA4335' }}>e</span> Pay
              </button>

              <div className="flex items-center gap-2 my-1">
                <div className="flex-1 h-px" style={{ background: 'var(--lj-border)' }} />
                <span className="text-[11px] uppercase tracking-wider" style={{ color: 'var(--lj-muted)' }}>or</span>
                <div className="flex-1 h-px" style={{ background: 'var(--lj-border)' }} />
              </div>

              <button onClick={checkout} disabled={loading} className="w-full py-3.5 text-[14px] tracking-wide font-medium flex items-center justify-center gap-2 disabled:opacity-60" style={{ background: 'var(--lj-accent)', color: '#fff' }} data-testid="cart-checkout-btn">
                <Lock size={15} /> {loading ? 'Starting checkout…' : 'Secure Checkout'}
              </button>
              <div className="flex items-center justify-center gap-1.5 text-[11px]" style={{ color: 'var(--lj-muted)' }}>
                <ShieldCheck size={13} /> Encrypted &amp; secure payment via Stripe
              </div>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
