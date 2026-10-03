import type { NextConfig } from "next";

const nextConfig: NextConfig = {
   allowedDevOrigins: ['192.168.56.1'],
  images: {
    // Unsplash URLs are already sized/compressed via query params; skipping
    // the optimizer avoids server-side upstream fetches and timeouts.
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
