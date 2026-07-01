import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import axios from 'axios';
import { BookOpen, Loader2, ChevronRight } from 'lucide-react';
import PublicHeader from '../components/PublicHeader';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

const formatDate = (d) => {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
};

export default function BlogIndexPage() {
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    axios.get(`${BACKEND_URL}/api/blog`).then(res => {
      if (!mounted) return;
      setPosts(res.data.posts || []);
      setCategories(res.data.categories || []);
    }).catch(() => {}).finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const filtered = useMemo(() => {
    if (activeCategory === 'all') return posts;
    return posts.filter(p => p.category === activeCategory);
  }, [posts, activeCategory]);

  const featured = filtered.find(p => p.featured) || filtered[0];
  const rest = filtered.filter(p => p !== featured);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--lj-bg)' }} data-testid="blog-index-page">
      <Helmet>
        <title>The Local Jewel Journal — Engagement Ring & Lab Diamond Insights</title>
        <meta name="description" content="Real advice from real jewelers — diamond buying guides, custom design stories, ring trends and behind-the-scenes from The Local Jewel." />
        <link rel="canonical" href="https://thelocaljewel.com/blog" />
        <meta property="og:title" content="The Local Jewel Journal" />
        <meta property="og:description" content="Diamond buying guides, custom design stories, and ring trends." />
      </Helmet>

      <PublicHeader />

      {/* Hero */}
      <section className="px-4 pt-12 pb-8 text-center">
        <div className="max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4"
            style={{ background: 'rgba(15,94,76,0.08)', border: '1px solid rgba(15,94,76,0.15)' }}>
            <BookOpen size={13} style={{ color: 'var(--lj-accent)' }} />
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: 'var(--lj-accent)' }}>
              The Journal
            </span>
          </div>
          <h1 className="text-[32px] sm:text-[48px] leading-[1.05] font-semibold tracking-[-0.02em] mb-4"
            style={{ color: 'var(--lj-text)', fontFamily: 'var(--lj-serif, "Cormorant Garamond","Playfair Display",Georgia,serif)' }}>
            Notes from the studio.
          </h1>
          <p className="text-[15px] sm:text-[17px] leading-[1.55] max-w-xl mx-auto" style={{ color: 'var(--lj-muted)' }}>
            Honest advice from working jewelers — diamond buying, custom design stories, and behind-the-scenes from our Winter Park studio.
          </p>
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <div className="px-4 pb-8">
          <div className="max-w-4xl mx-auto flex flex-wrap gap-2 justify-center" data-testid="blog-categories">
            <button onClick={() => setActiveCategory('all')} data-testid="blog-cat-all"
              className="px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-all duration-200"
              style={{
                background: activeCategory === 'all' ? 'var(--lj-accent)' : 'var(--lj-surface)',
                color: activeCategory === 'all' ? '#FFFFFF' : 'var(--lj-text)',
                border: '1px solid ' + (activeCategory === 'all' ? 'var(--lj-accent)' : 'var(--lj-border)'),
              }}>
              All <span className="opacity-70 ml-1">{posts.length}</span>
            </button>
            {categories.map(c => (
              <button key={c.category} onClick={() => setActiveCategory(c.category)}
                data-testid={`blog-cat-${c.category}`}
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

      {/* Posts */}
      <section className="px-4 pb-16 flex-1 max-w-6xl mx-auto w-full">
        {loading ? (
          <div className="py-20 flex items-center justify-center" style={{ color: 'var(--lj-muted)' }}>
            <Loader2 size={22} className="animate-spin mr-2" /> Loading the journal…
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center" style={{ color: 'var(--lj-muted)' }}>
            <p className="text-[16px] mb-2">No posts yet — check back soon.</p>
            <p className="text-[13px]">We're cooking up some great content.</p>
          </div>
        ) : (
          <>
            {/* Featured post — editorial hero */}
            {featured && (
              <Link to={`/blog/${featured.slug}`} data-testid={`blog-featured-${featured.slug}`}
                className="group block mb-12 rounded-[20px] overflow-hidden transition-all hover:-translate-y-0.5"
                style={{ background: 'var(--lj-surface)', border: '1px solid var(--lj-border)', boxShadow: '0 10px 30px rgba(15,94,76,0.06)' }}>
                <div className="grid lg:grid-cols-[1.1fr_1fr]">
                  <div className="relative aspect-[16/10] lg:aspect-auto overflow-hidden" style={{ background: 'var(--lj-bg)' }}>
                    {featured.hero_image_url ? (
                      <img src={featured.hero_image_url} alt={featured.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center" style={{ color: 'var(--lj-muted)' }}>
                        <BookOpen size={48} style={{ opacity: 0.2 }} />
                      </div>
                    )}
                  </div>
                  <div className="p-7 sm:p-10 flex flex-col justify-center">
                    <div className="text-[11px] uppercase tracking-[0.16em] mb-3" style={{ color: 'var(--lj-accent)' }}>
                      {featured.category || 'Featured'} · {formatDate(featured.published_at || featured.created_at)}
                    </div>
                    <h2 className="text-[28px] sm:text-[36px] leading-[1.1] font-semibold tracking-[-0.02em] mb-3"
                      style={{ color: 'var(--lj-text)', fontFamily: 'var(--lj-serif, "Cormorant Garamond","Playfair Display",Georgia,serif)' }}>
                      {featured.title}
                    </h2>
                    {featured.excerpt && (
                      <p className="text-[14.5px] sm:text-[15.5px] leading-[1.6] mb-5" style={{ color: 'var(--lj-muted)' }}>{featured.excerpt}</p>
                    )}
                    <div className="inline-flex items-center gap-1.5 text-[13.5px] font-medium" style={{ color: 'var(--lj-accent)' }}>
                      Read article <ChevronRight size={15} className="transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </div>
              </Link>
            )}

            {/* Grid of rest */}
            {rest.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6" data-testid="blog-grid">
                {rest.map(p => (
                  <Link key={p.post_id} to={`/blog/${p.slug}`} data-testid={`blog-card-${p.slug}`}
                    className="group block rounded-[18px] overflow-hidden transition-all duration-300 hover:-translate-y-1"
                    style={{ background: 'var(--lj-surface)', border: '1px solid var(--lj-border)' }}>
                    <div className="relative aspect-[16/10] overflow-hidden" style={{ background: 'var(--lj-bg)' }}>
                      {p.hero_image_url ? (
                        <img src={p.hero_image_url} alt={p.title} loading="lazy"
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
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
                      {p.excerpt && (
                        <p className="text-[13px] leading-[1.5] mb-3 line-clamp-3" style={{ color: 'var(--lj-muted)' }}>{p.excerpt}</p>
                      )}
                      <div className="inline-flex items-center gap-1.5 text-[12.5px] font-medium" style={{ color: 'var(--lj-accent)' }}>
                        Read more <ChevronRight size={14} className="transition-transform group-hover:translate-x-1" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </section>

      <footer className="px-4 py-8 text-center" style={{ borderTop: '1px solid var(--lj-border)' }}>
        <div className="flex items-center justify-center gap-3 text-[12px] flex-wrap" style={{ color: 'var(--lj-muted)' }}>
          <a href="/" className="hover:underline">Home</a>
          <span>·</span>
          <a href="/projects" className="hover:underline">Projects</a>
          <span>·</span>
          <a href="/contact" className="hover:underline">Contact</a>
          <span>·</span>
          <a href="/privacy" className="hover:underline">Privacy</a>
          <span>·</span>
          <a href="/terms" className="hover:underline">Terms</a>
        </div>
      </footer>
    </div>
  );
}
