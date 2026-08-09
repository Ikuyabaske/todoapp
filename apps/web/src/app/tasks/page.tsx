import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth";
import { prisma } from "@upkeep/db";
import { TaskListItem } from "@/components/TaskListItem";

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
              <TaskListItem task={task} showStatus />
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
