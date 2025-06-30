/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable ESLint during builds
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Disable TypeScript errors during builds
  typescript: {
    ignoreBuildErrors: true,
  },

  reactStrictMode: false, // Temporariamente desabilitado para debug
  swcMinify: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
};

module.exports = nextConfig;
