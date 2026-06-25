'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Star, ArrowUpRight, Play } from 'lucide-react';

const dotsForTiers = (tiers) => {
  if (!tiers || tiers.length === 0) return [];
  const order = { '14k': '#E8C778', '18k': '#D4A85A', 'platinum': '#D9DAE0' };
  return tiers.slice(0, 4).map((t, i) => ({ key: t.tier_key || `${t.tier}-${i}`, color: order[t.tier] || '#888' }));
};

export default function ProductCard({ product, index = 0 }) {
  const [warm, setWarm] = useState(false);
  const [hovered, setHovered] = useState(false);
  if (!product) return null;

  const img = product.hero_image_url || (product.images && product.images[0] && product.images[0].url);
  const hover = product.hover_media || null;
  const hoverIsVideo = hover && hover.media_type === 'video';
  const hasSale = product.compare_at_price && product.compare_at_price > product.price;
  const pct = hasSale ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100) : 0;
  const dots = dotsForTiers(product.metal_tiers);
  const caratRange = product.carat_range && product.carat_range.length
    ? (product.carat_range[0] === product.carat_range[product.carat_range.length - 1]
        ? `${product.carat_range[0]} ct`
        : `${product.carat_range[0]}–${product.carat_range[product.carat_range.length - 1]} ct`)
    : null;
  const hasPrice = Number(product.price) > 0;

  return (
    <Link
      href={`/projects/${product.slug}`}
      className="group block lj-card-reveal no-underline"
      style={{ animationDelay: `${Math.min(index, 11) * 70}ms`, color: 'inherit' }}
      onMouseEnter={() => { setWarm(true); setHovered(true); }}
      onMouseLeave={() => setHovered(false)}
      data-testid={`product-card-${product.slug}`}
    >
      <div className="relative w-full overflow-hidden" style={{ aspectRatio: '1', background: 'var(--lj-surface)' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {img && <img src={img} alt={product.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />}
        {warm && hover && hover.url && (
          hoverIsVideo ? (
            <video src={hover.url} muted loop playsInline autoPlay className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${hovered ? 'opacity-100' : 'opacity-0'}`} />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={hover.url} alt="" className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${hovered ? 'opacity-100' : 'opacity-0'}`} />
          )
        )}
        {hoverIsVideo && hover && hover.url && !hovered && (
          <div className="absolute bottom-2 right-2 w-7 h-7 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.85)' }}>
            <Play size={12} style={{ color: 'var(--lj-text)' }} />
          </div>
        )}
        {hasSale && (
          <div className="absolute top-3 left-3 px-2 py-1 text-[10.5px] font-semibold tracking-wider" style={{ background: 'var(--lj-accent)', color: '#fff' }}>−{pct}%</div>
        )}
        <div className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: 'rgba(255,255,255,0.92)' }}>
          <ArrowUpRight size={15} style={{ color: 'var(--lj-text)' }} />
        </div>
      </div>
      <div className="pt-3.5 pr-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-[14.5px] leading-snug font-medium line-clamp-2" style={{ color: 'var(--lj-text)' }}>{product.title}</h3>
        </div>
        <div className="flex items-center justify-between mt-1.5">
          <div className="flex items-baseline gap-2">
            {hasPrice ? (
              <>
                <span className="text-[14.5px] font-semibold" style={{ color: 'var(--lj-text)' }}>${Number(product.price).toLocaleString()}</span>
                {hasSale && (
                  <span className="text-[12px] line-through" style={{ color: 'var(--lj-muted)' }}>${Number(product.compare_at_price).toLocaleString()}</span>
                )}
              </>
            ) : (
              <span className="text-[12px]" style={{ color: 'var(--lj-muted)' }}>Made to order</span>
            )}
          </div>
          {caratRange && <span className="text-[11px]" style={{ color: 'var(--lj-muted)' }}>{caratRange}</span>}
        </div>
        {dots.length > 0 ? (
          <div className="flex gap-1.5 mt-2">
            {dots.map((d) => <span key={d.key} className="block w-3 h-3 rounded-full ring-1 ring-[var(--lj-border)]" style={{ background: d.color }} />)}
          </div>
        ) : (
          product.subtitle && <p className="text-[12px] mt-1.5 line-clamp-1" style={{ color: 'var(--lj-muted)' }}>{product.subtitle}</p>
        )}
        {product.rating ? (
          <div className="flex items-center gap-1 mt-1.5">
            <Star size={11} style={{ color: 'var(--lj-accent)', fill: 'var(--lj-accent)' }} />
            <span className="text-[11px]" style={{ color: 'var(--lj-muted)' }}>{product.rating.toFixed(1)}</span>
          </div>
        ) : null}
      </div>
    </Link>
  );
}
