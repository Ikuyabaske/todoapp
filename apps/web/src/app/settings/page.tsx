import Link from "next/link";

export default function SettingsPage(): JSX.Element {
  return (
    <main className="page">
      <h1>設定</h1>
      <p className="muted">通知設定（Push購読）はPhase 7で実装予定です。</p>
      <Link className="btn" href="/">
        ホームに戻る
      </Link>
    </main>
  );
}
