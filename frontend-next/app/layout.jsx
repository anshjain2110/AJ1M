import '@/lib/ssr-polyfill';
import './globals.css';
import React from 'react';
import Script from 'next/script';
import Providers from './providers';
import { SITE_URL } from '@/lib/seo';

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'The Local Jewel | Custom Lab-Grown Diamond Jewelry',
    template: '%s | The Local Jewel',
  },
  description:
    'The Local Jewel — Custom Diamond Jewelry. Hand-crafted lab-grown engagement rings, wedding bands and fine jewelry. Ships in 2–5 business days from Winter Park, Florida.',
  applicationName: 'The Local Jewel',
  icons: {
    icon: [
      { url: '/favicon-32x32.png?v=2', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png?v=2', sizes: '16x16', type: 'image/png' },
      { url: '/favicon.ico?v=2' },
    ],
    apple: '/apple-touch-icon.png?v=2',
  },
  verification: {
    other: {
      'p:domain_verify': 'f5574418e5175267a612c641412df46d',
      'msvalidate.01': 'D9EF8E754686B50450C757E3E3345C3A',
    },
  },
  openGraph: { type: 'website', siteName: 'The Local Jewel', url: SITE_URL },
  robots: { index: true, follow: true },
};

export const viewport = {
  themeColor: '#0F5E4C',
  width: 'device-width',
  initialScale: 1,
};

const GTM_ID = 'GTM-MNPPPSTC';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Inter:wght@400;500;600&family=Outfit:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Script id="gtm" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${GTM_ID}');`}
        </Script>
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>

        <Providers>{children}</Providers>

        <Script id="fb-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','1498570451886185');fbq('track','PageView');`}
        </Script>
        <noscript>
          <img height="1" width="1" style={{ display: 'none' }} alt="" src="https://www.facebook.com/tr?id=1498570451886185&ev=PageView&noscript=1" />
        </noscript>

        <Script id="posthog" strategy="afterInteractive">
          {`!function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="init capture identify alias people set set_once register register_once unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset isFeatureEnabled onFeatureFlags getFeatureFlag getFeatureFlagPayload reloadFeatureFlags group updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures getActiveMatchingSurveys getSurveys onSessionId".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);posthog.init('phc_xAvL2Iq4tFmANRE7kzbKwaSqp1HJjN7x48s3vr0CMjs',{api_host:'https://us.i.posthog.com',person_profiles:'identified_only',session_recording:{recordCrossOriginIframes:true,capturePerformance:false}});`}
        </Script>
      </body>
    </html>
  );
}
