import { formatDateOnly, parseDateOnly } from "./dateOnly";

export type RepeatUnit = "ONCE" | "DAY" | "WEEK" | "MONTH" | "YEAR";

export interface RecurrenceInput {
  repeatUnit: RepeatUnit;
  repeatInterval: number;
  /** 実際に完了した日（"YYYY-MM-DD"）。次回予定日はこの日を基準に計算する。 */
  completedAt: string;
}

/**
 * 「実際に完了した日」を基準に次回予定日を計算する（本アプリの最重要仕様）。
 *
 * 例: ルンバのメンテナンス、1か月ごと、予定日2026/08/01、実際の完了日2026/08/10
 *     → 次回予定日は 2026/09/10（完了日から1か月後。予定日からの計算ではない）
 *
 * 月末日の扱い: 例えば1/31 + 1か月は、2月に31日が存在しないため2/28（or 閏年は2/29）に
 * まるめる。同様に3/31 + 1か月 → 4/30。JSの`Date`はこのケースで自動的に
 * 「繰り上がって次の月にずれる」(3/31+1か月=5/1相当)ため、それを避けるために
 * 「その月の最終日でクランプする」処理を明示的に行っている。
 */
export function calculateNextDueDate(input: RecurrenceInput): string {
  const { repeatUnit, repeatInterval, completedAt } = input;

  if (!Number.isInteger(repeatInterval) || repeatInterval < 1) {
    throw new Error(`repeatIntervalは1以上の整数である必要があります: ${repeatInterval}`);
  }

  const base = parseDateOnly(completedAt);

  switch (repeatUnit) {
    case "ONCE":
      throw new Error("一回のみタスクには次回予定日はありません");
    case "DAY":
      return formatDateOnly(addDays(base, repeatInterval));
    case "WEEK":
      return formatDateOnly(addDays(base, repeatInterval * 7));
    case "MONTH":
      return formatDateOnly(addMonthsClamped(base, repeatInterval));
    case "YEAR":
      return formatDateOnly(addMonthsClamped(base, repeatInterval * 12));
    default: {
      const exhaustiveCheck: never = repeatUnit;
      throw new Error(`未知のrepeatUnitです: ${String(exhaustiveCheck)}`);
    }
  }
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date.getTime());
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

/**
 * UTC基準で「dateからmonthsか月後」を計算する。
 * 目標月に「元の日」が存在しない場合（例: 1/31 + 1か月 → 2月に31日はない）は、
 * その月の最終日にクランプする（2/28、閏年なら2/29）。
 */
function addMonthsClamped(date: Date, months: number): Date {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const day = date.getUTCDate();

  const targetMonthIndex = month + months;
  const lastDayOfTargetMonth = getLastDayOfMonth(year, targetMonthIndex);
  const clampedDay = Math.min(day, lastDayOfTargetMonth);

  return new Date(Date.UTC(year, targetMonthIndex, clampedDay));
}

/** 指定した年・月（0始まり、範囲外可）の最終日（28〜31）を返す。 */
function getLastDayOfMonth(year: number, monthIndex: number): number {
  // 翌月の0日目 = 当月の最終日、という定石。monthIndexが範囲外でもDateが正規化してくれる。
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
}
