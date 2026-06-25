'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { BookOpen, ChevronRight } from 'lucide-react';

const formatDate = (d) => {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
};

export default function BlogCategoryFilter({ posts = [], categories = [] }) {
  const [activeCategory, setActiveCategory] = useState('all');
  const filtered = useMemo(() => {
    if (activeCategory === 'all') return posts;
    return posts.filter((p) => p.category === activeCategory);
  }, [posts, activeCategory]);

  return (
    <>
      {categories.length > 0 && (
        <div className="pb-8">
          <div className="flex flex-wrap gap-2 justify-center" data-testid="blog-categories">
            <button onClick={() => setActiveCategory('all')} data-testid="blog-cat-all"
              className="px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-all duration-200"
              style={{
                background: activeCategory === 'all' ? 'var(--lj-accent)' : 'var(--lj-surface)',
                color: activeCategory === 'all' ? '#FFFFFF' : 'var(--lj-text)',
                border: '1px solid ' + (activeCategory === 'all' ? 'var(--lj-accent)' : 'var(--lj-border)'),
              }}>
              All <span className="opacity-70 ml-1">{posts.length}</span>
            </button>
            {categories.map((c) => (
              <button key={c.category} onClick={() => setActiveCategory(c.category)} data-testid={`blog-cat-${c.category}`}
                className="px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-all duration-200"
                style={{
                  background: activeCategory === c.category ? 'var(--lj-accent)' : 'var(--lj-surface)',
                  color: activeCategory === c.category ? '#FFFFFF' : 'var(--lj-text)',
                  border: '1px solid ' + (activeCategory === c.category ? 'var(--lj-accent)' : 'var(--lj-border)'),
                }}>
                {c.category} <span className="opacity-70 ml-1">{c.count}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6" data-testid="blog-grid">
          {filtered.map((p) => (
            <Link key={p.post_id || p.slug} href={`/blog/${p.slug}`} data-testid={`blog-card-${p.slug}`}
              className="group block rounded-[18px] overflow-hidden transition-all duration-300 hover:-translate-y-1 no-underline"
              style={{ background: 'var(--lj-surface)', border: '1px solid var(--lj-border)', color: 'inherit' }}>
              <div className="relative aspect-[16/10] overflow-hidden" style={{ background: 'var(--lj-bg)' }}>
                {p.hero_image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.hero_image_url} alt={p.title} loading="lazy" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center" style={{ color: 'var(--lj-muted)' }}>
                    <BookOpen size={32} style={{ opacity: 0.25 }} />
                  </div>
                )}
              </div>
              <div className="p-5">
                <div className="text-[10.5px] uppercase tracking-[0.14em] mb-2" style={{ color: 'var(--lj-accent)' }}>
                  {p.category || 'Journal'} · {formatDate(p.published_at || p.created_at)}
                </div>
                <h3 className="text-[18px] leading-[1.25] font-semibold mb-2 tracking-[-0.01em]"
                  style={{ color: 'var(--lj-text)', fontFamily: 'var(--lj-serif, "Cormorant Garamond","Playfair Display",Georgia,serif)' }}>
                  {p.title}
                </h3>
                {p.excerpt && <p className="text-[13px] leading-[1.5] mb-3 line-clamp-2" style={{ color: 'var(--lj-muted)' }}>{p.excerpt}</p>}
                <div className="inline-flex items-center gap-1.5 text-[12.5px] font-medium" style={{ color: 'var(--lj-accent)' }}>
                  Read more <ChevronRight size={14} className="transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
