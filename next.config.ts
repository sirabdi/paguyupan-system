import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Izinkan gambar dari /uploads (disimpan di public/uploads)
    localPatterns: [{ pathname: "/uploads/**" }],
  },
};

export default nextConfig;
