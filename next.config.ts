import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    domains: [
      'rxbjrjxswtmlveybttmp.supabase.co', // Supabase storage domain
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
};

export default nextConfig;
