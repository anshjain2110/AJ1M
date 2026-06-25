import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import axios from 'axios';
import { ChevronRight } from 'lucide-react';
import StoreLayout from '../../components/store/StoreLayout';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

export default function CollectionsIndexPage() {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = 'Shop All Collections | The Local Jewel';
    axios.get(`${BACKEND_URL}/api/collections`)
      .then((r) => setCollections(r.data.collections || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <StoreLayout>
      <Helmet>
        <meta name="description" content="Browse all collections of hand-crafted lab grown diamond engagement rings and wedding bands at The Local Jewel." />
        <link rel="canonical" href="https://www.thelocaljewel.com/collections" />
      </Helmet>

      <section className="max-w-7xl mx-auto px-4 md:px-8 pt-12 md:pt-16 pb-4">
        <p className="text-[11px] uppercase tracking-[0.22em] mb-3" style={{ color: 'var(--lj-muted)' }}>The Collections</p>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl tracking-tight leading-none" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", color: 'var(--lj-accent)' }} data-testid="collections-title">
          Find the one.
        </h1>
        <p className="mt-4 max-w-xl text-[15px] leading-relaxed" style={{ color: 'var(--lj-muted)' }}>
          Each piece is hand-crafted to order with IGI-certified lab-grown diamonds. Explore by style and shape.
        </p>
      </section>

      <section className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-8">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="animate-pulse" style={{ aspectRatio: '3/4', background: 'var(--lj-surface)' }} />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-8" data-testid="collections-grid">
            {collections.map((c) => (
              <Link key={c.slug} to={`/collections/${c.slug}`} className="group text-left no-underline" style={{ color: 'inherit' }} data-testid={`collection-card-${c.slug}`}>
                <div className="relative overflow-hidden" style={{ aspectRatio: '3/4', background: 'var(--lj-surface)' }}>
                  {c.image_url && <img src={c.image_url} alt={c.title} loading="lazy" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />}
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0) 45%, rgba(0,0,0,0.55) 100%)' }} />
                  <div className="absolute left-0 right-0 bottom-0 p-4 md:p-5">
                    <h2 className="text-xl md:text-2xl text-white" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>{c.title}</h2>
                    <div className="flex items-center gap-1.5 mt-1 text-[12px] text-white/85">
                      {c.product_count} {c.product_count === 1 ? 'piece' : 'pieces'} <ChevronRight size={13} className="transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </StoreLayout>
  );
}
