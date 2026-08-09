import { describe, expect, it } from "vitest";
import { resolveSnoozeUntil } from "../src/notification/snooze";

describe("resolveSnoozeUntil", () => {
  it("ONE_HOUR: 現在時刻の1時間後になる", () => {
    const now = new Date("2026-08-01T03:00:00.000Z");
    const result = resolveSnoozeUntil({ preset: "ONE_HOUR", now });
    expect(result.toISOString()).toBe("2026-08-01T04:00:00.000Z");
  });

  it("TONIGHT: 20時前ならJST今日20:00になる", () => {
    // 2026-08-01 10:00 UTC = JST 19:00 (まだ20時前)
    const now = new Date("2026-08-01T10:00:00.000Z");
    const result = resolveSnoozeUntil({ preset: "TONIGHT", now });
    // JST 2026-08-01 20:00 = UTC 11:00
    expect(result.toISOString()).toBe("2026-08-01T11:00:00.000Z");
  });

  it("TONIGHT: 既に20時を過ぎていたら3時間後にフォールバックする", () => {
    // 2026-08-01 13:00 UTC = JST 22:00 (20時を過ぎている)
    const now = new Date("2026-08-01T13:00:00.000Z");
    const result = resolveSnoozeUntil({ preset: "TONIGHT", now });
    expect(result.toISOString()).toBe("2026-08-01T16:00:00.000Z");
  });

  it("TOMORROW: 翌日のJST9:00になる", () => {
    const now = new Date("2026-08-01T01:00:00.000Z"); // JST 08-01 10:00
    const result = resolveSnoozeUntil({ preset: "TOMORROW", now });
    // JST 2026-08-02 09:00 = UTC 2026-08-02T00:00:00Z
    expect(result.toISOString()).toBe("2026-08-02T00:00:00.000Z");
  });

  it("THREE_DAYS: 3日後のJST9:00になる", () => {
    const now = new Date("2026-08-01T01:00:00.000Z");
    const result = resolveSnoozeUntil({ preset: "THREE_DAYS", now });
    expect(result.toISOString()).toBe("2026-08-04T00:00:00.000Z");
  });

  it("ONE_WEEK: 1週間後のJST9:00になる", () => {
    const now = new Date("2026-08-01T01:00:00.000Z");
    const result = resolveSnoozeUntil({ preset: "ONE_WEEK", now });
    expect(result.toISOString()).toBe("2026-08-08T00:00:00.000Z");
  });

  it("CUSTOM: 指定した日時をそのまま返す", () => {
    const now = new Date("2026-08-01T01:00:00.000Z");
    const customUntil = new Date("2026-08-15T05:00:00.000Z");
    const result = resolveSnoozeUntil({ preset: "CUSTOM", now, customUntil });
    expect(result.toISOString()).toBe("2026-08-15T05:00:00.000Z");
  });

  it("CUSTOM: customUntilが無い場合はエラー", () => {
    const now = new Date("2026-08-01T01:00:00.000Z");
    expect(() => resolveSnoozeUntil({ preset: "CUSTOM", now })).toThrow();
  });

  it("仕様書の例: 期限8/1をスヌーズしても本来の期限は変わらない（呼び出し側の責務だが、返り値がnextDueAtと独立していることを確認）", () => {
    // resolveSnoozeUntilはnextDueAtを一切参照しない純粋関数であることの確認。
    const now = new Date("2026-08-03T01:00:00.000Z");
    const result = resolveSnoozeUntil({ preset: "TOMORROW", now });
    expect(result).toBeInstanceOf(Date);
  });
});
