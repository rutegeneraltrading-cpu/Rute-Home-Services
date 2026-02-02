import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    domains: ['rxbjrjxswtmlveybttmp.supabase.co'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
};

export default nextConfig;
