"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

/**
 * 設定画面以外では歯車ボタンで/settingsへ、設定画面自体では前の画面に戻るボタンとして働く。
 */
export function SettingsNavButton(): JSX.Element {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === "/settings") {
    return (
      <button
        type="button"
        className="icon-btn"
        aria-label="戻る"
        title="戻る"
        onClick={() => router.back()}
      >
        ⚙
      </button>
    );
  }

  return (
    <Link className="icon-btn" href="/settings" aria-label="設定" title="設定">
      ⚙
    </Link>
  );
}
