import { classifyTaskStatus } from "../date/taskStatus";
import { jstWallClockToUtc, toJstDateString } from "../date/timezone";
import type { NotificationKind } from "./buildMessage";

export interface DecideNotificationTaskInput {
  /** "YYYY-MM-DD" */
  nextDueAt: string;
  repeatUnit: "ONCE" | "DAY" | "WEEK" | "MONTH" | "YEAR";
  repeatInterval: number;
  notificationEnabled: boolean;
  /** "HH:mm" (JST壁時計) */
  notificationTime: string;
  preNotificationDays: number;
  snoozeUntil: Date | null;
}

export interface NotificationDecision {
  shouldNotify: boolean;
  kind: NotificationKind;
  /** 通知対象日。NotificationHistoryの重複防止キー(taskId, type, scheduledFor, reminderSlot)に使う。 */
  scheduledFor: string;
  /** PRE: 残り日数 / OVERDUE: 超過日数（いずれも正の値）。DUEでは0。 */
  days: number;
  /** 今回の判定にsnoozeUntilが使われたか。trueの場合、呼び出し側で消費後にクリアすべき。 */
  consumedSnooze: boolean;
  /**
   * NotificationHistoryの重複防止キーに使う通知スロット。
   * 通常はonce、毎日タスクの当日/超過通知だけhourly-Nで1時間ごとに分ける。
   */
  reminderSlot: string;
}

/**
 * scheduler(Phase8)が5分毎に呼び出す、通知要否の中心判定ロジック。
 * DB非依存の純粋関数として実装し、あらゆる境界条件をユニットテストで保証する。
 *
 * 判定の流れ:
 *   1. 通知OFFなら即false
 *   2. 事前通知期間より前ならfalse (今日 < 期限 - preNotificationDays)
 *   3. 種別を決定: 残り日数>0=PRE, =0=DUE, <0=OVERDUE
 *   4. 実効通知時刻を決定: snoozeUntilがあればそれを優先、無ければ通常のnotificationTime
 *   5. 現在時刻が実効通知時刻を過ぎていなければfalse
 *   6. 毎日タスクの当日/超過通知は、実効通知時刻から1時間ごとのスロットを返す
 *
 * 実際の重複送信防止は呼び出し側がNotificationHistoryのユニーク制約
 * (taskId, type, scheduledFor, reminderSlot) で行う。この関数はあくまで
 * 「今送るべきか」と「どの通知スロットか」を判定するだけ。
 */
export function decideNotification(task: DecideNotificationTaskInput, now: Date): NotificationDecision {
  const todayStr = toJstDateString(now);
  const notNotify = (kind: NotificationKind, days = 0): NotificationDecision => ({
    shouldNotify: false,
    kind,
    scheduledFor: todayStr,
    days,
    consumedSnooze: false,
    reminderSlot: "once",
  });

  if (!task.notificationEnabled) {
    return notNotify("DUE");
  }

  const { diffDays } = classifyTaskStatus(task.nextDueAt, todayStr);

  if (diffDays > task.preNotificationDays) {
    return notNotify("PRE", diffDays);
  }

  const kind: NotificationKind = diffDays > 0 ? "PRE" : diffDays === 0 ? "DUE" : "OVERDUE";
  const days = kind === "OVERDUE" ? Math.abs(diffDays) : diffDays;

  const baseTime = jstWallClockToUtc(todayStr, task.notificationTime);
  const useSnooze = task.snoozeUntil !== null;
  const effectiveTime = useSnooze ? (task.snoozeUntil as Date) : baseTime;

  if (now.getTime() < effectiveTime.getTime()) {
    return { shouldNotify: false, kind, scheduledFor: todayStr, days, consumedSnooze: false, reminderSlot: "once" };
  }

  const reminderSlot = getReminderSlot(task, kind, now, effectiveTime);

  return { shouldNotify: true, kind, scheduledFor: todayStr, days, consumedSnooze: useSnooze, reminderSlot };
}

function getReminderSlot(
  task: DecideNotificationTaskInput,
  kind: NotificationKind,
  now: Date,
  effectiveTime: Date
): string {
  const isDailyTask = task.repeatUnit === "DAY" && task.repeatInterval === 1;
  if (!isDailyTask || kind === "PRE") {
    return "once";
  }

  const elapsedMs = now.getTime() - effectiveTime.getTime();
  const slot = Math.floor(elapsedMs / (60 * 60_000));
  return `hourly-${slot}`;
}
