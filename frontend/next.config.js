const path = require('path');

// Legacy CRA (non-migrated routes: /admin, /pitch, and a few static pages)
// are served as a self-contained static SPA shell bundled into this Next.js
// app itself: public/legacy.html (the CRA index) + public/static/* (its JS/CSS
// bundles). No separate service, reverse proxy, or `serve` binary is required,
// so the standard single-frontend Emergent deploy works out of the box.
const legacy = (p) => ({ source: p, destination: '/legacy.html' });

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
