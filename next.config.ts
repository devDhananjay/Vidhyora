import type { NextConfig } from "next";

const securityHeaders = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "X-Frame-Options",
    value: "SAMEORIGIN",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(self), payment=(self)",
  },
  {
    key: "Cross-Origin-Opener-Policy",
    value: "same-origin-allow-popups",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
      "frame-ancestors 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com https://*.razorpay.com https://www.googletagmanager.com https://www.google-analytics.com https://apis.google.com https://*.googleapis.com https://*.gstatic.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: blob: https: http:",
      "font-src 'self' data: https://fonts.gstatic.com",
      "connect-src 'self' https://*.razorpay.com https://api.razorpay.com https://*.googleapis.com https://*.google-analytics.com https://*.googletagmanager.com https://*.firebaseio.com https://*.firebaseapp.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com wss: https://storage.googleapis.com",
      "frame-src 'self' https://api.razorpay.com https://*.razorpay.com https://accounts.google.com https://*.firebaseapp.com https://www.google.com https://maps.google.com https://www.google.co.in https://*.google.com https://www.openstreetmap.org",
      "media-src 'self' blob: https: data:",
      "worker-src 'self' blob:",
      "upgrade-insecure-requests",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  output: "standalone",
  // Next 15.5 still reads bodySizeLimit from experimental.serverActions
  // (top-level `serverActions` is ignored → default 1 MB, which breaks CMS uploads).
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
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
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
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
