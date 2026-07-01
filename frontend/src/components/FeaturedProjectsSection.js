'use client';
import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import PriceTag from './PriceTag';
import ProjectInquiryChat from './ProjectInquiryChat';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

/**
 * Luxury "Featured Work" section on the homepage.
 *
 * - Pulls latest projects via /api/projects
 * - Renders an editorial-style asymmetric grid with subtle motion
 * - Each tile is clickable → /projects/[slug]
 */
export default function FeaturedProjectsSection() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    axios.get(`${BACKEND_URL}/api/projects`, { params: { limit: 8 } })
      .then(res => { if (!cancelled) setProjects(res.data.projects || []); })
      .catch(e => console.error('Featured projects fetch failed', e))
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const scrollBy = (dir) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * (el.clientWidth * 0.85), behavior: 'smooth' });
  };

  if (!loading && projects.length === 0) return null;

  return (
    <section data-testid="featured-projects-section" className="relative w-full"
      style={{ background: 'linear-gradient(180deg, var(--lj-bg) 0%, #FAF8F3 100%)' }}>

      {/* Decorative dividers */}
      <div aria-hidden="true" className="h-px max-w-6xl mx-auto"
        style={{ background: 'linear-gradient(90deg, transparent, var(--lj-border) 20%, var(--lj-border) 80%, transparent)' }} />

      <div className="max-w-6xl mx-auto px-5 sm:px-8 pt-14 sm:pt-20 pb-14 sm:pb-20">

        {/* Section header — editorial layout */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5 mb-9 sm:mb-12">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 text-[10.5px] uppercase tracking-[0.22em] mb-4 px-2.5 py-1 rounded-full"
              style={{ background: 'rgba(15,94,76,0.06)', color: 'var(--lj-accent)', border: '1px solid rgba(15,94,76,0.18)' }}>
              <span className="w-1 h-1 rounded-full" style={{ background: 'var(--lj-accent)' }} />
              Featured Work
            </div>
            <h2 className="text-[34px] sm:text-[44px] lg:text-[52px] leading-[1.05] tracking-[-0.02em]"
              style={{ color: 'var(--lj-text)', fontFamily: 'var(--lj-serif, "Cormorant Garamond","Playfair Display",Georgia,serif)', fontWeight: 500 }}>
              Recently crafted
              <span style={{ display: 'block', fontStyle: 'italic', color: 'var(--lj-accent)' }}>for couples like you.</span>
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => scrollBy(-1)} aria-label="Previous"
              data-testid="featured-projects-prev"
              className="w-11 h-11 rounded-full flex items-center justify-center transition-all hover:bg-[var(--lj-surface)]"
              style={{ border: '1px solid var(--lj-border)', color: 'var(--lj-text)' }}>
              <ChevronLeft size={18} />
            </button>
            <button onClick={() => scrollBy(1)} aria-label="Next"
              data-testid="featured-projects-next"
              className="w-11 h-11 rounded-full flex items-center justify-center transition-all hover:bg-[var(--lj-surface)]"
              style={{ border: '1px solid var(--lj-border)', color: 'var(--lj-text)' }}>
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* Horizontal scroll rail (editorial) */}
        <div
          ref={scrollRef}
          data-testid="featured-projects-rail"
          className="flex gap-5 sm:gap-7 overflow-x-auto pb-6 -mx-5 px-5 sm:-mx-8 sm:px-8"
          style={{ scrollSnapType: 'x mandatory', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <style>{`[data-testid="featured-projects-rail"]::-webkit-scrollbar{display:none}`}</style>
          {(loading ? Array.from({ length: 4 }).map((_, i) => ({ _skeleton: true, i })) : projects).map((p, idx) => (
            p._skeleton
              ? <SkeletonCard key={`s-${idx}`} />
              : <ProjectCard key={p.project_id || p.slug || idx} project={p} index={idx}
                  onClick={() => navigate(`/projects/${p.slug}`)} />
          ))}
        </div>

        {/* Footer CTA */}
        <div className="mt-9 flex flex-col sm:flex-row items-center justify-between gap-4 pt-6"
          style={{ borderTop: '1px solid var(--lj-border)' }}>
          <p className="text-[14px] leading-[1.5] max-w-md text-center sm:text-left" style={{ color: 'var(--lj-muted)' }}>
            Every piece is custom designed, IGI-certified, and approved by the customer before fabrication.
          </p>
          <button
            onClick={() => navigate('/projects')}
            data-testid="featured-projects-see-all"
            className="inline-flex items-center gap-2 px-5 min-h-[48px] rounded-[12px] font-medium text-[14.5px] transition-all duration-300 active:scale-[0.99]"
            style={{ background: 'var(--lj-text)', color: '#FFFFFF' }}
          >
            See all projects <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </section>
  );
}

const ProjectCard = ({ project, index, onClick }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '0px 0px -10% 0px' });
  const heroUrl = project.hero_image_url
    || project.gallery?.[0]?.url
    || '';

  return (
    <motion.div
      ref={ref}
      data-testid={`featured-project-card-${project.slug || index}`}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
      className="group flex-shrink-0 text-left relative"
      style={{
        scrollSnapAlign: 'start',
        width: 'min(78vw, 320px)',
      }}
    >
      {/* Clickable image card → project detail */}
      <button
        type="button"
        onClick={onClick}
        aria-label={`View project ${project.title}`}
        className="block w-full text-left relative overflow-hidden rounded-[18px] mb-4"
        style={{
          background: 'var(--lj-surface)',
          aspectRatio: '4/5',
          boxShadow: '0 14px 40px -10px rgba(15,94,76,0.18)',
          border: '1px solid var(--lj-border)',
        }}>
        {heroUrl ? (
          <img
            src={heroUrl}
            alt={project.title}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.06]"
            draggable="false"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[13px]" style={{ color: 'var(--lj-muted)' }}>
            No image
          </div>
        )}

        {/* Top corner badges */}
        <div className="absolute top-3 left-3 flex gap-1.5">
          {(project.tags || []).slice(0, 1).map((t, i) => (
            <span key={i} className="text-[9.5px] uppercase tracking-[0.14em] font-semibold px-2 py-1 rounded-full"
              style={{ background: 'rgba(255,255,255,0.92)', color: 'var(--lj-text)', backdropFilter: 'blur(8px)' }}>
              {String(t).replace(/_/g, ' ')}
            </span>
          ))}
        </div>

        {/* Price tag (top-right) */}
        {(project.price !== null && project.price !== undefined && project.price !== '') && (
          <div className="absolute top-3 right-3">
            <PriceTag price={project.price} prefix={project.price_prefix} currency={project.price_currency} testid={`featured-price-${project.slug}`} />
          </div>
        )}

        {/* Bottom shimmer gradient + CTA on hover */}
        <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-1/3 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{ background: 'linear-gradient(180deg, transparent, rgba(0,0,0,0.55))' }} />
        <div className="absolute left-4 right-4 bottom-4 flex items-center justify-between opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-500">
          <span className="text-[11px] uppercase tracking-[0.18em] font-semibold" style={{ color: '#FFFFFF' }}>
            View project
          </span>
          <span className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.95)', color: 'var(--lj-text)' }}>
            <ArrowRight size={14} />
          </span>
        </div>
      </button>

      {/* Meta — also a clickable region */}
      <button type="button" onClick={onClick} className="block w-full text-left px-1 mb-3"
        aria-label={`View ${project.title} details`}>
        <div className="text-[11px] uppercase tracking-[0.18em] mb-1.5" style={{ color: 'var(--lj-muted)' }}>
          {project.client_name || 'Custom design'} · {project.location || project.timeline || 'TheLocalJewel'}
        </div>
        <h3 className="text-[19px] sm:text-[21px] leading-[1.2] mb-1.5 tracking-[-0.01em]"
          style={{ color: 'var(--lj-text)', fontFamily: 'var(--lj-serif, "Cormorant Garamond","Playfair Display",Georgia,serif)' }}>
          {project.title}
        </h3>
        {project.description && (
          <p className="text-[13px] leading-[1.5] line-clamp-2" style={{ color: 'var(--lj-muted)' }}>
            {project.description}
          </p>
        )}
      </button>

      {/* Marketplace-style inquiry chat — embedded below each card */}
      <div className="px-1">
        <ProjectInquiryChat project={project} compact />
      </div>
    </motion.div>
  );
};

const SkeletonCard = () => (
  <div className="flex-shrink-0" style={{ width: 'min(78vw, 320px)', scrollSnapAlign: 'start' }}>
    <div className="rounded-[18px] mb-4" style={{ background: 'var(--lj-surface)', aspectRatio: '4/5', border: '1px solid var(--lj-border)' }} />
    <div className="h-3 w-1/2 rounded mb-2" style={{ background: 'var(--lj-surface)' }} />
    <div className="h-5 w-3/4 rounded mb-1" style={{ background: 'var(--lj-surface)' }} />
    <div className="h-3 w-full rounded" style={{ background: 'var(--lj-surface)' }} />
  </div>
);