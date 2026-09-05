import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverActions: {
    bodySizeLimit: "50mb",
  },
  allowedDevOrigins: [
    "127.0.0.1",
    "192.168.1.136",
    "192.168.1.0/24",
    "192.168.29.7",
    "192.168.29.0/24",
  ],
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "placehold.co",
      },
    ],
  },
};

export default nextConfig;
