import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: [
      "images.unsplash.com", // pl. Unsplash
      "example.com",        // ha van más host
    ],
  },
};

export default nextConfig;
