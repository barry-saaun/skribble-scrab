import type { NextConfig } from "next";
import MiniCssExtractPlugin from "mini-css-extract-plugin";
import "./src/env";

const nextConfig: NextConfig = {
  output: "export",
  webpack: (config, { isServer }) => {
    config.plugins.push(new MiniCssExtractPlugin());
    return config;
  },
};

export default nextConfig;
