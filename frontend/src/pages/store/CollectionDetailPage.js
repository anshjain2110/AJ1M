import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import axios from 'axios';
import { ChevronRight } from 'lucide-react';
import StoreLayout from '../../components/store/StoreLayout';
import ProductCard from '../../components/store/ProductCard';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

export default function CollectionDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [sort, setSort] = useState('');

  const load = useCallback(() => {
    axios.get(`${BACKEND_URL}/api/collections/${slug}${sort ? `?sort=${sort}` : ''}`)
      .then((r) => {
        setNotFound(false);
        setData(r.data);
        if (r.data.collection) document.title = (r.data.collection.meta_title || `${r.data.collection.title} | The Local Jewel`);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug, sort]);

  useEffect(() => { load(); }, [load]);

  if (notFound) {
    return (
      <StoreLayout>
        <div className="max-w-3xl mx-auto px-4 py-28 text-center">
          <h1 className="text-3xl mb-3" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", color: 'var(--lj-accent)' }}>Collection not found</h1>
          <button onClick={() => navigate('/collections')} className="px-6 py-3 text-[13px] font-medium" style={{ background: 'var(--lj-accent)', color: '#fff' }}>Browse all collections</button>
        </div>
      </StoreLayout>
    );
  }

  const col = data?.collection;
  const products = data?.products || [];

  return (
    <StoreLayout>
      <Helmet>
        {col && <meta name="description" content={col.meta_description || col.description || `Shop ${col.title} at The Local Jewel.`} />}
        <link rel="canonical" href={`https://www.thelocaljewel.com/collections/${slug}`} />
      </Helmet>

      {/* Hero */}
      <section className="relative" style={{ background: 'var(--lj-surface)' }}>
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 md:py-16">
          <div className="flex items-center gap-1.5 text-[12px] mb-4" style={{ color: 'var(--lj-muted)' }}>
            <button onClick={() => navigate('/collections')} data-testid="breadcrumb-collections">Collections</button>
            <ChevronRight size={13} /> <span style={{ color: 'var(--lj-text)' }}>{col?.title || '…'}</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl tracking-tight leading-none" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", color: 'var(--lj-accent)' }} data-testid="collection-title">
            {col?.title || ''}
          </h1>
          {col?.subtitle && <p className="mt-3 text-[16px]" style={{ color: 'var(--lj-text)' }}>{col.subtitle}</p>}
          {col?.description && <p className="mt-3 max-w-2xl text-[14px] leading-relaxed" style={{ color: 'var(--lj-muted)' }}>{col.description}</p>}
        </div>
      </section>

      {/* Sub-collections */}
      {data?.children && data.children.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 md:px-8 pt-8" data-testid="collection-children">
          <div className="text-[11px] uppercase tracking-[0.2em] mb-4" style={{ color: 'var(--lj-muted)' }}>Explore</div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-5">
            {data.children.map((c) => (
              <button key={c.slug} onClick={() => navigate(`/collections/${c.slug}`)} className="group text-center" data-testid={`child-collection-${c.slug}`}>
                <div className="relative overflow-hidden rounded-full mx-auto" style={{ aspectRatio: '1', width: '100%', maxWidth: 140, background: 'var(--lj-surface)' }}>
                  {c.image_url && <img src={c.image_url} alt={c.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />}
                </div>
                <span className="block mt-2.5 text-[13px] font-medium" style={{ color: 'var(--lj-text)' }}>{c.title}</span>
                <span className="block text-[11px]" style={{ color: 'var(--lj-muted)' }}>{c.product_count} {c.product_count === 1 ? 'piece' : 'pieces'}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Toolbar — sticky under the shop header */}
      <section className="sticky z-30" style={{ top: 57, background: 'rgba(253,251,247,0.88)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderBottom: '1px solid var(--lj-border)' }}>
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-2.5 flex items-center justify-between">
          <span className="text-[12px] uppercase tracking-[0.14em]" style={{ color: 'var(--lj-muted)' }} data-testid="collection-count">{products.length} {products.length === 1 ? 'piece' : 'pieces'}</span>
          <select value={sort} onChange={(e) => setSort(e.target.value)} data-testid="collection-sort" className="text-[13px] px-3 py-2 bg-transparent" style={{ border: '1px solid var(--lj-border)', color: 'var(--lj-text)' }}>
            <option value="">Featured</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>
        </div>
      </section>

      {/* Grid */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-10">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
            {Array.from({ length: 8 }).map((_, i) => <div key={i} className="animate-pulse" style={{ aspectRatio: '4/5', background: 'var(--lj-surface)' }} />)}
          </div>
        ) : products.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-[15px] mb-4" style={{ color: 'var(--lj-muted)' }}>No pieces in this collection yet.</p>
            <button onClick={() => navigate('/collections')} className="px-6 py-3 text-[13px] font-medium" style={{ background: 'var(--lj-accent)', color: '#fff' }}>Browse all collections</button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-x-8 md:gap-y-12" data-testid="collection-products-grid">
            {products.map((p, i) => <ProductCard key={p.slug} product={p} index={i} />)}
          </div>
        )}
      </section>
    </StoreLayout>
  );
}
