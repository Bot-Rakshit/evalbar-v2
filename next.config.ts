import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lichess.org',
      },
      {
        protocol: 'https',
        hostname: 'lichess1.org',
      },
    ],
  },
}

export default nextConfig
