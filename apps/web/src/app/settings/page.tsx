import Link from "next/link";
import { InstallPrompt } from "@/components/InstallPrompt";
import { NotificationSettings } from "@/components/NotificationSettings";

export default function SettingsPage(): JSX.Element {
  return (
    <main className="page">
      <h1>設定</h1>

      <section className="card">
        <h2>アプリのインストール</h2>
        <p className="muted">
          ホーム画面に追加すると、アプリのようにフルスクリーンで起動でき、Push通知も受け取れるようになります。
        </p>
        <InstallPrompt />
      </section>

      <section className="card">
        <h2>通知</h2>
        <NotificationSettings />
      </section>

      <Link className="btn" href="/">
        ホームに戻る
      </Link>
    </main>
  );
}
