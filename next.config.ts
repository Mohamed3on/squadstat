import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["geist"],
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
