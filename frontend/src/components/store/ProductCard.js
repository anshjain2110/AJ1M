import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, Plus } from 'lucide-react';

const money = (n) => `$${Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

export default function ProductCard({ product }) {
  const navigate = useNavigate();
  if (!product) return null;
  const img = product.hero_image_url || (product.images && product.images[0] && product.images[0].url);
  const hasSale = product.compare_at_price && product.compare_at_price > product.price;
  const pct = hasSale ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100) : 0;

  const openProduct = () => navigate(`/projects/${product.slug}`);
  const viewProduct = (e) => { e.stopPropagation(); openProduct(); };

  return (
    <div className="group cursor-pointer" onClick={openProduct} data-testid={`product-card-${product.slug}`}>
      <div className="relative overflow-hidden" style={{ aspectRatio: '4/5', background: 'var(--lj-surface)' }}>
        {img && <img src={img} alt={product.title} loading="lazy" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />}
        {product.badge ? (
          <span className="absolute top-3 left-3 px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] font-medium"
            style={{ background: product.badge.toLowerCase().includes('sale') ? 'var(--lj-danger)' : 'var(--lj-accent)', color: '#fff' }}
            data-testid="product-badge">{product.badge}</span>
        ) : hasSale ? (
          <span className="absolute top-3 left-3 px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] font-medium" style={{ background: 'var(--lj-danger)', color: '#fff' }}>{pct}% Off</span>
        ) : null}
        <button
          onClick={viewProduct}
          data-testid={`quick-add-${product.slug}`}
          className="absolute bottom-3 right-3 w-10 h-10 flex items-center justify-center rounded-full opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 shadow-md"
          style={{ background: '#fff', color: 'var(--lj-accent)' }}
          aria-label="View piece"
        >
          <Plus size={18} />
        </button>
      </div>
      <div className="pt-3">
        <h3 className="text-[14px] sm:text-[15px] font-medium leading-snug line-clamp-2" style={{ color: 'var(--lj-text)' }}>{product.title}</h3>
        {product.rating != null && (
          <div className="flex items-center gap-1 mt-1">
            <Star size={12} fill="var(--lj-accent)" style={{ color: 'var(--lj-accent)' }} />
            <span className="text-[12px]" style={{ color: 'var(--lj-muted)' }}>{product.rating} {product.review_count ? `(${product.review_count})` : ''}</span>
          </div>
        )}
        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-[15px] font-semibold" style={{ color: 'var(--lj-text)' }}>{money(product.price)}</span>
          {hasSale && <span className="text-[13px] line-through" style={{ color: 'var(--lj-muted)' }}>{money(product.compare_at_price)}</span>}
        </div>
      </div>
    </div>
  );
}
