import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const CartContext = createContext(null);
const STORAGE_KEY = 'tlj_cart_v1';

const lineKey = (i) => `${i.product_slug}|${i.metal || ''}|${i.carat || ''}|${i.size || ''}`;

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch { /* ignore */ }
  }, [items]);

  const addItem = useCallback((item) => {
    setItems((prev) => {
      const key = lineKey(item);
      const idx = prev.findIndex((p) => lineKey(p) === key);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + (item.quantity || 1) };
        return next;
      }
      return [...prev, { ...item, quantity: item.quantity || 1 }];
    });
    setOpen(true);
  }, []);

  const updateQty = useCallback((key, qty) => {
    setItems((prev) => prev
      .map((p) => (lineKey(p) === key ? { ...p, quantity: Math.max(1, qty) } : p))
      .filter((p) => p.quantity > 0));
  }, []);

  const removeItem = useCallback((key) => {
    setItems((prev) => prev.filter((p) => lineKey(p) !== key));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const count = items.reduce((s, i) => s + i.quantity, 0);
  const subtotal = items.reduce((s, i) => s + (i.price || 0) * i.quantity, 0);

  const value = {
    items, count, subtotal, open,
    openCart: () => setOpen(true),
    closeCart: () => setOpen(false),
    addItem, updateQty, removeItem, clearCart, lineKey,
  };
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
