/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Allow Next image optimization for all R2 / public sources we currently use
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.r2.cloudflarestorage.com' },
      { protocol: 'https', hostname: '**.r2.dev' },
      { protocol: 'https', hostname: 'customer-assets.emergentagent.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'cdn.thelocaljewel.com' },
      { protocol: 'https', hostname: 'thelocaljewel.com' },
      { protocol: 'https', hostname: 'www.thelocaljewel.com' },
    ],
  },
  // Preserve the existing /products/:slug → /projects/:slug redirect
  async redirects() {
    return [
      { source: '/products/:slug', destination: '/projects/:slug', permanent: true },
    ];
  },
  // Proxy /api/* to the FastAPI backend (so the Next.js dev server, on port 3001,
  // can call the local backend on port 8001 in the same dev container).
  async rewrites() {
    const backendUrl = process.env.BACKEND_URL_INTERNAL || 'http://localhost:8001';
    return [
      { source: '/api/:path*', destination: `${backendUrl}/api/:path*` },
    ];
  },
};

module.exports = nextConfig;
