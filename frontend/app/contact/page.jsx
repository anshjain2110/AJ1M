import React from 'react';
import ContactPage from '@/views/ContactPage';
import { getSettings } from '@/lib/api';
import { JsonLd, localBusinessSchema, breadcrumbSchema } from '@/lib/seo';

export const revalidate = 3600;

export const metadata = {
  title: { absolute: 'Contact The Local Jewel — Talk to a Jeweler Today' },
  description:
    'Get in touch with The Local Jewel. Call 585-710-8292, email ansh@thelocaljewel.com, or visit our Winter Park, FL studio. Custom engagement rings, lab-grown diamonds, certified.',
  alternates: { canonical: '/contact' },
};

export default async function Page() {
  const settings = await getSettings();
  const crumbs = [
    { name: 'Home', url: '/' },
    { name: 'Contact', url: '/contact' },
  ];
  return (
    <>
      <JsonLd id="jsonld-localbusiness" data={localBusinessSchema(settings)} />
      <JsonLd id="jsonld-breadcrumb" data={breadcrumbSchema(crumbs)} />
      <ContactPage initialSettings={settings} />
    </>
  );
}
