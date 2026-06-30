'use client';
import React, { useEffect, useState } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
const DEFAULT_TEXT = 'Hand-crafted · Lab-grown & conflict-free · Free design consultation';
const pad = (n) => String(n).padStart(2, '0');

// Live countdown to an ISO datetime. Returns {d,h,m,s} or null when expired/absent.
export function useCountdown(endsAt) {
  const [left, setLeft] = useState(null);
  useEffect(() => {
    if (!endsAt) { setLeft(null); return undefined; }
    const end = new Date(endsAt).getTime();
    const tick = () => {
      const diff = end - Date.now();
      if (diff <= 0) { setLeft(null); return; }
      setLeft({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endsAt]);
  return left;
}

// Fetch the active site-wide sale once. Returns the sale object or null.
export function useSale() {
  const [sale, setSale] = useState(null);
  useEffect(() => {
    let mounted = true;
    axios.get(`${BACKEND_URL}/api/shop/sale`).then((r) => { if (mounted) setSale(r.data.sale); }).catch(() => {});
    return () => { mounted = false; };
  }, []);
  return sale;
}

export const fmtCountdown = (l) => (l ? `${l.d > 0 ? `${l.d}d ` : ''}${pad(l.h)}:${pad(l.m)}:${pad(l.s)}` : '');

export default function SaleAnnouncementBar({ defaultText = DEFAULT_TEXT }) {
  const sale = useSale();
  const left = useCountdown(sale && sale.ends_at);

  return (
    <div
      data-testid="announcement-bar"
      className="w-full text-center text-[11px] sm:text-[12px] tracking-[0.16em] uppercase py-2 px-3 flex items-center justify-center gap-3 flex-wrap"
      style={{ background: 'var(--lj-accent)', color: '#fff' }}
    >
      <span data-testid="announcement-text">{sale ? (sale.headline || `${Math.round(sale.percent)}% off everything`) : defaultText}</span>
      {sale && left && (
        <span data-testid="sale-countdown" className="font-semibold normal-case tracking-normal">
          Ends in {fmtCountdown(left)}
        </span>
      )}
    </div>
  );
}