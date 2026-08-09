import type { TaskStatus } from "@upkeep/core";

/** 「3日超過」「あと10日」のような、期限までの日数バッジ。 */
export function TaskStatusBadge({ status }: { status: TaskStatus }): JSX.Element {
  if (status.group === "TODAY") {
    return <span className="badge status-today">今日</span>;
  }
  if (status.group === "OVERDUE") {
    return <span className="badge status-overdue">{Math.abs(status.diffDays)}日超過</span>;
  }
  return <span className="badge status-upcoming">あと{status.diffDays}日</span>;
}
