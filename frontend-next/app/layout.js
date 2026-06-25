import './globals.css';
import { Cormorant_Garamond, Outfit } from 'next/font/google';
import JsonLd from '../components/JsonLd';
import { buildOrganizationSchema, WEBSITE_SCHEMA, SITE_BASE_URL } from '../lib/seoSchema';
import { getPublicSettings } from '../lib/api';

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-cormorant',
  display: 'swap',
});
const outfit = Outfit({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-outfit',
  display: 'swap',
});

export const metadata = {
  metadataBase: new URL(SITE_BASE_URL),
  title: {
    default: 'The Local Jewel — Custom Diamond Jewelry, Hand-Crafted in Winter Park, FL',
    template: '%s | The Local Jewel',
  },
  description:
    'Independent custom jewelry studio specializing in lab-grown diamond engagement rings, wedding bands, and fine jewelry. Hand-crafted to order in Winter Park, Florida. Ships in 2–5 business days.',
  openGraph: {
    type: 'website',
    siteName: 'The Local Jewel',
    locale: 'en_US',
    images: ['/logo-main.png'],
  },
  twitter: { card: 'summary_large_image' },
  other: {
    'p:domain_verify': 'f5574418e5175267a612c641412df46d',
    'msvalidate.01': 'D9EF8E754686B50450C757E3E3345C3A',
  },
};

export default async function RootLayout({ children }) {
  // Fetch site settings once (with 60s cache) so sitewide Organization JSON-LD
  // reflects the latest social URLs admin has saved.
  let settings = {};
  try { settings = await getPublicSettings(); } catch { /* render with defaults if backend is down */ }

  const orgSchema = buildOrganizationSchema(settings);

  return (
    <html lang="en" className={`${cormorant.variable} ${outfit.variable}`}>
      <head>
        <link rel="icon" type="image/png" href="/favicon-32x32.png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body>
        <JsonLd id="jsonld-organization" data={orgSchema} />
        <JsonLd id="jsonld-website" data={WEBSITE_SCHEMA} />
        {children}
      </body>
    </html>
  );
}
