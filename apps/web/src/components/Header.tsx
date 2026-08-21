import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth";
import { SettingsNavButton } from "@/components/SettingsNavButton";

/**
 * 全ページ共通のヘッダー。スクロールしても常に主要な導線に戻れるようにする。
 * 未ログイン時（ログイン/サインアップ画面など）は表示しない。
 */
export async function Header(): Promise<JSX.Element | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return null;
  }

  return (
    <header className="app-header">
      <div className="app-header-inner">
        <span className="app-header-brand">Upkeep</span>
        <nav className="app-header-nav">
          <a className="btn btn-sm" href="https://home.ikuya-baske.com">
            ポータルへ
          </a>
          <Link className="btn btn-sm" href="/">
            ホーム
          </Link>
          <Link className="btn btn-primary btn-sm" href="/tasks">
            タスク一覧
          </Link>
          <Link className="btn btn-sm" href="/tasks/history">
            履歴
          </Link>
          <SettingsNavButton />
        </nav>
      </div>
    </header>
  );
}
