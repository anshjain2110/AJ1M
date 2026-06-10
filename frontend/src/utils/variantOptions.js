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

export const CARAT_WEIGHTS = ['1', '2', '2.5', '3', '3.5', '4'];
export const GOLD_COLORS = ['White', 'Rose', 'Yellow'];
export const COLOR_SWATCH = { White: '#E9E9E9', Rose: '#E6B7A9', Yellow: '#E7C233' };

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

export const availableTiers = (matrix) =>
  METAL_TIERS.filter((m) => CARAT_WEIGHTS.some((c) => variantPrice(matrix, m.id, c) > 0));

export const availableCaratsForTier = (matrix, tier) =>
  CARAT_WEIGHTS.filter((c) => variantPrice(matrix, tier, c) > 0);

export const metalLabel = (tier, color) => {
  const m = METAL_TIERS.find((x) => x.id === tier);
  if (!m) return '';
  return color && m.colors.length ? `${m.short} ${color} Gold` : m.label;
};

export const applySale = (price, sale) =>
  sale && sale.percent ? Math.round(Number(price) * (1 - Number(sale.percent) / 100)) : Number(price);
