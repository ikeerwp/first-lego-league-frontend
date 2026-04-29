import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ["lucide-react", "@fortawesome/free-solid-svg-icons"],
  },
};

export default nextConfig;
