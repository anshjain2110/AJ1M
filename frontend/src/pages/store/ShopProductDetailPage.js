import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import axios from 'axios';
import { Star, ShieldCheck, Truck, RefreshCw, Lock, ChevronRight, Minus, Plus } from 'lucide-react';
import StoreLayout from '../../components/store/StoreLayout';
import ProductCard from '../../components/store/ProductCard';
import { useCart } from '../../context/CartContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
const money = (n) => `$${Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

export default function ShopProductDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addItem, openCart } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeImg, setActiveImg] = useState(0);
  const [metal, setMetal] = useState('');
  const [carat, setCarat] = useState('');
  const [size, setSize] = useState('');
  const [qty, setQty] = useState(1);

  const load = useCallback(() => {
    axios.get(`${BACKEND_URL}/api/products/${slug}`)
      .then((r) => {
        const p = r.data;
        setNotFound(false);
        setProduct(p);
        document.title = p.meta_title || `${p.title} | The Local Jewel`;
        setMetal((p.metals && p.metals[0]) || '');
        setCarat((p.carats && p.carats[0]) || '');
        setSize((p.sizes && p.sizes[0]) || '');
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => { load(); window.scrollTo(0, 0); }, [load]);

  if (notFound) {
    return (
      <StoreLayout>
        <div className="max-w-3xl mx-auto px-4 py-28 text-center">
          <h1 className="text-3xl mb-3" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", color: 'var(--lj-accent)' }}>Piece not found</h1>
          <button onClick={() => navigate('/collections')} className="px-6 py-3 text-[13px] font-medium" style={{ background: 'var(--lj-accent)', color: '#fff' }}>Browse collections</button>
        </div>
      </StoreLayout>
    );
  }

  if (loading || !product) {
    return (
      <StoreLayout>
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 grid md:grid-cols-2 gap-10">
          <div className="animate-pulse" style={{ aspectRatio: '1', background: 'var(--lj-surface)' }} />
          <div className="space-y-4"><div className="h-8 w-2/3 animate-pulse" style={{ background: 'var(--lj-surface)' }} /><div className="h-6 w-1/3 animate-pulse" style={{ background: 'var(--lj-surface)' }} /></div>
        </div>
      </StoreLayout>
    );
  }

  const images = (product.images && product.images.length ? product.images : [{ url: product.hero_image_url, alt: product.title }]).filter((i) => i.url);
  const hasSale = product.compare_at_price && product.compare_at_price > product.price;
  const pct = hasSale ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100) : 0;

  const buildLine = () => ({
    product_slug: product.slug, title: product.title, price: product.price,
    image: product.hero_image_url || images[0]?.url, metal, carat, size, quantity: qty,
  });

  const addToBag = () => { addItem(buildLine()); };
  const buyNow = () => { addItem(buildLine()); openCart(); };

  const jsonLd = {
    '@context': 'https://schema.org', '@type': 'Product', name: product.title,
    image: images.map((i) => i.url), description: (product.meta_description || product.subtitle || product.title),
    brand: { '@type': 'Brand', name: 'The Local Jewel' },
    offers: { '@type': 'Offer', priceCurrency: product.currency || 'USD', price: product.price, availability: 'https://schema.org/InStock' },
    ...(product.rating ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: product.rating, reviewCount: product.review_count || 1 } } : {}),
  };

  return (
    <StoreLayout>
      <Helmet>
        <meta name="description" content={product.meta_description || product.subtitle || product.title} />
        <link rel="canonical" href={`https://www.thelocaljewel.com/products/${slug}`} />
      </Helmet>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-6">
        <div className="flex items-center gap-1.5 text-[12px]" style={{ color: 'var(--lj-muted)' }}>
          <button onClick={() => navigate('/collections')}>Collections</button>
          <ChevronRight size={12} /> <span style={{ color: 'var(--lj-text)' }} className="truncate">{product.title}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-10 grid md:grid-cols-2 gap-8 lg:gap-14">
        {/* Gallery */}
        <div className="md:sticky md:top-28 self-start">
          <div className="relative overflow-hidden" style={{ aspectRatio: '1', background: 'var(--lj-surface)' }}>
            {images[activeImg] && <img src={images[activeImg].url} alt={images[activeImg].alt || product.title} className="absolute inset-0 w-full h-full object-cover" data-testid="product-main-image" />}
          </div>
          {images.length > 1 && (
            <div className="flex gap-3 mt-3">
              {images.map((im, i) => (
                <button key={i} onClick={() => setActiveImg(i)} className="w-16 h-16 overflow-hidden" style={{ border: i === activeImg ? '2px solid var(--lj-accent)' : '1px solid var(--lj-border)' }} data-testid={`product-thumb-${i}`}>
                  <img src={im.url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          {product.badge && <span className="inline-block px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] font-medium mb-3" style={{ background: 'var(--lj-accent)', color: '#fff' }}>{product.badge}</span>}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl tracking-tight leading-tight" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", color: 'var(--lj-text)' }} data-testid="product-title">{product.title}</h1>
          {product.subtitle && <p className="mt-2 text-[15px]" style={{ color: 'var(--lj-muted)' }}>{product.subtitle}</p>}

          {product.rating != null && (
            <div className="flex items-center gap-1.5 mt-3">
              {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={15} fill={i < Math.round(product.rating) ? 'var(--lj-accent)' : 'none'} style={{ color: 'var(--lj-accent)' }} />)}
              <span className="text-[13px]" style={{ color: 'var(--lj-muted)' }}>{product.rating} · {product.review_count} reviews</span>
            </div>
          )}

          <div className="flex items-end gap-3 mt-5">
            <span className="text-[28px] font-semibold" style={{ color: 'var(--lj-text)' }} data-testid="product-price">{money(product.price)}</span>
            {hasSale && <span className="text-[18px] line-through mb-1" style={{ color: 'var(--lj-muted)' }}>{money(product.compare_at_price)}</span>}
            {hasSale && <span className="text-[13px] font-medium mb-1.5" style={{ color: 'var(--lj-danger)' }}>{pct}% off</span>}
          </div>

          {/* Metal */}
          {product.metals && product.metals.length > 0 && (
            <div className="mt-7">
              <div className="text-[12px] uppercase tracking-[0.16em] mb-2" style={{ color: 'var(--lj-muted)' }}>Metal: <span style={{ color: 'var(--lj-text)' }}>{metal}</span></div>
              <div className="flex flex-wrap gap-2">
                {product.metals.map((m) => (
                  <button key={m} onClick={() => setMetal(m)} data-testid={`metal-${m}`} className="px-4 py-2 text-[13px] transition-colors" style={{ border: metal === m ? '1.5px solid var(--lj-accent)' : '1px solid var(--lj-border)', color: metal === m ? 'var(--lj-accent)' : 'var(--lj-text)', background: metal === m ? 'rgba(15,94,76,0.05)' : 'transparent' }}>{m}</button>
                ))}
              </div>
            </div>
          )}

          {/* Carat */}
          {product.carats && product.carats.length > 0 && (
            <div className="mt-5">
              <div className="text-[12px] uppercase tracking-[0.16em] mb-2" style={{ color: 'var(--lj-muted)' }}>Carat: <span style={{ color: 'var(--lj-text)' }}>{carat}</span></div>
              <div className="flex flex-wrap gap-2">
                {product.carats.map((c) => (
                  <button key={c} onClick={() => setCarat(c)} data-testid={`carat-${c}`} className="px-4 py-2 text-[13px] rounded-full transition-colors" style={{ border: carat === c ? '1.5px solid var(--lj-accent)' : '1px solid var(--lj-border)', color: carat === c ? 'var(--lj-accent)' : 'var(--lj-text)' }}>{c}</button>
                ))}
              </div>
            </div>
          )}

          {/* Size */}
          {product.sizes && product.sizes.length > 0 && (
            <div className="mt-5">
              <div className="text-[12px] uppercase tracking-[0.16em] mb-2" style={{ color: 'var(--lj-muted)' }}>Ring Size: <span style={{ color: 'var(--lj-text)' }}>{size}</span></div>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((s) => (
                  <button key={s} onClick={() => setSize(s)} data-testid={`size-${s}`} className="w-11 h-11 text-[13px] rounded-full transition-colors" style={{ border: size === s ? '1.5px solid var(--lj-accent)' : '1px solid var(--lj-border)', color: size === s ? 'var(--lj-accent)' : 'var(--lj-text)' }}>{s}</button>
                ))}
              </div>
            </div>
          )}

          {/* Qty + actions */}
          <div className="mt-7 flex items-center gap-3">
            <div className="flex items-center" style={{ border: '1px solid var(--lj-border)' }}>
              <button onClick={() => setQty(Math.max(1, qty - 1))} className="px-3 py-3" aria-label="Decrease" data-testid="pdp-qty-minus"><Minus size={15} /></button>
              <span className="px-3 text-[14px] min-w-[28px] text-center" data-testid="pdp-qty">{qty}</span>
              <button onClick={() => setQty(qty + 1)} className="px-3 py-3" aria-label="Increase" data-testid="pdp-qty-plus"><Plus size={15} /></button>
            </div>
            <button onClick={addToBag} className="flex-1 py-3.5 text-[14px] tracking-wide font-medium transition-opacity hover:opacity-90" style={{ border: '1.5px solid var(--lj-accent)', color: 'var(--lj-accent)' }} data-testid="add-to-cart-btn">Add to Bag</button>
          </div>
          <button onClick={buyNow} className="mt-3 w-full py-3.5 text-[14px] tracking-wide font-medium flex items-center justify-center gap-2 transition-opacity hover:opacity-90" style={{ background: 'var(--lj-accent)', color: '#fff' }} data-testid="buy-now-btn">
            <Lock size={15} /> Buy It Now
          </button>

          {/* Trust */}
          <div className="grid grid-cols-3 gap-3 mt-7 pt-6" style={{ borderTop: '1px solid var(--lj-border)' }}>
            <div className="flex flex-col items-center text-center gap-1.5"><Truck size={20} style={{ color: 'var(--lj-accent)' }} /><span className="text-[11px]" style={{ color: 'var(--lj-muted)' }}>Free insured shipping</span></div>
            <div className="flex flex-col items-center text-center gap-1.5"><RefreshCw size={20} style={{ color: 'var(--lj-accent)' }} /><span className="text-[11px]" style={{ color: 'var(--lj-muted)' }}>30-day returns</span></div>
            <div className="flex flex-col items-center text-center gap-1.5"><ShieldCheck size={20} style={{ color: 'var(--lj-accent)' }} /><span className="text-[11px]" style={{ color: 'var(--lj-muted)' }}>Lifetime warranty</span></div>
          </div>

          {product.description_html && (
            <div className="mt-8 pt-6 text-[14px] leading-relaxed" style={{ borderTop: '1px solid var(--lj-border)', color: 'var(--lj-text)' }} dangerouslySetInnerHTML={{ __html: product.description_html }} />
          )}
        </div>
      </div>

      {/* Related */}
      {product.related && product.related.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 md:px-8 py-12">
          <h2 className="text-2xl sm:text-3xl mb-6" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", color: 'var(--lj-text)' }}>You may also love</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
            {product.related.map((p) => <ProductCard key={p.slug} product={p} />)}
          </div>
        </section>
      )}

      {/* Sticky mobile buy bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 px-4 py-3 flex items-center gap-3" style={{ background: 'var(--lj-bg)', borderTop: '1px solid var(--lj-border)' }} data-testid="mobile-buy-bar">
        <div className="flex-shrink-0">
          <div className="text-[16px] font-semibold" style={{ color: 'var(--lj-text)' }}>{money(product.price)}</div>
        </div>
        <button onClick={buyNow} className="flex-1 py-3 text-[14px] font-medium" style={{ background: 'var(--lj-accent)', color: '#fff' }} data-testid="mobile-buy-now">Buy It Now</button>
      </div>
    </StoreLayout>
  );
}
