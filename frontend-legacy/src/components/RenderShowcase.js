import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

export const RenderShowcase = () => {
  const [pairs, setPairs] = useState([]);
  const stripRef = useRef(null);
  const animRef = useRef(null);
  const speedRef = useRef(0.6);

  useEffect(() => {
    axios.get(`${BACKEND_URL}/api/showcase-pairs`)
      .then(res => {
        const p = res.data.pairs || [];
        if (p.length > 0) setPairs([...p, ...p, ...p, ...p, ...p]);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!pairs.length || !stripRef.current) return;
    const singleSetWidth = stripRef.current.scrollWidth / 5;
    let pos = 0;

    const animate = () => {
      pos += speedRef.current;
      if (pos >= singleSetWidth) pos -= singleSetWidth;
      // Offset by -2 sets so there's always content to the left and right
      stripRef.current.style.transform = `translateX(${-2 * singleSetWidth + pos}px)`;
      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [pairs]);

  const handleMouseEnter = () => { speedRef.current = 0.2; };
  const handleMouseLeave = () => { speedRef.current = 0.6; };

  if (!pairs.length) return null;

  const IMAGE_W = 220;
  const IMAGE_H = 260;
  const GAP = 16;

  return (
    <div className="py-8 overflow-hidden" style={{ borderTop: '1px solid var(--lj-border)' }} data-testid="render-showcase">
      <div className="px-4 mb-5">
        <p className="text-center text-[13px] font-medium tracking-[0.08em] uppercase" style={{ color: 'var(--lj-accent)' }}>
          From Vision to Reality
        </p>
        <p className="text-center text-[11px] mt-1" style={{ color: 'var(--lj-muted)' }}>
          See how our 3D renders transform into stunning finished pieces
        </p>
      </div>

      {/* The viewport — fixed center divider, left=renders, right=products */}
      <div
        className="relative mx-auto select-none cursor-grab"
        style={{ height: `${IMAGE_H}px`, overflow: 'hidden', maxWidth: '100vw' }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* RENDER LAYER — visible only on the LEFT half */}
        <div
          className="absolute inset-0"
          style={{ clipPath: 'inset(0 50% 0 0)' }}
        >
          <div
            ref={stripRef}
            className="flex items-center"
            style={{ gap: `${GAP}px`, willChange: 'transform' }}
          >
            {pairs.map((pair, i) => (
              <div
                key={`r-${pair.pair_id}-${i}`}
                className="shrink-0 rounded-[12px] overflow-hidden"
                style={{
                  width: `${IMAGE_W}px`,
                  height: `${IMAGE_H}px`,
                  background: 'var(--lj-bg)',
                  border: '1px solid var(--lj-border)',
                }}
              >
                <img
                  src={`${BACKEND_URL}${pair.render_image?.url || ''}`}
                  alt={`${pair.title || 'Jewelry'} render`}
                  className="w-full h-full object-cover"
                  draggable={false}
                />
              </div>
            ))}
          </div>
        </div>

        {/* PRODUCT LAYER — visible only on the RIGHT half, scrolls in sync */}
        <div
          className="absolute inset-0"
          style={{ clipPath: 'inset(0 0 0 50%)' }}
        >
          <ProductStrip pairs={pairs} stripRef={stripRef} imageW={IMAGE_W} imageH={IMAGE_H} gap={GAP} />
        </div>

        {/* CENTER DIVIDER — the "transformation" line */}
        <div
          className="absolute top-0 bottom-0 pointer-events-none"
          style={{
            left: '50%',
            transform: 'translateX(-50%)',
            width: '3px',
            background: 'rgba(255,255,255,0.9)',
            boxShadow: '0 0 20px 4px rgba(15,94,76,0.25), 0 0 60px 8px rgba(15,94,76,0.08)',
            zIndex: 30,
          }}
        />

        {/* Fade edges */}
        <div className="absolute inset-y-0 left-0 w-16 pointer-events-none" style={{ background: 'linear-gradient(to right, var(--lj-bg), transparent)', zIndex: 20 }} />
        <div className="absolute inset-y-0 right-0 w-16 pointer-events-none" style={{ background: 'linear-gradient(to left, var(--lj-bg), transparent)', zIndex: 20 }} />

        {/* Labels */}
        <div className="absolute top-3 left-4 px-2.5 py-1 rounded-[6px] text-[10px] font-semibold tracking-[0.06em] uppercase pointer-events-none"
          style={{ background: 'rgba(0,0,0,0.5)', color: '#fff', backdropFilter: 'blur(8px)', zIndex: 25 }}>
          3D Render
        </div>
        <div className="absolute top-3 right-4 px-2.5 py-1 rounded-[6px] text-[10px] font-semibold tracking-[0.06em] uppercase pointer-events-none"
          style={{ background: 'rgba(15,94,76,0.7)', color: '#fff', backdropFilter: 'blur(8px)', zIndex: 25 }}>
          Final Piece
        </div>
      </div>
    </div>
  );
};

/**
 * ProductStrip mirrors the render strip's scroll position
 * but shows product images instead of renders.
 */
function ProductStrip({ pairs, stripRef, imageW, imageH, gap }) {
  const productRef = useRef(null);

  useEffect(() => {
    if (!stripRef.current || !productRef.current) return;

    const observer = new MutationObserver(() => {
      if (stripRef.current && productRef.current) {
        productRef.current.style.transform = stripRef.current.style.transform;
      }
    });

    // Also sync via RAF for smooth animation
    let running = true;
    const sync = () => {
      if (!running) return;
      if (stripRef.current && productRef.current) {
        productRef.current.style.transform = stripRef.current.style.transform;
      }
      requestAnimationFrame(sync);
    };
    requestAnimationFrame(sync);

    observer.observe(stripRef.current, { attributes: true, attributeFilter: ['style'] });
    return () => { running = false; observer.disconnect(); };
  }, [stripRef]);

  return (
    <div
      ref={productRef}
      className="flex items-center"
      style={{ gap: `${gap}px`, willChange: 'transform' }}
    >
      {pairs.map((pair, i) => (
        <div
          key={`p-${pair.pair_id}-${i}`}
          className="shrink-0 rounded-[12px] overflow-hidden"
          style={{
            width: `${imageW}px`,
            height: `${imageH}px`,
            background: 'var(--lj-bg)',
            border: '1px solid var(--lj-border)',
          }}
        >
          <img
            src={`${BACKEND_URL}${pair.product_image?.url || ''}`}
            alt={`${pair.title || 'Jewelry'} final`}
            className="w-full h-full object-cover"
            draggable={false}
          />
        </div>
      ))}
    </div>
  );
}
