import Link from "next/link";

export default function TasksPage(): JSX.Element {
  return (
    <main className="page">
      <h1>タスク一覧</h1>
      <p className="muted">Phase 2（タスクCRUD）で実装予定です。</p>
      <Link className="btn" href="/">
        ホームに戻る
      </Link>
    </main>
  );
}
