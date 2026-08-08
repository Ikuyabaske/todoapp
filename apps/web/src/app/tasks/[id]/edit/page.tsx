import Link from "next/link";

export default function EditTaskPage({ params }: { params: { id: string } }): JSX.Element {
  return (
    <main className="page">
      <h1>タスク編集</h1>
      <p className="muted">id: {params.id}</p>
      <p className="muted">Phase 2（タスクCRUD）で実装予定です。</p>
      <Link className="btn" href={`/tasks/${params.id}`}>
        タスク詳細に戻る
      </Link>
    </main>
  );
}
