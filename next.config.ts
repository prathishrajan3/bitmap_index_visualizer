import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Compress assets using Brotli and Gzip to minimize Fast Data Transfer on Vercel
  compress: true,

  // Strip unnecessary headers to save bandwidth on every response
  poweredByHeader: false,

  // Strict React checks to prevent client memory leaks
  reactStrictMode: true,

  // Treat Prisma as external to prevent large query engine binaries from bundling into serverless functions
  serverExternalPackages: ['@prisma/client', 'prisma'],

  // Optimize static assets caching on Vercel Edge CDN to minimize Fast Origin Transfer
  async headers() {
    return [
      {
        source: '/:all*(svg|jpg|png|webp|ico|woff|woff2|json)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
