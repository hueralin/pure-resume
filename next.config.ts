import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // 标记这些包为外部依赖，避免 Turbopack/Webpack 尝试打包它们导致崩溃
  serverExternalPackages: ['puppeteer', 'bcryptjs'],
};

export default nextConfig;
