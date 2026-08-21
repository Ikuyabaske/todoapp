import Link from "next/link";
import { classifyTaskStatus, formatDateOnly } from "@upkeep/core";
import type { Priority, RepeatUnit } from "@upkeep/db";
import { TaskStatusBadge } from "./TaskStatusBadge";

export interface TaskListItemData {
  id: string;
  name: string;
  priority: Priority;
  repeatUnit: RepeatUnit;
  repeatInterval: number;
  nextDueAt: Date;
  category: { id: string; name: string } | null;
}

/**
 * タスク一覧・ホーム画面で共通利用するタスク行。
 * できるだけ1行に収まるよう、タスク名とステータスのみを表示する
 * （カテゴリ・繰り返し・優先度などの詳細はタスク詳細画面で確認する）。
 */
export function TaskListItem({
  task,
  showStatus = false,
}: {
  task: TaskListItemData;
  showStatus?: boolean;
}): JSX.Element {
  const dueAtStr = formatDateOnly(task.nextDueAt);

  return (
    <Link className={`task-list-item task-row-priority-${task.priority}`} href={`/tasks/${task.id}`}>
      <span className="task-name">{task.name}</span>
      {showStatus ? (
        <TaskStatusBadge status={classifyTaskStatus(dueAtStr)} />
      ) : (
        <span className="badge">次回: {dueAtStr}</span>
      )}
    </Link>
  );
}
