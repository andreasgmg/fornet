import type { NextConfig } from "next";

const nextConfig: NextConfig = {
experimental: {
     serverActions: {
      allowedOrigins: [
        "localhost:3000", 
        "fornet.se:3000", 
        "*.fornet.se:3000",
        "172.19.42.147:3000" // Din WSL IP från loggen
      ],
    },
  },
};

export default nextConfig;
