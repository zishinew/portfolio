import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    deviceSizes: [640, 750, 828, 1080, 1200, 1280, 1440, 1600, 1920, 2048, 2560, 3840],
    imageSizes: [32, 48, 64, 96, 128, 256, 320, 384, 512],
    qualities: [75],
  },
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
