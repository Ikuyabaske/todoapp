import { formatDateOnly } from "@upkeep/core";
import type { Priority, RepeatUnit } from "@upkeep/db";

/** タスクのCSV入出力で使う列。タスクの属性値のみをそのまま並べる。 */
export const TASK_CSV_COLUMNS = [
  "name",
  "category",
  "repeatUnit",
  "repeatInterval",
  "firstDueAt",
  "nextDueAt",
  "lastCompletedAt",
  "notificationEnabled",
  "notificationTime",
  "preNotificationDays",
  "priority",
  "memo",
] as const;

export type TaskCsvColumn = (typeof TASK_CSV_COLUMNS)[number];

export interface TaskCsvRow {
  name: string;
  category: string;
  repeatUnit: string;
  repeatInterval: string;
  firstDueAt: string;
  nextDueAt: string;
  lastCompletedAt: string;
  notificationEnabled: string;
  notificationTime: string;
  preNotificationDays: string;
  priority: string;
  memo: string;
}

function escapeCsvField(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export interface TaskCsvSource {
  name: string;
  category: { name: string } | null;
  repeatUnit: RepeatUnit;
  repeatInterval: number;
  firstDueAt: Date;
  nextDueAt: Date;
  lastCompletedAt: Date | null;
  notificationEnabled: boolean;
  notificationTime: string;
  preNotificationDays: number;
  priority: Priority;
  memo: string | null;
}

/** タスク一覧をCSV文字列に変換する（Excel等での文字化け対策としてBOM付き）。 */
export function tasksToCsv(tasks: TaskCsvSource[]): string {
  const rows = [TASK_CSV_COLUMNS.join(",")];

  for (const task of tasks) {
    const row: TaskCsvRow = {
      name: task.name,
      category: task.category?.name ?? "",
      repeatUnit: task.repeatUnit,
      repeatInterval: String(task.repeatInterval),
      firstDueAt: formatDateOnly(task.firstDueAt),
      nextDueAt: formatDateOnly(task.nextDueAt),
      lastCompletedAt: task.lastCompletedAt ? formatDateOnly(task.lastCompletedAt) : "",
      notificationEnabled: String(task.notificationEnabled),
      notificationTime: task.notificationTime,
      preNotificationDays: String(task.preNotificationDays),
      priority: task.priority,
      memo: task.memo ?? "",
    };
    rows.push(TASK_CSV_COLUMNS.map((col) => escapeCsvField(row[col])).join(","));
  }

  return `﻿${rows.join("\r\n")}\r\n`;
}

/** RFC4180に近い形でCSVテキストを行(フィールド配列)の配列にパースする。 */
export function parseCsvText(text: string): string[][] {
  const normalized = text.replace(/^﻿/, "");
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let i = 0;

  while (i < normalized.length) {
    const char = normalized[i];

    if (inQuotes) {
      if (char === '"') {
        if (normalized[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i += 1;
        continue;
      }
      field += char;
      i += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      i += 1;
      continue;
    }
    if (char === ",") {
      row.push(field);
      field = "";
      i += 1;
      continue;
    }
    if (char === "\r") {
      i += 1;
      continue;
    }
    if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      i += 1;
      continue;
    }
    field += char;
    i += 1;
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((r) => !(r.length === 1 && r[0] === ""));
}

/** CSVテキストをヘッダー行のカラム名をキーとしたオブジェクトの配列に変換する。 */
export function parseTaskCsvRows(text: string): Record<string, string>[] {
  const [headerRow, ...dataRows] = parseCsvText(text);
  if (!headerRow) {
    return [];
  }
  const header = headerRow.map((h) => h.trim());
  return dataRows.map((row) => {
    const record: Record<string, string> = {};
    header.forEach((col, idx) => {
      record[col] = (row[idx] ?? "").trim();
    });
    return record;
  });
}
