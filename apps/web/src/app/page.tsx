import Link from "next/link";
import { getServerSession } from "next-auth";
import { classifyTaskStatus, formatDateOnly } from "@upkeep/core";
import { authOptions } from "@/server/auth";
import { prisma } from "@upkeep/db";
import { TaskListItem, type TaskListItemData } from "@/components/TaskListItem";

export default async function HomePage(): Promise<JSX.Element> {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  const tasks = userId
    ? await prisma.task.findMany({
        where: { userId, isArchived: false },
        include: { category: true },
        orderBy: { nextDueAt: "asc" },
      })
    : [];

  // 判定は常にnextDueAt基準（スヌーズ中でも「◯日超過」の表示は変わらない、6章の仕様）。
  // 全タスクをあらかじめnextDueAt昇順で取得しているため、各グループ内の順序
  // (期限切れは古い順=超過日数が多い順、今後は近い順)もそのまま維持される。
  const today: TaskListItemData[] = [];
  const tomorrow: TaskListItemData[] = [];
  const overdue: TaskListItemData[] = [];
  const upcoming: TaskListItemData[] = [];

  for (const task of tasks) {
    const status = classifyTaskStatus(formatDateOnly(task.nextDueAt));
    if (status.group === "TODAY") today.push(task);
    else if (status.group === "OVERDUE") overdue.push(task);
    else if (status.diffDays === 1) tomorrow.push(task);
    else upcoming.push(task);
  }

  return (
    <main className="page">
      <h1>Upkeep</h1>
      <p className="lead">定期メンテナンス管理アプリ</p>

      <TaskGroup title="今日" tasks={today} emptyText="今日が期限のタスクはありません。" />
      <TaskGroup title="期限切れ" tasks={overdue} emptyText="期限切れのタスクはありません。" />
      <TaskGroup title="明日" tasks={tomorrow} emptyText="明日が期限のタスクはありません。" />
      <TaskGroup title="今後" tasks={upcoming} emptyText="明後日以降のタスクはありません。" limit={10} />

      <div className="actions">
        <Link className="btn" href="/tasks">
          タスク一覧
        </Link>
        <Link className="btn btn-primary" href="/tasks/new">
          タスクを登録
        </Link>
        <Link className="btn" href="/settings">
          設定
        </Link>
      </div>
    </main>
  );
}

function TaskGroup({
  title,
  tasks,
  emptyText,
  limit,
}: {
  title: string;
  tasks: TaskListItemData[];
  emptyText: string;
  limit?: number;
}): JSX.Element {
  const visible = limit ? tasks.slice(0, limit) : tasks;
  const remaining = tasks.length - visible.length;

  return (
    <section className="card">
      <h2>
        {title} <span className="muted">({tasks.length})</span>
      </h2>
      {visible.length === 0 ? (
        <p className="muted">{emptyText}</p>
      ) : (
        <ul className="task-list">
          {visible.map((task) => (
            <li key={task.id}>
              <TaskListItem task={task} showStatus />
            </li>
          ))}
        </ul>
      )}
      {remaining > 0 && (
        <p className="muted">
          他{remaining}件 — <Link href="/tasks">タスク一覧で見る</Link>
        </p>
      )}
    </section>
  );
}
