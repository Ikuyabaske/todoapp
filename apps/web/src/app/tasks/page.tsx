import Link from "next/link";
import { getServerSession } from "next-auth";
import { formatDateOnly } from "@upkeep/core";
import { authOptions } from "@/server/auth";
import { prisma } from "@upkeep/db";
import { priorityLabel, repeatLabel } from "@/lib/format";

export default async function TasksPage(): Promise<JSX.Element> {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  const tasks = userId
    ? await prisma.task.findMany({
        where: { userId, isArchived: false },
        include: { category: true },
        orderBy: { nextDueAt: "asc" },
      })
    : [];

  return (
    <main className="page">
      <h1>タスク一覧</h1>
      <div className="actions">
        <Link className="btn btn-primary" href="/tasks/new">
          + タスクを登録
        </Link>
      </div>

      {tasks.length === 0 ? (
        <p className="muted">登録されているタスクはまだありません。</p>
      ) : (
        <ul className="task-list">
          {tasks.map((task) => (
            <li key={task.id}>
              <Link className="task-list-item" href={`/tasks/${task.id}`}>
                <p className="task-name">{task.name}</p>
                <div className="task-meta">
                  <span className={`badge badge-priority-${task.priority}`}>
                    優先度: {priorityLabel(task.priority)}
                  </span>
                  {task.category && <span className="badge">{task.category.name}</span>}
                  <span className="badge">{repeatLabel(task.repeatUnit, task.repeatInterval)}</span>
                  <span className="badge">次回: {formatDateOnly(task.nextDueAt)}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Link className="btn" href="/">
        ホームに戻る
      </Link>
    </main>
  );
}
