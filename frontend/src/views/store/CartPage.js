'use client';
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import StoreLayout from '../../components/store/StoreLayout';
import { useCart } from '../../context/CartContext';

export default function CartPage() {
  const navigate = useNavigate();
  const { items, openCart } = useCart();

  useEffect(() => {
    document.title = 'Your Bag | The Local Jewel';
    if (items.length > 0) openCart();
  }, [items.length, openCart]);

  return (
    <StoreLayout>
      <div className="max-w-3xl mx-auto px-4 py-24 text-center">
        <ShoppingBag size={40} style={{ color: 'var(--lj-accent)' }} className="mx-auto mb-5" />
        <h1 className="text-3xl sm:text-4xl mb-3" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", color: 'var(--lj-accent)' }}>Your Bag</h1>
        {items.length === 0 ? (
          <>
            <p className="text-[15px] mb-6" style={{ color: 'var(--lj-muted)' }}>Your bag is empty.</p>
            <button onClick={() => navigate('/collections')} className="px-7 py-3.5 text-[13px] tracking-wide font-medium" style={{ background: 'var(--lj-accent)', color: '#fff' }} data-testid="cart-page-shop">Shop Collections</button>
          </>
        ) : (
          <>
            <p className="text-[15px] mb-6" style={{ color: 'var(--lj-muted)' }}>You have {items.reduce((s, i) => s + i.quantity, 0)} item(s) in your bag.</p>
            <button onClick={openCart} className="px-7 py-3.5 text-[13px] tracking-wide font-medium" style={{ background: 'var(--lj-accent)', color: '#fff' }} data-testid="cart-page-open">Review &amp; Checkout</button>
          </>
        )}
      </div>
    </StoreLayout>
  );
}