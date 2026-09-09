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
        {
          protocol: "https",
          hostname: "lh3.googleusercontent.com",
        },
      ],
    },
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.vidyora.co.in" }],
        destination: "https://vidyora.co.in/:path*",
        permanent: true,
      },
      {
        source: "/xml",
        destination: "/sitemap.xml",
        permanent: true,
      },
      {
        source: "/privacy",
        destination: "/privacy-policy",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
