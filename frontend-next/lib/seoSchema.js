/**
 * SEO schema builders — JSON-LD generators for Organization, WebSite,
 * Product, BreadcrumbList, LocalBusiness. Ported from /app/frontend/src/utils/seoSchema.js
 * but rewritten to return plain objects (callers stringify and embed in <script>).
 *
 * IMPORTANT: AggregateRating/Review schema is intentionally NOT emitted. Re-enable
 * only once a real first-party customer-review module is wired up.
 */

const SITE_BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.thelocaljewel.com';

const compact = (obj) => {
  if (Array.isArray(obj)) {
    const out = obj.map(compact).filter((v) => v !== undefined && v !== null && v !== '' && !(Array.isArray(v) && v.length === 0) && !(typeof v === 'object' && Object.keys(v).length === 0));
    return out;
  }
  if (obj && typeof obj === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
      if (v === undefined || v === null || v === '') continue;
      const cleaned = compact(v);
      if (Array.isArray(cleaned) ? cleaned.length : (typeof cleaned !== 'object' || Object.keys(cleaned).length)) {
        out[k] = cleaned;
      }
    }
    return out;
  }
  return obj;
};

export function buildOrganizationSchema(settings = {}) {
  const sameAs = [
    settings.instagram_url, settings.tiktok_url, settings.pinterest_url,
    settings.etsy_url, settings.facebook_url, settings.youtube_url,
    settings.google_business_url, settings.wikidata_url,
  ].filter(Boolean);
  return compact({
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${SITE_BASE}/#organization`,
    name: settings.business_name || 'The Local Jewel',
    legalName: settings.business_name || 'The Local Jewel',
    url: SITE_BASE,
    logo: `${SITE_BASE}/logo-main.png`,
    image: `${SITE_BASE}/logo-main.png`,
    description:
      'Independent custom jewelry studio specializing in lab-grown diamond engagement rings, wedding bands and fine jewelry. Hand-crafted to order in Winter Park, Florida.',
    foundingDate: '2024',
    founders: [
      { '@type': 'Person', name: 'Ansh' },
      { '@type': 'Person', name: 'Nayan' },
    ],
    address: {
      '@type': 'PostalAddress',
      streetAddress: '480 N Orlando Ave',
      addressLocality: 'Winter Park',
      addressRegion: 'FL',
      postalCode: '32789',
      addressCountry: 'US',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: settings.business_phone || '+1-585-710-8292',
      email: settings.business_email || 'ansh@thelocaljewel.com',
      contactType: 'customer service',
      areaServed: 'US',
      availableLanguage: ['English'],
    },
    sameAs,
  });
}

export const WEBSITE_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': `${SITE_BASE}/#website`,
  url: SITE_BASE,
  name: 'The Local Jewel',
  publisher: { '@id': `${SITE_BASE}/#organization` },
  potentialAction: {
    '@type': 'SearchAction',
    target: { '@type': 'EntryPoint', urlTemplate: `${SITE_BASE}/collections?q={query}` },
    'query-input': 'required name=query',
  },
};

export function buildBreadcrumbSchema(items = []) {
  if (!items.length) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: it.url ? (it.url.startsWith('http') ? it.url : `${SITE_BASE}${it.url}`) : undefined,
    })),
  };
}

export function buildProductSchema({ project, settings = {} }) {
  if (!project) return null;
  const url = `${SITE_BASE}/projects/${project.slug}`;
  const image = project.hero_image_url || (project.gallery_urls && project.gallery_urls[0]);
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

  const schema = compact({
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${url}#product`,
    name: project.title,
    description: project.subtitle || (project.description || '').slice(0, 320),
    image,
    url,
    sku: project.slug,
    mpn: project.slug,
    brand: { '@id': `${SITE_BASE}/#organization` },
    manufacturer: { '@id': `${SITE_BASE}/#organization` },
    material: 'Lab-grown diamond, 14K Gold, 18K Gold, Platinum',
    category: 'Jewelry > Fine jewelry',
    additionalProperty,
  });

  if (price > 0) {
    schema.offers = {
      '@type': 'Offer',
      url,
      priceCurrency: currency,
      price: String(price),
      availability: 'https://schema.org/InStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: { '@id': `${SITE_BASE}/#organization` },
      shippingDetails: {
        '@type': 'OfferShippingDetails',
        shippingRate: { '@type': 'MonetaryAmount', value: '0', currency },
        shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'US' },
        deliveryTime: {
          '@type': 'ShippingDeliveryTime',
          handlingTime: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 2, unitCode: 'DAY' },
          transitTime: { '@type': 'QuantitativeValue', minValue: 2, maxValue: 5, unitCode: 'DAY' },
        },
      },
      hasMerchantReturnPolicy: {
        '@type': 'MerchantReturnPolicy',
        applicableCountry: 'US',
        returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
        merchantReturnDays: 30,
        returnMethod: 'https://schema.org/ReturnByMail',
        returnFees: 'https://schema.org/FreeReturn',
      },
    };
  }

  return schema;
}

export function buildLocalBusinessSchema(settings = {}) {
  return compact({
    '@context': 'https://schema.org',
    '@type': 'JewelryStore',
    '@id': `${SITE_BASE}/#localbusiness`,
    name: settings.business_name || 'The Local Jewel',
    image: `${SITE_BASE}/logo-main.png`,
    url: SITE_BASE,
    telephone: settings.business_phone || '+1-585-710-8292',
    email: settings.business_email || 'ansh@thelocaljewel.com',
    priceRange: '$$$',
    address: {
      '@type': 'PostalAddress',
      streetAddress: '480 N Orlando Ave',
      addressLocality: 'Winter Park',
      addressRegion: 'FL',
      postalCode: '32789',
      addressCountry: 'US',
    },
    geo: { '@type': 'GeoCoordinates', latitude: 28.5995, longitude: -81.3490 },
    openingHoursSpecification: [
      { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], opens: '09:00', closes: '18:00' },
      { '@type': 'OpeningHoursSpecification', dayOfWeek: 'Saturday', opens: '10:00', closes: '16:00' },
    ],
    areaServed: { '@type': 'Country', name: 'United States' },
  });
}

export function buildArticleSchema({ post, url }) {
  if (!post) return null;
  return compact({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt || post.title,
    image: post.cover_image_url,
    datePublished: post.published_at || post.created_at,
    dateModified: post.updated_at || post.published_at || post.created_at,
    author: {
      '@type': post.author_type === 'org' ? 'Organization' : 'Person',
      name: post.author || 'The Local Jewel',
    },
    publisher: { '@id': `${SITE_BASE}/#organization` },
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
  });
}

export const SITE_BASE_URL = SITE_BASE;
