import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

export const RenderShowcase = () => {
  const [pairs, setPairs] = useState([]);
  const scrollRef = useRef(null);
  const animRef = useRef(null);
  const speedRef = useRef(0.5);

  useEffect(() => {
    axios.get(`${BACKEND_URL}/api/showcase-pairs`)
      .then(res => {
        const p = res.data.pairs || [];
        if (p.length > 0) setPairs([...p, ...p, ...p]);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!pairs.length || !scrollRef.current) return;
    const el = scrollRef.current;
    let pos = 0;

    const animate = () => {
      pos += speedRef.current;
      const singleSetWidth = el.scrollWidth / 3;
      if (pos >= singleSetWidth) pos -= singleSetWidth;
      el.scrollLeft = pos;
      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [pairs]);

  const handleMouseEnter = () => { speedRef.current = 0.15; };
  const handleMouseLeave = () => { speedRef.current = 0.5; };

  if (!pairs.length) return null;

  return (
    <div className="py-8 overflow-hidden" style={{ borderTop: '1px solid var(--lj-border)' }} data-testid="render-showcase">
      <div className="px-4 mb-5">
        <p className="text-center text-[13px] font-medium tracking-[0.08em] uppercase" style={{ color: 'var(--lj-accent)' }}>
          From Vision to Reality
        </p>
        <p className="text-center text-[11px] mt-1" style={{ color: 'var(--lj-muted)' }}>
          See how our 3D renders become stunning finished pieces
        </p>
      </div>

      <div
        ref={scrollRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="flex gap-5 overflow-hidden cursor-grab select-none"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
      >
        {pairs.map((pair, i) => (
          <div key={`${pair.pair_id}-${i}`} className="shrink-0" style={{ width: '320px' }}>
            <div className="relative rounded-[14px] overflow-hidden" style={{ height: '200px', background: 'var(--lj-bg)', border: '1px solid var(--lj-border)' }}>
              {/* Render (left half) */}
              <div className="absolute inset-0" style={{ clipPath: 'polygon(0 0, 55% 0, 45% 100%, 0 100%)' }}>
                <img
                  src={`${BACKEND_URL}${pair.render_image?.url || ''}`}
                  alt={`${pair.title || 'Jewelry'} - 3D Render`}
                  className="w-full h-full object-cover"
                />
                {/* Subtle render overlay */}
                <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(15,94,76,0.06) 0%, transparent 60%)' }} />
              </div>

              {/* Product (right half) */}
              <div className="absolute inset-0" style={{ clipPath: 'polygon(55% 0, 100% 0, 100% 100%, 45% 100%)' }}>
                <img
                  src={`${BACKEND_URL}${pair.product_image?.url || ''}`}
                  alt={`${pair.title || 'Jewelry'} - Finished`}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Center divider line with glow */}
              <div className="absolute top-0 bottom-0" style={{
                left: '50%',
                transform: 'translateX(-50%) rotate(5deg) scaleY(1.1)',
                width: '2px',
                background: 'rgba(255,255,255,0.85)',
                boxShadow: '0 0 12px rgba(255,255,255,0.5), 0 0 4px rgba(15,94,76,0.3)',
                zIndex: 10,
              }} />

              {/* Labels */}
              <div className="absolute bottom-2.5 left-3 px-2 py-1 rounded-[6px] text-[10px] font-medium tracking-[0.05em] uppercase"
                style={{ background: 'rgba(0,0,0,0.55)', color: '#fff', backdropFilter: 'blur(8px)', zIndex: 11 }}>
                3D Render
              </div>
              <div className="absolute bottom-2.5 right-3 px-2 py-1 rounded-[6px] text-[10px] font-medium tracking-[0.05em] uppercase"
                style={{ background: 'rgba(15,94,76,0.75)', color: '#fff', backdropFilter: 'blur(8px)', zIndex: 11 }}>
                Final Piece
              </div>
            </div>

            {pair.title && (
              <p className="text-center text-[12px] mt-2.5 font-medium" style={{ color: 'var(--lj-text)' }}>
                {pair.title}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
