import Link from "next/link";

export default function TaskDetailPage({ params }: { params: { id: string } }): JSX.Element {
  return (
    <main className="page">
      <h1>タスク詳細</h1>
      <p className="muted">id: {params.id}</p>
      <p className="muted">Phase 2（タスクCRUD）で実装予定です。</p>
      <Link className="btn" href="/tasks">
        タスク一覧に戻る
      </Link>
    </main>
  );
}
