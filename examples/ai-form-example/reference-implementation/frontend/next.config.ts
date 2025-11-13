import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactDevOverlay: false,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
