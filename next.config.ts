/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Temporariamente desabilitado para debug
  swcMinify: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
};

module.exports = nextConfig;
