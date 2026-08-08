import { describe, expect, it } from "vitest";
import { formatDateOnly, parseDateOnly } from "../src/date/dateOnly";

describe("parseDateOnly / formatDateOnly", () => {
  it("往復変換で同じ日付文字列に戻る", () => {
    expect(formatDateOnly(parseDateOnly("2026-08-08"))).toBe("2026-08-08");
  });

  it("不正な形式はエラーになる", () => {
    expect(() => parseDateOnly("2026/08/08")).toThrow();
    expect(() => parseDateOnly("2026-8-8")).toThrow();
    expect(() => parseDateOnly("not-a-date")).toThrow();
  });
});
