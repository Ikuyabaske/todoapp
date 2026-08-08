const path = require("node:path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Dockerでの実行に最適化された standalone 出力を使用する。
  output: "standalone",
  experimental: {
    // npm workspaces のモノレポ構成のため、依存関係の追跡対象ルートを
    // リポジトリルートに明示する（Next.js公式のモノレポ向け設定）。
    outputFileTracingRoot: path.join(__dirname, "../../"),
  },
};

module.exports = nextConfig;
