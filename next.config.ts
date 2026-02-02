import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    domains: [
      'rxbjrjxswtmlveybttmp.supabase.co',
      'www.clipartmax.com',
      'cdn-icons-png.freepik.com',
      'e7.pngegg.com',
      'img.freepik.com',
      'cdn-icons-png.freepik.com',
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
