import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname),
  },
  async redirects() {
    return [
      {
        source: "/",
        destination: "/matricula",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
