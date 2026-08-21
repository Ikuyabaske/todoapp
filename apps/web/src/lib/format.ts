import type { Priority, RepeatUnit } from "@upkeep/db";

const PRIORITY_LABELS: Record<Priority, string> = {
  HIGH: "高",
  MEDIUM: "中",
  LOW: "低",
};

export function priorityLabel(priority: Priority): string {
  return PRIORITY_LABELS[priority];
}

const REPEAT_UNIT_LABELS: Record<RepeatUnit, string> = {
  ONCE: "回",
  DAY: "日",
  WEEK: "週",
  MONTH: "か月",
  YEAR: "年",
};

/** 例: (MONTH, 1) -> "毎月", (MONTH, 3) -> "3か月ごと", (WEEK, 1) -> "毎週" */
export function repeatLabel(unit: RepeatUnit, interval: number): string {
  if (unit === "ONCE") {
    return "一回のみ";
  }
  if (interval === 1) {
    const everyLabel: Record<RepeatUnit, string> = {
      ONCE: "一回のみ",
      DAY: "毎日",
      WEEK: "毎週",
      MONTH: "毎月",
      YEAR: "毎年",
    };
    return everyLabel[unit];
  }
  return `${interval}${REPEAT_UNIT_LABELS[unit]}ごと`;
}
