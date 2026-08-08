import Link from "next/link";

export default function NewTaskPage(): JSX.Element {
  return (
    <main className="page">
      <h1>タスク登録</h1>
      <p className="muted">Phase 2（タスクCRUD）で実装予定です。</p>
      <Link className="btn" href="/">
        ホームに戻る
      </Link>
    </main>
  );
}
