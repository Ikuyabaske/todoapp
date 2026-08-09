import { shiftDateOnly } from "../date/dateOnly";
import { jstWallClockToUtc, toJstDateString } from "../date/timezone";

export const SNOOZE_PRESETS = [
  "ONE_HOUR",
  "TONIGHT",
  "TOMORROW",
  "THREE_DAYS",
  "ONE_WEEK",
  "CUSTOM",
] as const;
export type SnoozePreset = (typeof SNOOZE_PRESETS)[number];

export interface ResolveSnoozeInput {
  preset: SnoozePreset;
  now: Date;
  /** preset="CUSTOM" のときのみ使用。 */
  customUntil?: Date;
}

const ONE_HOUR_MS = 60 * 60 * 1000;

/**
 * スヌーズ選択肢から、通知を再送すべき実時刻(snoozeUntil)を計算する。
 *
 * 重要: これは「通知タイミング」だけを変更するものであり、タスク本来の
 * 期限(nextDueAt)には一切影響しない（6章の仕様どおり）。
 * 期限切れ日数の表示は常にnextDueAt基準で計算され続ける。
 */
export function resolveSnoozeUntil(input: ResolveSnoozeInput): Date {
  const { preset, now } = input;

  switch (preset) {
    case "ONE_HOUR":
      return new Date(now.getTime() + ONE_HOUR_MS);

    case "TONIGHT": {
      const todayJst = toJstDateString(now);
      const tonight = jstWallClockToUtc(todayJst, "20:00");
      // 既に20時を過ぎている場合は「今から3時間後」にフォールバックする
      // （過去の時刻をセットして即時通知になってしまうのを防ぐ）。
      return tonight.getTime() > now.getTime() ? tonight : new Date(now.getTime() + 3 * ONE_HOUR_MS);
    }

    case "TOMORROW": {
      const tomorrowJst = shiftDateOnly(toJstDateString(now), 1);
      return jstWallClockToUtc(tomorrowJst, "09:00");
    }

    case "THREE_DAYS": {
      const targetJst = shiftDateOnly(toJstDateString(now), 3);
      return jstWallClockToUtc(targetJst, "09:00");
    }

    case "ONE_WEEK": {
      const targetJst = shiftDateOnly(toJstDateString(now), 7);
      return jstWallClockToUtc(targetJst, "09:00");
    }

    case "CUSTOM": {
      if (!input.customUntil || Number.isNaN(input.customUntil.getTime())) {
        throw new Error("CUSTOMを指定する場合は有効なcustomUntilが必須です");
      }
      return input.customUntil;
    }

    default: {
      const exhaustiveCheck: never = preset;
      throw new Error(`未知のpresetです: ${String(exhaustiveCheck)}`);
    }
  }
}
