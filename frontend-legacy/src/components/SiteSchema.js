/**
 * SiteSchema — mounted once at the App root, injects sitewide JSON-LD
 * (Organization + WebSite) into the document head on every route.
 *
 * The org/site facts come from /api/admin/settings/public so the merchant can
 * edit social URLs (sameAs) from Admin → Settings without a redeploy.
 */
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Helmet } from 'react-helmet-async';
import { buildOrganizationSchema } from '../utils/seoSchema';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
const SITE_BASE = 'https://www.thelocaljewel.com';

const WEBSITE = {
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

export default function SiteSchema() {
  const [settings, setSettings] = useState({});

  useEffect(() => {
    axios.get(`${BACKEND_URL}/api/admin/settings/public`).then((r) => setSettings(r.data || {})).catch(() => {});
  }, []);

  const org = buildOrganizationSchema(settings);
  const orgJson = JSON.stringify(org);
  const siteJson = JSON.stringify(WEBSITE);

  return (
    <>
      <Helmet>
        <link rel="canonical" href={typeof window !== 'undefined' ? window.location.origin + window.location.pathname : SITE_BASE} />
      </Helmet>
      {/* JSON-LD outside Helmet (react-helmet-async only accepts plain string children) */}
      <script type="application/ld+json" data-testid="jsonld-organization" dangerouslySetInnerHTML={{ __html: orgJson }} />
      <script type="application/ld+json" data-testid="jsonld-website" dangerouslySetInnerHTML={{ __html: siteJson }} />
    </>
  );
}
