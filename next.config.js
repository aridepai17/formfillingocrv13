/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Suppress hydration warnings for browser extension attributes
  experimental: {
    suppressHydrationWarning: true,
  },
}

module.exports = nextConfig
