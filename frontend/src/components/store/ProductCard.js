import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, ArrowUpRight, Play } from 'lucide-react';

const money = (n) => `$${Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

// Metal-tier → swatch dot colour (gold tiers expand into the 3 free colours)
const dotsForTiers = (tiers = []) => {
  const dots = [];
  if (tiers.some((t) => t === '10k' || t === '14k' || t === '18k')) {
    dots.push({ id: 'yellow', color: '#E7C233', label: 'Yellow Gold' });
    dots.push({ id: 'rose', color: '#E6B7A9', label: 'Rose Gold' });
    dots.push({ id: 'white', color: '#EDEDED', label: 'White Gold' });
  }
  if (tiers.includes('silver')) dots.push({ id: 'silver', color: '#C9CDD1', label: 'Sterling Silver' });
  if (tiers.includes('platinum')) dots.push({ id: 'platinum', color: '#DCE0E3', label: 'Platinum' });
  return dots;
};

export default function ProductCard({ product, index = 0 }) {
  const navigate = useNavigate();
  // Mount the hover video lazily (first hover) so grids stay light
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

  const openProduct = () => navigate(`/projects/${product.slug}`);

  return (
    <div
      className="group cursor-pointer lj-card-reveal"
      style={{ animationDelay: `${Math.min(index, 11) * 70}ms` }}
      onClick={openProduct}
      onMouseEnter={() => { setWarm(true); setHovered(true); }}
      onMouseLeave={() => setHovered(false)}
      data-testid={`product-card-${product.slug}`}
    >
      <div className="relative overflow-hidden" style={{ aspectRatio: '4/5', background: 'var(--lj-surface)' }}>
        {/* Base image */}
        {img && (
          <img
            src={img}
            alt={product.title}
            loading="lazy"
            className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ${hover ? 'group-hover:opacity-0 group-hover:scale-[1.03]' : 'group-hover:scale-105'}`}
          />
        )}

        {/* Hover media — second photo crossfade, or autoplaying video */}
        {hover && !hoverIsVideo && (
          <img
            src={hover.url}
            alt={`${product.title} — alternate view`}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover opacity-0 scale-[1.06] transition-all duration-700 group-hover:opacity-100 group-hover:scale-100"
          />
        )}
        {hover && hoverIsVideo && warm && (
          <video
            src={hover.url}
            autoPlay
            muted
            loop
            playsInline
            preload="none"
            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500"
            style={{ opacity: hovered ? 1 : 0 }}
            data-testid={`product-hover-video-${product.slug}`}
          />
        )}

        {/* Badges */}
        {product.badge ? (
          <span className="absolute top-3 left-3 z-10 px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] font-medium"
            style={{ background: product.badge.toLowerCase().includes('sale') ? 'var(--lj-danger)' : 'var(--lj-accent)', color: '#fff' }}
            data-testid="product-badge">{product.badge}</span>
        ) : hasSale ? (
          <span className="absolute top-3 left-3 z-10 px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] font-medium" style={{ background: 'var(--lj-danger)', color: '#fff' }}>{pct}% Off</span>
        ) : null}

        {/* Video hint */}
        {hoverIsVideo && (
          <span className="absolute top-3 right-3 z-10 w-7 h-7 rounded-full flex items-center justify-center transition-opacity duration-300 group-hover:opacity-0"
            style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(6px)' }} aria-hidden="true">
            <Play size={11} fill="#fff" style={{ color: '#fff', marginLeft: 1 }} />
          </span>
        )}

        {/* Slide-up quick view bar */}
        <div
          className="absolute inset-x-0 bottom-0 z-10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"
          data-testid={`quick-add-${product.slug}`}
        >
          <div className="mx-3 mb-3 flex items-center justify-center gap-1.5 py-2.5 text-[12px] uppercase tracking-[0.14em] font-medium"
            style={{ background: 'rgba(253,251,247,0.92)', backdropFilter: 'blur(10px)', color: 'var(--lj-accent)', border: '1px solid var(--lj-border)' }}>
            View piece <ArrowUpRight size={13} />
          </div>
        </div>
      </div>

      <div className="pt-3">
        <h3 className="text-[14px] sm:text-[15px] font-medium leading-snug line-clamp-2" style={{ color: 'var(--lj-text)' }}>{product.title}</h3>

        {/* Metal swatches + carat range */}
        {(dots.length > 0 || caratRange) && (
          <div className="flex items-center gap-2 mt-1.5" data-testid={`product-variants-${product.slug}`}>
            {dots.length > 0 && (
              <div className="flex items-center gap-1">
                {dots.map((d) => (
                  <span key={d.id} title={d.label} className="w-3 h-3 rounded-full inline-block"
                    style={{ background: d.color, border: '1px solid rgba(0,0,0,0.12)' }} />
                ))}
              </div>
            )}
            {caratRange && (
              <span className="text-[11px] tracking-wide" style={{ color: 'var(--lj-muted)' }}>{caratRange}</span>
            )}
          </div>
        )}

        {product.rating != null && (
          <div className="flex items-center gap-1 mt-1">
            <Star size={12} fill="var(--lj-accent)" style={{ color: 'var(--lj-accent)' }} />
            <span className="text-[12px]" style={{ color: 'var(--lj-muted)' }}>{product.rating} {product.review_count ? `(${product.review_count})` : ''}</span>
          </div>
        )}

        {hasPrice ? (
          <div className="flex items-baseline gap-2 mt-1.5">
            <span className="text-[15px] font-semibold" style={{ color: 'var(--lj-text)' }}>
              <span className="text-[11.5px] font-normal mr-1" style={{ color: 'var(--lj-muted)' }}>From</span>
              {money(product.price)}
            </span>
            {hasSale && <span className="text-[13px] line-through" style={{ color: 'var(--lj-muted)' }}>{money(product.compare_at_price)}</span>}
          </div>
        ) : (
          product.subtitle && <p className="text-[12px] mt-1.5 line-clamp-1" style={{ color: 'var(--lj-muted)' }}>{product.subtitle}</p>
        )}
      </div>
    </div>
  );
}
