import withPWA from 'next-pwa';
import runtimeCaching from 'next-pwa/cache.js';

/** @type {import('next').NextConfig} */
const baseConfig = { reactStrictMode: true };
const isDev = process.env.NODE_ENV === 'development';

const nextConfig = {   reactStrictMode: true,   experimental: { optimizePackageImports: ["xlsx"] } };
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: isDev, // PWA só em produção
  runtimeCaching,
  buildExcludes: [/middleware-manifest\.json$/]
})(baseConfig);
