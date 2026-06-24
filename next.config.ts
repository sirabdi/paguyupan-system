import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root ke folder project ini. Tanpa ini, Next.js naik ke
  // parent (D:\Work\Me) yang juga punya package-lock.json dan salah menebak root.
  turbopack: {
    root: __dirname,
  },
  images: {
    // Izinkan gambar dari /uploads (disimpan di public/uploads)
    localPatterns: [{ pathname: "/uploads/**" }],
  },
};

export default nextConfig;
