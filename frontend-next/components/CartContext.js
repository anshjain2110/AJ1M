'use client';

import { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';

const CartCtx = createContext(null);
const STORAGE_KEY = 'tlj_cart_v1';

function readStorage() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => { setItems(readStorage()); }, []);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch { /* ignore quota */ }
  }, [items]);

  const lineKey = (l) => [l.product_slug, l.metal_tier || '', l.metal_color || '', l.carat || '', l.size || ''].join('|');

  const addItem = useCallback((line) => {
    setItems((prev) => {
      const key = lineKey(line);
      const idx = prev.findIndex((i) => lineKey(i) === key);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + (line.quantity || 1) };
        return next;
      }
      return [...prev, { ...line, quantity: line.quantity || 1 }];
    });
    setOpen(true);
  }, []);

  const updateQty = useCallback((key, qty) => setItems((prev) => prev.map((i) => lineKey(i) === key ? { ...i, quantity: Math.max(1, qty) } : i)), []);
  const removeItem = useCallback((key) => setItems((prev) => prev.filter((i) => lineKey(i) !== key)), []);
  const clearCart = useCallback(() => setItems([]), []);
  const openCart = useCallback(() => setOpen(true), []);
  const closeCart = useCallback(() => setOpen(false), []);

  const count = useMemo(() => items.reduce((s, i) => s + (i.quantity || 0), 0), [items]);

  const value = useMemo(() => ({ items, count, open, addItem, updateQty, removeItem, clearCart, openCart, closeCart, lineKey }), [items, count, open, addItem, updateQty, removeItem, clearCart, openCart, closeCart]);

  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>;
}

export function useCart() {
  const ctx = useContext(CartCtx);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
