import Link from "next/link";
import { getServerSession } from "next-auth";
import { formatDateOnly } from "@upkeep/core";
import { authOptions } from "@/server/auth";
import { prisma } from "@upkeep/db";
import { repeatLabel } from "@/lib/format";

export default async function TaskHistoryPage(): Promise<JSX.Element> {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  const histories = userId
    ? await prisma.taskHistory.findMany({
        where: { task: { userId } },
        include: { task: { include: { category: true } } },
        orderBy: [{ completedAt: "desc" }, { createdAt: "desc" }],
        take: 200,
      })
    : [];

  return (
    <main className="page">
      <div className="list-header">
        <h1>完了履歴</h1>
        <Link className="btn btn-sm" href="/tasks">
          タスク一覧
        </Link>
      </div>

      {histories.length === 0 ? (
        <p className="muted">完了履歴はまだありません。</p>
      ) : (
        <ul className="completion-list">
          {histories.map((history) => (
            <li key={history.id} className="completion-item">
              <div className="completion-main">
                <Link className="completion-title" href={`/tasks/${history.task.id}`}>
                  {history.task.name}
                </Link>
                <span className="badge">{repeatLabel(history.task.repeatUnit, history.task.repeatInterval)}</span>
                {history.task.isArchived && <span className="badge">完了済み</span>}
              </div>
              <dl className="completion-meta">
                <div>
                  <dt>完了日</dt>
                  <dd>{formatDateOnly(history.completedAt)}</dd>
                </div>
                <div>
                  <dt>予定日</dt>
                  <dd>{formatDateOnly(history.dueAtAtCompletion)}</dd>
                </div>
                <div>
                  <dt>カテゴリ</dt>
                  <dd>{history.task.category?.name ?? "未分類"}</dd>
                </div>
              </dl>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
