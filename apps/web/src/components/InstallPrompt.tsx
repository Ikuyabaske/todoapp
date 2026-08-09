"use client";

import { useEffect, useState } from "react";

// Chrome/Android等が発火するbeforeinstallprompt(標準の型定義には未収録)。
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isIos(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const nav = navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches || nav.standalone === true;
}

/**
 * ホーム画面への追加を案内するUI。
 * - 既にstandalone起動中なら何も表示しない
 * - iOS(Safari)はプログラムからの追加ができないため手順を案内する
 * - Android/Chrome等はbeforeinstallpromptを使ってボタンから直接追加できる
 */
export function InstallPrompt(): JSX.Element | null {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(true); // SSRとの不一致を避けるため初期はtrue

  useEffect(() => {
    setInstalled(isStandalone());

    function handleBeforeInstallPrompt(event: Event): void {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  if (installed) {
    return <p className="muted">✅ ホーム画面から起動中です（standalone表示）。</p>;
  }

  if (isIos()) {
    return (
      <p className="muted">
        iPhoneの場合: Safariの共有ボタン（□に↑のアイコン）→「ホーム画面に追加」を選択してください。
      </p>
    );
  }

  if (deferredPrompt) {
    return (
      <button
        className="btn btn-primary"
        type="button"
        onClick={async () => {
          await deferredPrompt.prompt();
          await deferredPrompt.userChoice;
          setDeferredPrompt(null);
        }}
      >
        ホーム画面に追加
      </button>
    );
  }

  return <p className="muted">ブラウザのメニューから「ホーム画面に追加」を選択してください。</p>;
}
