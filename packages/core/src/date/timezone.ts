// 日本での利用を前提とし、Asia/Tokyo(UTC+9, DSTなし)への変換を固定オフセットで
// 扱う。IANAタイムゾーンDBに依存せず、DBはUTC保存・表示/通知計算時にJST変換する
// という設計方針(17章)をここに集約する。
const JST_OFFSET_MINUTES = 9 * 60;

/** 指定UTC時刻を、Asia/Tokyoの暦日として "YYYY-MM-DD" に変換する。 */
export function toJstDateString(utcDate: Date): string {
  const jst = new Date(utcDate.getTime() + JST_OFFSET_MINUTES * 60_000);
  const y = jst.getUTCFullYear();
  const m = String(jst.getUTCMonth() + 1).padStart(2, "0");
  const d = String(jst.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Asia/Tokyoの壁時計 "YYYY-MM-DD" + "HH:mm" を、対応するUTC Dateに変換する。 */
export function jstWallClockToUtc(dateOnly: string, time: string): Date {
  const [y, m, d] = dateOnly.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  if (y === undefined || m === undefined || d === undefined || hh === undefined || mm === undefined) {
    throw new Error(`不正な日時形式です: ${dateOnly} ${time}`);
  }
  return new Date(Date.UTC(y, m - 1, d, hh, mm, 0, 0) - JST_OFFSET_MINUTES * 60_000);
}

/** UTC Dateを "YYYY-MM-DD HH:mm"（Asia/Tokyo）の表示用文字列に変換する。 */
export function formatJstDateTime(utcDate: Date): string {
  const jst = new Date(utcDate.getTime() + JST_OFFSET_MINUTES * 60_000);
  const y = jst.getUTCFullYear();
  const m = String(jst.getUTCMonth() + 1).padStart(2, "0");
  const d = String(jst.getUTCDate()).padStart(2, "0");
  const hh = String(jst.getUTCHours()).padStart(2, "0");
  const mm = String(jst.getUTCMinutes()).padStart(2, "0");
  return `${y}-${m}-${d} ${hh}:${mm}`;
}
