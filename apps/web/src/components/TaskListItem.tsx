import Link from "next/link";
import { classifyTaskStatus, formatDateOnly } from "@upkeep/core";
import type { Priority, RepeatUnit } from "@upkeep/db";
import { priorityLabel, repeatLabel } from "@/lib/format";
import { TaskStatusBadge } from "./TaskStatusBadge";

export interface TaskListItemData {
  id: string;
  name: string;
  priority: Priority;
  repeatUnit: RepeatUnit;
  repeatInterval: number;
  nextDueAt: Date;
  category: { name: string } | null;
}

/** タスク一覧・ホーム画面で共通利用するタスクカード。 */
export function TaskListItem({
  task,
  showStatus = false,
}: {
  task: TaskListItemData;
  showStatus?: boolean;
}): JSX.Element {
  const dueAtStr = formatDateOnly(task.nextDueAt);

  return (
    <Link className="task-list-item" href={`/tasks/${task.id}`}>
      <p className="task-name">{task.name}</p>
      <div className="task-meta">
        <span className={`badge badge-priority-${task.priority}`}>優先度: {priorityLabel(task.priority)}</span>
        {task.category && <span className="badge">{task.category.name}</span>}
        <span className="badge">{repeatLabel(task.repeatUnit, task.repeatInterval)}</span>
        {showStatus ? (
          <TaskStatusBadge status={classifyTaskStatus(dueAtStr)} />
        ) : (
          <span className="badge">次回: {dueAtStr}</span>
        )}
      </div>
    </Link>
  );
}
