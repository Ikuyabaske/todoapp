import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { formatDateOnly, formatJstDateTime } from "@upkeep/core";
import { authOptions } from "@/server/auth";
import { prisma } from "@upkeep/db";
import { priorityLabel, repeatLabel } from "@/lib/format";
import { DeleteTaskButton } from "@/components/DeleteTaskButton";
import { CompleteTaskForm } from "@/components/CompleteTaskForm";
import { SnoozeButton } from "@/components/SnoozeButton";

export default async function TaskDetailPage({
  params,
}: {
  params: { id: string };
}): Promise<JSX.Element> {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) {
    notFound();
  }

  const task = await prisma.task.findFirst({
    where: { id: params.id, userId },
    include: {
      category: true,
      histories: { orderBy: { completedAt: "desc" } },
    },
  });

  if (!task) {
    notFound();
  }

  return (
    <main className="page">
      <h1>{task.name}</h1>

      <dl className="detail-grid">
        <div className="detail-row">
          <dt>カテゴリ</dt>
          <dd>{task.category?.name ?? "未分類"}</dd>
        </div>
        <div className="detail-row">
          <dt>次回予定日</dt>
          <dd>{formatDateOnly(task.nextDueAt)}</dd>
        </div>
        <div className="detail-row">
          <dt>最終実施日</dt>
          <dd>{task.lastCompletedAt ? formatDateOnly(task.lastCompletedAt) : "未実施"}</dd>
        </div>
        <div className="detail-row">
          <dt>繰り返し頻度</dt>
          <dd>{repeatLabel(task.repeatUnit, task.repeatInterval)}</dd>
        </div>
        <div className="detail-row">
          <dt>通知設定</dt>
          <dd>
            {task.notificationEnabled
              ? `ON（${task.notificationTime} / ${task.preNotificationDays}日前から）`
              : "OFF"}
          </dd>
        </div>
        <div className="detail-row">
          <dt>優先度</dt>
          <dd>{priorityLabel(task.priority)}</dd>
        </div>
        <div className="detail-row">
          <dt>メモ</dt>
          <dd>{task.memo || "—"}</dd>
        </div>
      </dl>

      {task.snoozeUntil && task.snoozeUntil.getTime() > Date.now() && (
        <p className="muted snooze-note">
          🔔 次回の通知は {formatJstDateTime(task.snoozeUntil)}（JST）に延期されています（期限日自体は変更されません）
        </p>
      )}

      <div className="actions">
        <CompleteTaskForm taskId={task.id} />
        <SnoozeButton taskId={task.id} />
        <Link className="btn" href={`/tasks/${task.id}/edit`}>
          編集
        </Link>
        <DeleteTaskButton taskId={task.id} taskName={task.name} />
      </div>

      <section className="card">
        <h2>完了履歴</h2>
        {task.histories.length === 0 ? (
          <p className="muted">まだ完了履歴はありません。</p>
        ) : (
          <ul className="history-list">
            {task.histories.map((h) => (
              <li key={h.id}>{formatDateOnly(h.completedAt)}</li>
            ))}
          </ul>
        )}
      </section>

      <Link className="btn" href="/tasks">
        タスク一覧に戻る
      </Link>
    </main>
  );
}
