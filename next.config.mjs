/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // Force cache invalidation for Cloud Run deployment
  generateBuildId: async () => {
    return `build-${Date.now()}`;
  },
  env: {
    DATABASE_URL: process.env.DATABASE_URL, // Pass it through explicitly
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "randomuser.me",
      },
    ],
  },
  // Experimental features for App Hosting
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};

export default nextConfig;
