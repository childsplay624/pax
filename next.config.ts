import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "irlgvhngbomhjrsnqhzc.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  // Allow next-pwa webpack plugin if needed in future
  turbopack: {},
};

export default nextConfig;
