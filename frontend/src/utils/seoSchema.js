/**
 * SEO schema helpers — emits JSON-LD <script> tags as React children.
 *
 * Reads social URLs etc. from /api/admin/settings/public (already fetched by
 * MegaMenuHeader on every page). Each helper returns a <script> element that
 * the page renders directly — react-helmet-async has a quirk with arbitrary
 * script children, so we use plain <script dangerouslySetInnerHTML>.
 */

const SITE_BASE = 'https://www.thelocaljewel.com';

const compact = (obj) => {
  const out = Array.isArray(obj) ? [] : {};
  Object.entries(obj).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0)) return;
    if (typeof v === 'object') {
      const cleaned = compact(v);
      if (Array.isArray(cleaned) ? cleaned.length : Object.keys(cleaned).length) {
        Array.isArray(out) ? out.push(cleaned) : (out[k] = cleaned);
      }
    } else {
      Array.isArray(out) ? out.push(v) : (out[k] = v);
    }
  });
  return out;
};

const tag = (obj, testid) => (
  <script
    type="application/ld+json"
    data-testid={testid}
    // eslint-disable-next-line react/no-danger
    dangerouslySetInnerHTML={{ __html: JSON.stringify(compact(obj)) }}
  />
);

export const buildOrganizationSchema = (settings = {}) => {
  const sameAs = [
    settings.instagram_url,
    settings.tiktok_url,
    settings.pinterest_url,
    settings.etsy_url,
    settings.facebook_url,
    settings.youtube_url,
    settings.google_business_url,
    settings.wikidata_url,
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
      postalCode: '32771',
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
};

export const OrganizationSchema = ({ settings }) => tag(buildOrganizationSchema(settings), 'jsonld-organization');

export const WebSiteSchema = () => tag({
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
}, 'jsonld-website');

export const BreadcrumbSchema = ({ items = [] }) => {
  if (!items.length) return null;
  return tag({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: it.url ? (it.url.startsWith('http') ? it.url : `${SITE_BASE}${it.url}`) : undefined,
    })),
  }, 'jsonld-breadcrumb');
};

export const ProductSchema = ({ project, settings = {}, rating, reviewCount }) => {
  if (!project) return null;
  const url = `${SITE_BASE}/projects/${project.slug}`;
  const image = project.hero_image_url || (project.gallery_urls && project.gallery_urls[0]);
  const specs = project.specs || {};
  const price = project.from_price || 0;
  const currency = (project.price_currency || 'USD').toUpperCase();

  // additionalProperty — diamond-specific facts that machine extractors love
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

  const materials = ['Lab-grown diamond', '14K Gold', '18K Gold', 'Platinum'].join(', ');

  const schema = {
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
    material: materials,
    category: 'Jewelry > Fine jewelry',
    additionalProperty,
  };

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

  // AggregateRating — uses the per-product rating already on the PDP, capped to
  // the global review count from settings so it stays honest in aggregate.
  if (rating && reviewCount) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: String(rating),
      reviewCount: String(reviewCount),
      bestRating: '5',
      worstRating: '1',
    };
  }

  return tag(schema, 'jsonld-product');
};

export const LocalBusinessSchema = ({ settings = {} }) => tag({
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
    postalCode: '32771',
    addressCountry: 'US',
  },
  geo: { '@type': 'GeoCoordinates', latitude: 28.5995, longitude: -81.3490 },
  openingHoursSpecification: [
    { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], opens: '09:00', closes: '18:00' },
    { '@type': 'OpeningHoursSpecification', dayOfWeek: 'Saturday', opens: '10:00', closes: '16:00' },
  ],
  areaServed: { '@type': 'Country', name: 'United States' },
}, 'jsonld-localbusiness');

export default {
  OrganizationSchema,
  WebSiteSchema,
  BreadcrumbSchema,
  ProductSchema,
  LocalBusinessSchema,
};
