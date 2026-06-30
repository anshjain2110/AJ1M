/**
 * Server-side SEO + JSON-LD builders. Single canonical host (www).
 * No AggregateRating/Review schema is emitted anywhere — there is no
 * first-party on-page review system yet (Etsy reviews are third-party).
 */
import React from 'react';

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.thelocaljewel.com').replace(/\/$/, '');
export const ORG_ID = `${SITE_URL}/#organization`;
export const WEBSITE_ID = `${SITE_URL}/#website`;

export const absUrl = (path = '/') => (path.startsWith('http') ? path : `${SITE_URL}${path.startsWith('/') ? '' : '/'}${path}`);

// Mirror of backend variant_options.METAL_TIERS
const METAL_TIERS = [
  { id: 'silver', label: 'Sterling Silver', short: 'Silver', colors: [] },
  { id: '10k', label: '10K Gold', short: '10K', colors: ['White', 'Rose', 'Yellow'] },
  { id: '14k', label: '14K Gold', short: '14K', colors: ['White', 'Rose', 'Yellow'] },
  { id: '18k', label: '18K Gold', short: '18K', colors: ['White', 'Rose', 'Yellow'] },
  { id: 'platinum', label: 'Platinum', short: 'Platinum', colors: [] },
];
const METAL_ONLY_KEY = '0';

const compact = (obj) => {
  if (Array.isArray(obj)) {
    const arr = obj.map(compact).filter((v) => v !== undefined && v !== null && !(typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length === 0));
    return arr;
  }
  if (obj && typeof obj === 'object') {
    const out = {};
    Object.entries(obj).forEach(([k, v]) => {
      if (v === undefined || v === null || v === '') return;
      if (Array.isArray(v)) {
        const c = compact(v);
        if (c.length) out[k] = c;
      } else if (typeof v === 'object') {
        const c = compact(v);
        if (Object.keys(c).length) out[k] = c;
      } else {
        out[k] = v;
      }
    });
    return out;
  }
  return obj;
};

export function JsonLd({ data, id }) {
  if (!data) return null;
  const payload = Array.isArray(data) ? data.map(compact) : compact(data);
  return (
    <script
      type="application/ld+json"
      data-testid={id}
      dangerouslySetInnerHTML={{ __html: JSON.stringify(payload) }}
    />
  );
}

export function organizationSchema(settings = {}) {
  const sameAs = [
    settings.instagram_url, settings.tiktok_url, settings.pinterest_url, settings.etsy_url,
    settings.facebook_url, settings.youtube_url, settings.google_business_url, settings.wikidata_url,
  ].filter(Boolean);
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': ORG_ID,
    name: settings.business_name || 'The Local Jewel',
    legalName: settings.business_name || 'The Local Jewel',
    url: SITE_URL,
    logo: `${SITE_URL}/logo-main.png`,
    image: `${SITE_URL}/logo-main.png`,
    description: 'Independent custom jewelry studio specializing in lab-grown diamond engagement rings, wedding bands and fine jewelry. Hand-crafted to order in Winter Park, Florida.',
    foundingDate: '2024',
    founders: [ { '@type': 'Person', name: 'Ansh' }, { '@type': 'Person', name: 'Nayan' } ],
    address: { '@type': 'PostalAddress', streetAddress: '480 N Orlando Ave', addressLocality: 'Winter Park', addressRegion: 'FL', postalCode: '32789', addressCountry: 'US' },
    contactPoint: { '@type': 'ContactPoint', telephone: settings.business_phone || '+1-585-710-8292', email: settings.business_email || 'ansh@thelocaljewel.com', contactType: 'customer service', areaServed: 'US', availableLanguage: ['English'] },
    sameAs,
  };
}

export function websiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    url: SITE_URL,
    name: 'The Local Jewel',
    publisher: { '@id': ORG_ID },
    potentialAction: { '@type': 'SearchAction', target: { '@type': 'EntryPoint', urlTemplate: `${SITE_URL}/collections?q={query}` }, 'query-input': 'required name=query' },
  };
}

export function breadcrumbSchema(items = []) {
  if (!items.length) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem', position: i + 1, name: it.name,
      item: it.url ? absUrl(it.url) : undefined,
    })),
  };
}

function productImage(project) {
  return project.hero_image_url || (project.gallery_urls && project.gallery_urls[0]) || `${SITE_URL}/logo-main.png`;
}

function shippingDetails(currency) {
  return {
    '@type': 'OfferShippingDetails',
    shippingRate: { '@type': 'MonetaryAmount', value: '0', currency },
    shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'US' },
    deliveryTime: {
      '@type': 'ShippingDeliveryTime',
      handlingTime: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 2, unitCode: 'DAY' },
      transitTime: { '@type': 'QuantitativeValue', minValue: 2, maxValue: 5, unitCode: 'DAY' },
    },
  };
}

function returnPolicy() {
  return {
    '@type': 'MerchantReturnPolicy',
    applicableCountry: 'US',
    returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
    merchantReturnDays: 30,
    returnMethod: 'https://schema.org/ReturnByMail',
    returnFees: 'https://schema.org/FreeReturn',
  };
}

function certification(specs) {
  const c = (specs.certification || '').toUpperCase();
  if (!c.includes('IGI') && !c.includes('GIA')) return undefined;
  const issuer = c.includes('GIA') ? 'GIA' : 'IGI';
  return {
    '@type': 'Certification',
    name: `${issuer} Certified`,
    issuedBy: { '@type': 'Organization', name: issuer === 'GIA' ? 'Gemological Institute of America' : 'International Gemological Institute' },
    certificationIdentification: specs.cert_number || undefined,
    certificationStatus: 'https://schema.org/CertificationActive',
  };
}

export function productSchema(project, settings = {}) {
  const url = `${SITE_URL}/projects/${project.slug}`;
  const specs = project.specs || {};
  const price = project.from_price || 0;
  const currency = (project.price_currency || 'USD').toUpperCase();
  const additionalProperty = [
    specs.shape && { '@type': 'PropertyValue', name: 'Diamond shape', value: specs.shape },
    specs.carat && { '@type': 'PropertyValue', name: 'Carat weight', value: String(specs.carat), unitText: 'ct' },
    specs.color && { '@type': 'PropertyValue', name: 'Color grade', value: specs.color },
    specs.clarity && { '@type': 'PropertyValue', name: 'Clarity grade', value: specs.clarity },
    specs.cut && { '@type': 'PropertyValue', name: 'Cut grade', value: specs.cut },
    specs.setting_style && { '@type': 'PropertyValue', name: 'Setting style', value: specs.setting_style },
    specs.certification && { '@type': 'PropertyValue', name: 'Certification', value: specs.certification },
    specs.cert_number && { '@type': 'PropertyValue', name: 'Certificate number', value: specs.cert_number },
  ].filter(Boolean);

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${url}#product`,
    name: project.title,
    description: project.subtitle || (project.description || '').slice(0, 320) || project.title,
    image: productImage(project),
    url,
    sku: project.slug,
    mpn: project.slug,
    brand: { '@type': 'Brand', name: settings.business_name || 'The Local Jewel' },
    material: 'Lab-grown diamond, 14K Gold, 18K Gold, Platinum',
    category: 'Jewelry > Fine jewelry',
    additionalProperty,
    hasCertification: certification(specs),
  };
  if (price > 0) {
    schema.offers = {
      '@type': 'Offer', url, priceCurrency: currency, price: String(price),
      availability: 'https://schema.org/InStock', itemCondition: 'https://schema.org/NewCondition',
      seller: { '@id': ORG_ID },
      shippingDetails: shippingDetails(currency),
      hasMerchantReturnPolicy: returnPolicy(),
    };
  }
  return schema;
}

export function productGroupSchema(project, settings = {}) {
  const matrix = project.price_matrix || {};
  const currency = (project.price_currency || 'USD').toUpperCase();
  const url = `${SITE_URL}/projects/${project.slug}`;
  const img = productImage(project);
  const variants = [];
  for (const tier of METAL_TIERS) {
    const row = matrix[tier.id];
    if (!row || typeof row !== 'object') continue;
    const colors = tier.colors.length ? tier.colors : [null];
    for (const [caratKey, rawPrice] of Object.entries(row)) {
      const price = Number(rawPrice) || 0;
      if (price <= 0) continue;
      const isMetalOnly = String(caratKey) === METAL_ONLY_KEY;
      for (const color of colors) {
        const material = color ? `${tier.short} ${color} Gold` : tier.label;
        const sizeLabel = isMetalOnly ? undefined : `${caratKey} ct`;
        const sku = `${project.slug}-${tier.id}${color ? `-${color.toLowerCase()}` : ''}${isMetalOnly ? '' : `-${caratKey}ct`}`;
        const name = `${project.title} — ${material}${sizeLabel ? `, ${sizeLabel}` : ''}`;
        variants.push({
          '@type': 'Product',
          name,
          sku,
          image: img,
          material,
          size: sizeLabel,
          inProductGroupWithID: project.slug,
          offers: {
            '@type': 'Offer', priceCurrency: currency, price: String(price),
            availability: 'https://schema.org/InStock', itemCondition: 'https://schema.org/NewCondition',
            url, seller: { '@id': ORG_ID },
            shippingDetails: shippingDetails(currency),
            hasMerchantReturnPolicy: returnPolicy(),
          },
        });
        if (variants.length >= 80) break;
      }
      if (variants.length >= 80) break;
    }
    if (variants.length >= 80) break;
  }
  if (!variants.length) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'ProductGroup',
    '@id': `${url}#productgroup`,
    name: project.title,
    description: project.subtitle || (project.description || '').slice(0, 320) || project.title,
    url,
    image: img,
    brand: { '@type': 'Brand', name: settings.business_name || 'The Local Jewel' },
    productGroupID: project.slug,
    variesBy: ['https://schema.org/material', 'https://schema.org/size'],
    hasVariant: variants,
  };
}

export function localBusinessSchema(settings = {}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'JewelryStore',
    '@id': `${SITE_URL}/#localbusiness`,
    name: settings.business_name || 'The Local Jewel',
    image: `${SITE_URL}/logo-main.png`,
    url: SITE_URL,
    telephone: settings.business_phone || '+1-585-710-8292',
    email: settings.business_email || 'ansh@thelocaljewel.com',
    priceRange: '$$$',
    address: { '@type': 'PostalAddress', streetAddress: '480 N Orlando Ave', addressLocality: 'Winter Park', addressRegion: 'FL', postalCode: '32789', addressCountry: 'US' },
    geo: { '@type': 'GeoCoordinates', latitude: 28.5995, longitude: -81.349 },
    openingHoursSpecification: [
      { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], opens: '09:00', closes: '18:00' },
      { '@type': 'OpeningHoursSpecification', dayOfWeek: 'Saturday', opens: '10:00', closes: '16:00' },
    ],
    areaServed: { '@type': 'Country', name: 'United States' },
  };
}

export function blogPostingSchema(post) {
  const url = `${SITE_URL}/blog/${post.slug}`;
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    '@id': `${url}#post`,
    headline: post.title,
    description: post.excerpt || post.meta_description || '',
    image: post.cover_image || post.hero_image || `${SITE_URL}/logo-main.png`,
    datePublished: post.published_at || post.created_at,
    dateModified: post.updated_at || post.published_at || post.created_at,
    author: { '@type': 'Organization', name: 'The Local Jewel', '@id': ORG_ID },
    publisher: { '@id': ORG_ID },
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    url,
  };
}
