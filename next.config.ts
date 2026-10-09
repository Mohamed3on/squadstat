import { readdirSync, readFileSync } from "node:fs";
import type { NextConfig } from "next";

/** data/*updated-at.txt, inlined for lib/data-version.ts: a Worker has no filesystem to
 *  read data/ from at runtime, and the stamps only change with a data-refresh deploy. */
const dataStamps = Object.fromEntries(
  readdirSync("data")
    .filter((file) => file.endsWith("updated-at.txt"))
    .map((file) => [file, readFileSync(`data/${file}`, "utf-8").trim()]),
);

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
];

const nextConfig: NextConfig = {
  env: { DATA_STAMPS: JSON.stringify(dataStamps) },
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
  async redirects() {
    return [
      // Transfer Balance became the money half of Club Transfers.
      { source: "/transfer-balance", destination: "/club-transfers", permanent: true },
      // The club tables moved off fee-vs-value; `by` and `loans` carry over as
      // they are, since the new page keeps the same names for both.
      {
        source: "/fee-vs-value",
        has: [{ type: "query", key: "view", value: "clubs" }],
        destination: "/club-transfers",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
