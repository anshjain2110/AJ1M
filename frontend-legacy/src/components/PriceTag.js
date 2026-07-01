import React from 'react';

/**
 * Eye-catching price tag for project cards & detail hero.
 * Renders as a small badge by default; size="lg" for the detail hero.
 */
export default function PriceTag({ price, prefix = 'Starting at', currency = 'USD', size = 'sm', testid = 'price-tag' }) {
  if (!price && price !== 0) return null;
  const formatted = Number(price).toLocaleString('en-US', {
    style: 'currency',
    currency: currency || 'USD',
    maximumFractionDigits: 0,
  });

  if (size === 'lg') {
    return (
      <div
        data-testid={testid}
        className="inline-flex items-baseline gap-2 px-4 py-2 rounded-[12px]"
        style={{
          background: 'var(--lj-accent)',
          color: '#FFFFFF',
          boxShadow: '0 6px 18px rgba(15,94,76,0.28)',
        }}
      >
        {prefix && (
          <span className="text-[11px] uppercase tracking-[0.16em] font-semibold opacity-85">{prefix}</span>
        )}
        <span className="text-[22px] sm:text-[26px] font-semibold tracking-[-0.01em]" style={{ fontFeatureSettings: '"tnum"' }}>
          {formatted}
        </span>
      </div>
    );
  }

  // Card tag — sits on top-right of image
  return (
    <div
      data-testid={testid}
      className="inline-flex items-baseline gap-1.5 px-2.5 py-1 rounded-full"
      style={{
        background: 'var(--lj-accent)',
        color: '#FFFFFF',
        boxShadow: '0 3px 10px rgba(15,94,76,0.30)',
        backdropFilter: 'blur(4px)',
      }}
    >
      {prefix && (
        <span className="text-[9px] uppercase tracking-[0.12em] font-semibold opacity-85">{prefix}</span>
      )}
      <span className="text-[12.5px] font-semibold" style={{ fontFeatureSettings: '"tnum"' }}>
        {formatted}
      </span>
    </div>
  );
}
