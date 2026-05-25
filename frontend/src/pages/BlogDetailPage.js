import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import axios from 'axios';
import { ArrowLeft, Loader2, BookOpen, ArrowRight } from 'lucide-react';
import PublicHeader from '../components/PublicHeader';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

const formatDate = (d) => {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
};

export default function BlogDetailPage() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true); setNotFound(false); setPost(null);
    axios.get(`${BACKEND_URL}/api/blog/${slug}`).then(res => {
      if (!mounted) return;
      setPost(res.data);
      axios.get(`${BACKEND_URL}/api/blog`, { params: { limit: 6 } }).then(r2 => {
        if (mounted) setRelated((r2.data.posts || []).filter(p => p.slug !== slug).slice(0, 3));
      }).catch(() => {});
    }).catch(() => {
      if (mounted) setNotFound(true);
    }).finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: 'var(--lj-bg)' }}>
        <PublicHeader />
        <div className="flex-1 flex items-center justify-center" style={{ color: 'var(--lj-muted)' }}>
          <Loader2 size={22} className="animate-spin mr-2" /> Loading article…
        </div>
      </div>
    );
  }
  if (notFound || !post) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: 'var(--lj-bg)' }}>
        <PublicHeader />
        <div className="flex-1 flex flex-col items-center justify-center px-4 text-center">
          <h1 className="text-[28px] font-semibold mb-2" style={{ color: 'var(--lj-text)' }}>Article not found</h1>
          <Link to="/blog" className="inline-flex items-center gap-1.5 text-[14px]" style={{ color: 'var(--lj-accent)' }}>
            <ArrowLeft size={16} /> Browse the journal
          </Link>
        </div>
      </div>
    );
  }

  const pageTitle = post.meta_title || `${post.title} | The Local Jewel`;
  const desc = post.meta_description || post.excerpt || '';
  const canonical = `https://thelocaljewel.com/blog/${post.slug}`;

  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    image: post.hero_image_url || '',
    datePublished: post.published_at || post.created_at,
    dateModified: post.updated_at || post.published_at || post.created_at,
    author: { '@type': 'Organization', name: post.author_name || 'The Local Jewel' },
    publisher: { '@type': 'Organization', name: 'The Local Jewel', url: 'https://thelocaljewel.com' },
    description: desc,
    mainEntityOfPage: canonical,
  });

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--lj-bg)' }} data-testid="blog-detail-page">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={desc} />
        <link rel="canonical" href={canonical} />
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={desc} />
        <meta property="og:image" content={post.hero_image_url || ''} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={canonical} />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />

      <PublicHeader />

      <article className="max-w-3xl w-full mx-auto px-4 pt-8 pb-12">
        <nav className="mb-6 text-[12px]" style={{ color: 'var(--lj-muted)' }}>
          <Link to="/" className="hover:underline">Home</Link>
          <span className="mx-1.5">·</span>
          <Link to="/blog" className="hover:underline">Journal</Link>
        </nav>

        <div className="text-[11px] uppercase tracking-[0.16em] mb-3" style={{ color: 'var(--lj-accent)' }}>
          {post.category || 'Article'} · {formatDate(post.published_at || post.created_at)}
        </div>
        <h1 className="text-[34px] sm:text-[48px] leading-[1.05] font-semibold tracking-[-0.02em] mb-4"
          style={{ color: 'var(--lj-text)', fontFamily: 'var(--lj-serif, "Cormorant Garamond","Playfair Display",Georgia,serif)' }}>
          {post.title}
        </h1>
        {post.subtitle && (
          <p className="text-[17px] sm:text-[19px] leading-[1.5] mb-6" style={{ color: 'var(--lj-muted)' }}>
            {post.subtitle}
          </p>
        )}
        <div className="flex items-center gap-3 mb-8 text-[13px]" style={{ color: 'var(--lj-muted)' }}>
          <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'rgba(15,94,76,0.08)', color: 'var(--lj-accent)' }}>
            <BookOpen size={15} />
          </div>
          <div>
            <div className="font-medium" style={{ color: 'var(--lj-text)' }}>{post.author_name || 'The Local Jewel'}</div>
            <div className="text-[12px]">Published {formatDate(post.published_at || post.created_at)}</div>
          </div>
        </div>

        {post.hero_image_url && (
          <div className="rounded-[18px] overflow-hidden mb-9" style={{ border: '1px solid var(--lj-border)' }}>
            <img src={post.hero_image_url} alt={post.title} className="w-full h-auto block" />
          </div>
        )}

        {post.content_html ? (
          <div data-testid="blog-content"
            className="prose prose-lg max-w-none blog-content"
            dangerouslySetInnerHTML={{ __html: post.content_html }} />
        ) : (
          <p className="text-[15px]" style={{ color: 'var(--lj-muted)' }}>This article has no content yet.</p>
        )}

        {/* Author CTA */}
        <div className="mt-12 rounded-[18px] p-6"
          style={{ background: 'rgba(15,94,76,0.04)', border: '1px solid var(--lj-border)' }}>
          <div className="text-[11px] uppercase tracking-[0.16em] mb-2" style={{ color: 'var(--lj-accent)' }}>Custom designed for you</div>
          <h3 className="text-[20px] font-semibold mb-2" style={{ color: 'var(--lj-text)', fontFamily: 'var(--lj-serif, "Cormorant Garamond","Playfair Display",Georgia,serif)' }}>
            Ready to design your piece?
          </h3>
          <p className="text-[14px] leading-[1.55] mb-4" style={{ color: 'var(--lj-muted)' }}>
            Get 3D renders + a written quote within 24-48 hours — no payment required until you love the design.
          </p>
          <Link to="/" data-testid="blog-cta-quote"
            className="inline-flex items-center gap-2 min-h-[48px] px-6 rounded-[12px] font-medium text-[15px] transition-all active:scale-[0.99]"
            style={{ background: 'var(--lj-accent)', color: '#FFFFFF' }}>
            Start your custom quote <ArrowRight size={16} />
          </Link>
        </div>
      </article>

      {/* Related */}
      {related.length > 0 && (
        <section className="max-w-6xl w-full mx-auto px-4 pb-16" data-testid="blog-related">
          <h2 className="text-[22px] sm:text-[28px] font-semibold mb-5 tracking-[-0.01em]"
            style={{ color: 'var(--lj-text)', fontFamily: 'var(--lj-serif, "Cormorant Garamond","Playfair Display",Georgia,serif)' }}>
            More from the journal
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {related.map(p => (
              <Link key={p.post_id} to={`/blog/${p.slug}`} data-testid={`blog-related-${p.slug}`}
                className="group block rounded-[16px] overflow-hidden transition-all hover:-translate-y-0.5"
                style={{ background: 'var(--lj-surface)', border: '1px solid var(--lj-border)' }}>
                <div className="aspect-[16/10] overflow-hidden" style={{ background: 'var(--lj-bg)' }}>
                  {p.hero_image_url && <img src={p.hero_image_url} alt={p.title} loading="lazy" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />}
                </div>
                <div className="p-4">
                  <div className="text-[10px] uppercase tracking-[0.14em] mb-1.5" style={{ color: 'var(--lj-accent)' }}>{p.category || 'Journal'}</div>
                  <div className="text-[15px] font-semibold" style={{ color: 'var(--lj-text)', fontFamily: 'var(--lj-serif, "Cormorant Garamond","Playfair Display",Georgia,serif)' }}>
                    {p.title}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <footer className="px-4 py-8 text-center" style={{ borderTop: '1px solid var(--lj-border)' }}>
        <div className="flex items-center justify-center gap-3 text-[12px] flex-wrap" style={{ color: 'var(--lj-muted)' }}>
          <a href="/" className="hover:underline">Home</a>
          <span>·</span>
          <a href="/projects" className="hover:underline">Projects</a>
          <span>·</span>
          <a href="/blog" className="hover:underline">Journal</a>
          <span>·</span>
          <a href="/contact" className="hover:underline">Contact</a>
        </div>
      </footer>
    </div>
  );
}
