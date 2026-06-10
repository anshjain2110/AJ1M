import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ChevronRight, ArrowRight } from 'lucide-react';
import ProductCard from './ProductCard';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

export default function ShopEngagementSection() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [subCollections, setSubCollections] = useState([]);

  useEffect(() => {
    axios.get(`${BACKEND_URL}/api/products?collection=engagement-rings&limit=4`).then((r) => setProducts(r.data.products || [])).catch(() => {});
    axios.get(`${BACKEND_URL}/api/collections?parent=engagement-rings`).then((r) => setSubCollections(r.data.collections || [])).catch(() => {});
  }, []);

  if (products.length === 0) return null;

  return (
    <section className="store w-full" style={{ fontFamily: "'Outfit', Inter, sans-serif", background: 'var(--lj-bg)' }} data-testid="home-engagement-section">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-14 md:py-20">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] mb-2" style={{ color: 'var(--lj-muted)' }}>Shop the Edit</p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl tracking-tight leading-none" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", color: 'var(--lj-accent)' }}>
              Engagement Rings
            </h2>
          </div>
          <button onClick={() => navigate('/collections/engagement-rings')} className="hidden sm:flex items-center gap-1.5 text-[13px] font-medium" style={{ color: 'var(--lj-accent)' }} data-testid="home-shop-all-engagement">
            Shop all <ArrowRight size={15} />
          </button>
        </div>

        {/* Shop by sub-collection (dynamic) */}
        {subCollections.length > 0 && (
          <div className="grid grid-cols-4 gap-3 md:gap-6 mb-10">
            {subCollections.slice(0, 5).map((s) => (
              <button key={s.slug} onClick={() => navigate(`/collections/${s.slug}`)} className="group text-center" data-testid={`home-subcol-${s.slug}`}>
                <div className="relative overflow-hidden rounded-full mx-auto" style={{ aspectRatio: '1', width: '100%', maxWidth: 130, background: 'var(--lj-surface)' }}>
                  {s.image_url && <img src={s.image_url} alt={s.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />}
                </div>
                <span className="block mt-2.5 text-[13px] font-medium" style={{ color: 'var(--lj-text)' }}>{s.title}</span>
              </button>
            ))}
          </div>
        )}

        {/* Featured products */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
          {products.map((p, i) => <ProductCard key={p.slug} product={p} index={i} />)}
        </div>

        <div className="mt-9 text-center sm:hidden">
          <button onClick={() => navigate('/collections/engagement-rings')} className="inline-flex items-center gap-1.5 px-7 py-3.5 text-[13px] tracking-wide font-medium" style={{ background: 'var(--lj-accent)', color: '#fff' }}>
            Shop all Engagement Rings <ChevronRight size={15} />
          </button>
        </div>
      </div>
    </section>
  );
}
