'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/** Client-side gallery with thumbnail picker — but the FIRST image is also
 * rendered as a plain <img> on the server (in page.js) so bots see hero. */
export default function ProductGallery({ images = [], title = '' }) {
  const [idx, setIdx] = useState(0);
  if (!images.length) return null;
  const cur = images[idx];
  return (
    <div data-testid="pdp-gallery">
      <div className="relative overflow-hidden rounded-[18px]" style={{ aspectRatio: '1/1', background: 'var(--lj-surface)' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img key={cur} src={cur} alt={title} className="absolute inset-0 w-full h-full object-cover" />
        {images.length > 1 && (
          <>
            <button onClick={() => setIdx((idx - 1 + images.length) % images.length)} aria-label="Previous image" className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.92)' }}>
              <ChevronLeft size={18} />
            </button>
            <button onClick={() => setIdx((idx + 1) % images.length)} aria-label="Next image" className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.92)' }}>
              <ChevronRight size={18} />
            </button>
          </>
        )}
      </div>
      {images.length > 1 && (
        <div className="grid grid-cols-5 gap-2 mt-3" data-testid="pdp-thumbs">
          {images.slice(0, 5).map((src, i) => (
            <button key={i} onClick={() => setIdx(i)} className="overflow-hidden rounded-[10px]" style={{ aspectRatio: '1', border: i === idx ? '2px solid var(--lj-accent)' : '1px solid var(--lj-border)' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={`${title} thumbnail ${i + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
