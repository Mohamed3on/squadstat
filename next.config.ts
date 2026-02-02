import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "tmssl.akamaized.net",
      },
      {
        protocol: "https",
        hostname: "img.a.transfermarkt.technology",
      },
    ],
  },
};

export default nextConfig;
