import nextPwa from "next-pwa";

/** @type {import('next').NextConfig} */
const isDev = process.env.NODE_ENV !== "production";

const withPWA = nextPwa({
  dest: "public",
  register: true,
  skipWaiting: true,
  // Desabilita PWA no dev; habilita em produção (Vercel)
  disable: isDev,
  buildExcludes: [/middleware-manifest\.json$/],
});

const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // ajuda o bundler com o pacote xlsx
    optimizePackageImports: ["xlsx"],
  },
};

export default withPWA(nextConfig);
