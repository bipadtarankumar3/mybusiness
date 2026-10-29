/** @type {import('next').NextConfig} */
const BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:5050';

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  distDir: process.env.NEXT_BUILD_DIR || '.next',
  async rewrites() {
    // Proxy API calls to the Express backend so auth cookies stay same-origin (no CORS issues).
    return [{ source: '/api/v1/:path*', destination: `${BACKEND_URL}/api/v1/:path*` }];
  },
};

export default nextConfig;
