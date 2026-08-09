"use client";

import { useEffect } from "react";

/** アプリ起動時にService Workerを登録する（画面には何も表示しない）。 */
export function PwaRegister(): null {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch((error: unknown) => {
        console.error("[pwa] Service Worker登録に失敗しました:", error);
      });
    }
  }, []);

  return null;
}
