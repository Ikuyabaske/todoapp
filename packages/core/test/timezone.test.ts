import { describe, expect, it } from "vitest";
import { formatJstDateTime, jstWallClockToUtc, toJstDateString } from "../src/date/timezone";

describe("toJstDateString", () => {
  it("UTC 15:00 は JST(翌日0:00)なので日付が繰り上がる", () => {
    // 2026-08-08T15:00:00Z → JST 2026-08-09 00:00
    expect(toJstDateString(new Date("2026-08-08T15:00:00.000Z"))).toBe("2026-08-09");
  });

  it("UTC 14:59 はまだJSTで同日23:59", () => {
    expect(toJstDateString(new Date("2026-08-08T14:59:00.000Z"))).toBe("2026-08-08");
  });
});

describe("jstWallClockToUtc / formatJstDateTime", () => {
  it("JST 09:00 は UTC 00:00 になる", () => {
    const utc = jstWallClockToUtc("2026-08-08", "09:00");
    expect(utc.toISOString()).toBe("2026-08-08T00:00:00.000Z");
  });

  it("往復変換で同じJST表示に戻る", () => {
    const utc = jstWallClockToUtc("2026-08-08", "20:30");
    expect(formatJstDateTime(utc)).toBe("2026-08-08 20:30");
  });
});
