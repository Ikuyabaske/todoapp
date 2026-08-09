import type { MetadataRoute } from "next";

// Next.jsのApp Routerによる動的manifest生成。
// /manifest.webmanifest として配信される（Service Workerと同様、
// middlewareの認証チェック対象外に設定済み）。
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Upkeep - 定期メンテナンス管理",
    short_name: "Upkeep",
    description: "予定日ではなく完了日を基準に次回予定日を管理する定期メンテナンス通知アプリ",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f5f6f8",
    theme_color: "#2563eb",
    orientation: "portrait",
    lang: "ja",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
