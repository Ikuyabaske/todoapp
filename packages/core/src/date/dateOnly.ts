const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * "YYYY-MM-DD" 形式の日付文字列を、DBの `@db.Date` カラムに保存するための
 * Dateオブジェクト（UTC midnight起点）に変換する。
 *
 * `@db.Date` はタイムゾーン情報を持たないカレンダー日付として扱われるため、
 * 常にUTC基準で組み立てることで「保存した日付とアプリ上で扱う日付が
 * ズレない」ことを保証する（表示・通知計算時のJST変換は別レイヤーで行う）。
 */
export function parseDateOnly(value: string): Date {
  if (!DATE_ONLY_PATTERN.test(value)) {
    throw new Error(`日付はYYYY-MM-DD形式で指定してください: ${value}`);
  }
  return new Date(`${value}T00:00:00.000Z`);
}

/** @db.Date から取得したDateを "YYYY-MM-DD" 文字列に変換する。 */
export function formatDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}
