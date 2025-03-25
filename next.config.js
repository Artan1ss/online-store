/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Allow builds to continue even with ESLint warnings or errors
  eslint: {
    // Don't stop production builds even if there are errors
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig 