/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React strict mode for better development experience
  reactStrictMode: true,

  // [bundle-barrel-imports] Optimize package imports to avoid loading entire libraries
  // This transforms barrel imports to direct imports at build time
  // e.g., import { Check } from 'lucide-react' -> import Check from 'lucide-react/dist/esm/icons/check'
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "react-icons",
      "@radix-ui/react-icons",
      "framer-motion",
    ],
  },

  // Rewrites for API routes
  async rewrites() {
    return [
      {
        source: "/api/webhooks/socket",
        destination: "/api/webhooks/socket",
      },
    ];
  },
};

module.exports = nextConfig;
