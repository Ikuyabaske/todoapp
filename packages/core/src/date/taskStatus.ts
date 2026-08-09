import { parseDateOnly } from "./dateOnly";
import { toJstDateString } from "./timezone";

export type TaskStatusGroup = "TODAY" | "OVERDUE" | "UPCOMING";

export interface TaskStatus {
  group: TaskStatusGroup;
  /** 今日を0として、nextDueAtまでの日数（正: 未来, 0: 今日, 負: 超過） */
  diffDays: number;
}

/**
 * ホーム画面での分類（14章）: 今日 / 期限切れ / 今後。
 * 判定は常にnextDueAt基準で行い、snoozeUntil（通知タイミングのみ）は
 * 一切考慮しない — スヌーズしても「◯日超過」の表示は変わらない仕様(6章)。
 */
export function classifyTaskStatus(nextDueAt: string, today: string = toJstDateString(new Date())): TaskStatus {
  const diffDays = diffInDays(today, nextDueAt);

  if (diffDays === 0) {
    return { group: "TODAY", diffDays };
  }
  if (diffDays < 0) {
    return { group: "OVERDUE", diffDays };
  }
  return { group: "UPCOMING", diffDays };
}

/** to - from の日数差（"YYYY-MM-DD"同士）。 */
function diffInDays(from: string, to: string): number {
  const fromMs = parseDateOnly(from).getTime();
  const toMs = parseDateOnly(to).getTime();
  return Math.round((toMs - fromMs) / (24 * 60 * 60 * 1000));
}
