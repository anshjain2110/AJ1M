const path = require('path');

// Legacy CRA (non-migrated routes: /admin, /pitch, and a few static pages)
// runs as an internal service. Proxy those exact paths + the CRA's /static
// assets to it. Same-pod localhost by default; overridable for deploy.
const LEGACY_ORIGIN = (process.env.LEGACY_CRA_URL || 'http://localhost:3002').replace(/\/$/, '');
const legacy = (p) => ({ source: p, destination: `${LEGACY_ORIGIN}${p}` });

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  env: {
    REACT_APP_BACKEND_URL: process.env.REACT_APP_BACKEND_URL || '',
  },
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  images: { unoptimized: true },
  async rewrites() {
    return {
      beforeFiles: [
        legacy('/admin'),
        legacy('/admin/:path*'),
        legacy('/pitch'),
        legacy('/pitch/:path*'),
        legacy('/thank-you'),
        legacy('/privacy'),
        legacy('/terms'),
        legacy('/cuts'),
        legacy('/products/:path*'),
        legacy('/projects'),
        legacy('/projects/:slug/v2'),
        legacy('/static/:path*'),
      ],
    };
  },
  async headers() {
    return [
      { source: '/admin/:path*', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] },
      { source: '/pitch/:path*', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] },
    ];
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      'react-router-dom': path.resolve(__dirname, 'src/compat/router.jsx'),
      'react-helmet-async': path.resolve(__dirname, 'src/compat/helmet.jsx'),
      '@': path.resolve(__dirname, 'src'),
    };
    return config;
  },
};

module.exports = nextConfig;
