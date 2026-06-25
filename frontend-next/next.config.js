/** @type {import('next').NextConfig} */
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
  async rewrites() {
    const backend = process.env.BACKEND_URL_INTERNAL || 'http://localhost:8001';
    const legacy = process.env.LEGACY_FRONTEND_URL_INTERNAL || 'http://localhost:3001';
    return {
      // beforeFiles: try these BEFORE Next.js file system routing.
      beforeFiles: [],
      // afterFiles: applied AFTER Next.js routes match (i.e. only if Next has no match).
      afterFiles: [
        // FastAPI backend — all /api/* not handled by a Next.js route file goes here.
        { source: '/api/:path*', destination: `${backend}/api/:path*` },
        // Admin, dashboard, cart, checkout-success, pitch — auth/complex routes kept on
        // the legacy CRA app running on port 3001. URL paths preserved exactly.
        { source: '/admin/:path*', destination: `${legacy}/admin/:path*` },
        { source: '/admin', destination: `${legacy}/admin` },
        { source: '/dashboard', destination: `${legacy}/dashboard` },
        { source: '/dashboard/:path*', destination: `${legacy}/dashboard/:path*` },
        { source: '/cart', destination: `${legacy}/cart` },
        { source: '/checkout/success', destination: `${legacy}/checkout/success` },
        { source: '/pitch', destination: `${legacy}/pitch` },
        { source: '/pitch/:path*', destination: `${legacy}/pitch/:path*` },
        { source: '/thank-you', destination: `${legacy}/thank-you` },
        // CRA dev server static assets
        { source: '/static/:path*', destination: `${legacy}/static/:path*` },
        { source: '/sockjs-node/:path*', destination: `${legacy}/sockjs-node/:path*` },
      ],
      // fallback: if all of the above + Next.js routes miss → still forward to legacy CRA
      // (covers any URL we haven't explicitly ported yet, like /thank-you).
      fallback: [],
    };
  },
};

module.exports = nextConfig;
