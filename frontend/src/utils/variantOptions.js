// Shared variant + pricing helpers for the storefront.
// Every project is a buyable product priced by a metal-tier x carat matrix.
// Gold colour (White/Rose/Yellow) is a free style choice and never changes price.

export const METAL_TIERS = [
  { id: 'silver', label: 'Sterling Silver', short: 'Silver', colors: [] },
  { id: '10k', label: '10K Gold', short: '10K', colors: ['White', 'Rose', 'Yellow'] },
  { id: '14k', label: '14K Gold', short: '14K', colors: ['White', 'Rose', 'Yellow'] },
  { id: '18k', label: '18K Gold', short: '18K', colors: ['White', 'Rose', 'Yellow'] },
  { id: 'platinum', label: 'Platinum', short: 'Platinum', colors: [] },
];

export const CARAT_WEIGHTS = ['1', '2', '2.5', '3', '3.5', '4']; // legacy default
export const GOLD_COLORS = ['White', 'Rose', 'Yellow'];
export const COLOR_SWATCH = { White: '#E9E9E9', Rose: '#E6B7A9', Yellow: '#E7C233' };

// Sentinel carat key for metal-only product types (wedding bands, stand-alone).
export const METAL_ONLY_KEY = '0';

// Product types decide the carat variations a piece is sold in (mirror of the backend).
export const PRODUCT_TYPES = [
  { id: 'engagement_ring', label: 'Engagement Ring', carats: ['1', '1.5', '2', '2.5', '3', '4'], buyable: true, has_carat: true },
  { id: 'wedding_band', label: 'Wedding Band', carats: [], buyable: true, has_carat: false },
  { id: 'engagement_ring_set', label: 'Engagement Ring Set', carats: ['1', '1.5', '2', '2.5', '3', '4'], buyable: true, has_carat: true },
  { id: 'pendant_studs', label: 'Pendant / Studs', carats: ['0.25', '0.5', '1', '2', '3', '4', '5', '8', '10'], buyable: true, has_carat: true },
  { id: 'stand_alone', label: 'Stand-Alone', carats: [], buyable: true, has_carat: false },
  { id: 'custom_project', label: 'Custom Project', carats: [], buyable: false, has_carat: false },
];
export const PRODUCT_TYPE_MAP = PRODUCT_TYPES.reduce((a, p) => { a[p.id] = p; return a; }, {});
export const caratsForType = (t) => (PRODUCT_TYPE_MAP[t]?.carats) || CARAT_WEIGHTS;
export const typeHasCarat = (t) => (PRODUCT_TYPE_MAP[t] ? !!PRODUCT_TYPE_MAP[t].has_carat : true);
export const typeIsBuyable = (t) => (PRODUCT_TYPE_MAP[t] ? !!PRODUCT_TYPE_MAP[t].buyable : true);

export const money = (n) => `$${Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

export const variantPrice = (matrix, tier, carat) => {
  const v = ((matrix || {})[tier] || {})[String(carat)];
  const n = Number(v);
  return n > 0 ? n : 0;
};

export const fromPrice = (matrix) => {
  const all = [];
  Object.values(matrix || {}).forEach((row) =>
    Object.values(row || {}).forEach((v) => { const n = Number(v); if (n > 0) all.push(n); })
  );
  return all.length ? Math.min(...all) : 0;
};

// Tiers / carats are derived directly from the matrix so any product type's
// carat set is reflected automatically.
export const availableTiers = (matrix) =>
  METAL_TIERS.filter((m) => {
    const row = (matrix || {})[m.id];
    return row && Object.values(row).some((v) => Number(v) > 0);
  });

export const availableCaratsForTier = (matrix, tier) => {
  const row = (matrix || {})[tier] || {};
  return Object.keys(row)
    .filter((c) => c !== METAL_ONLY_KEY && Number(row[c]) > 0)
    .sort((a, b) => Number(a) - Number(b));
};

export const metalLabel = (tier, color) => {
  const m = METAL_TIERS.find((x) => x.id === tier);
  if (!m) return '';
  return color && m.colors.length ? `${m.short} ${color} Gold` : m.label;
};

export const applySale = (price, sale) =>
  sale && sale.percent ? Math.round(Number(price) * (1 - Number(sale.percent) / 100)) : Number(price);

// Map a raw Project document into the product-card shape (used for "More like
// this" and anywhere we only have the full project doc, not the card API).
export const projectToCard = (p, sale = null) => {
  if (!p) return null;
  const matrix = p.price_matrix || {};
  const base = fromPrice(matrix);
  const onSale = !!sale && base > 0;
  const price = onSale ? applySale(base, sale) : base;
  const gallery = p.gallery || [];
  const hero = p.hero_image_url || (gallery[0] && gallery[0].url) || '';
  const video = gallery.find((g) => g.url && g.media_type === 'video');
  const altImg = gallery.find((g) => g.url && g.media_type !== 'video' && g.url !== hero);
  const tiers = availableTiers(matrix).map((t) => t.id);
  const caratSet = new Set();
  tiers.forEach((t) => availableCaratsForTier(matrix, t).forEach((c) => caratSet.add(c)));
  const carats = [...caratSet].sort((a, b) => Number(a) - Number(b));
  return {
    slug: p.slug,
    title: p.title,
    subtitle: p.subtitle || '',
    hero_image_url: hero,
    hover_media: video
      ? { url: video.url, media_type: 'video' }
      : (altImg ? { url: altImg.url, media_type: 'image' } : null),
    price,
    compare_at_price: onSale ? base : null,
    badge: p.badge || '',
    rating: p.rating,
    review_count: p.review_count || 0,
    metal_tiers: tiers,
    carat_range: carats.length ? [carats[0], carats[carats.length - 1]] : null,
  };
};
