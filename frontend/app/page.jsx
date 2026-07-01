import React from 'react';
import WizardPage from '@/views/WizardPage';
import { getSettings } from '@/lib/api';
import { JsonLd, organizationSchema, websiteSchema, SITE_URL } from '@/lib/seo';

export const revalidate = 300;

export const metadata = {
  title: { absolute: 'The Local Jewel — Custom Lab-Grown Diamond Engagement Rings & Fine Jewelry' },
  description:
    'Custom lab-grown diamond engagement rings, wedding bands & fine jewelry — hand-crafted to order and IGI/GIA certified. Save thousands vs. retail. Free insured shipping from Winter Park, FL.',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'The Local Jewel — Custom Lab-Grown Diamond Jewelry',
    description: 'Hand-crafted, IGI/GIA-certified lab-grown diamond engagement rings & fine jewelry. Free insured shipping.',
    url: SITE_URL,
    images: [{ url: '/hero-photo.jpeg' }],
  },
};

export default async function Home() {
  const settings = await getSettings();
  return (
    <>
      <JsonLd id="jsonld-organization" data={organizationSchema(settings)} />
      <JsonLd id="jsonld-website" data={websiteSchema()} />
      <WizardPage />
    </>
  );
}
