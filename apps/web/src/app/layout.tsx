import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Providers } from "./providers";
import { Header } from "@/components/Header";
import "./globals.css";

export const metadata: Metadata = {
  title: "Upkeep - 定期メンテナンス管理",
  description: "予定日ではなく完了日を基準に次回予定日を管理する定期メンテナンス通知アプリ",
  // iOSでホーム画面に追加した際にstandalone表示・ステータスバー等を適切に扱うための設定。
  // manifest.jsonのdisplay:standaloneだけでは不十分なiOS Safariの挙動を補う。
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Upkeep",
  },
  icons: {
    icon: [
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/favicon-16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#2563eb",
};

export default function RootLayout({ children }: { children: ReactNode }): JSX.Element {
  return (
    <html lang="ja">
      <body>
        <Header />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
