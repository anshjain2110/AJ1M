const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  env: {
    REACT_APP_BACKEND_URL: process.env.REACT_APP_BACKEND_URL || '',
  },
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  images: { unoptimized: true },
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
