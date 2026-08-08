import { describe, expect, it } from "vitest";
import { calculateNextDueDate } from "../src/date/recurrence";

describe("calculateNextDueDate", () => {
  describe("完了日基準の計算（予定日ではない）", () => {
    it("仕様書の例: 月次タスクを予定日より遅れて完了した場合、次回は完了日基準になる", () => {
      // ルンバのメンテナンス。予定日2026/08/01、実際の完了日2026/08/10 → 次回は2026/09/10
      const next = calculateNextDueDate({
        repeatUnit: "MONTH",
        repeatInterval: 1,
        completedAt: "2026-08-10",
      });
      expect(next).toBe("2026-09-10");
    });

    it("予定日より早く完了した場合も、完了日基準で計算される", () => {
      const next = calculateNextDueDate({
        repeatUnit: "WEEK",
        repeatInterval: 1,
        completedAt: "2026-08-05",
      });
      expect(next).toBe("2026-08-12");
    });
  });

  describe("日ごと / 週ごと", () => {
    it("3日ごと", () => {
      expect(
        calculateNextDueDate({ repeatUnit: "DAY", repeatInterval: 3, completedAt: "2026-08-01" })
      ).toBe("2026-08-04");
    });

    it("毎週(1週間ごと)", () => {
      expect(
        calculateNextDueDate({ repeatUnit: "WEEK", repeatInterval: 1, completedAt: "2026-08-01" })
      ).toBe("2026-08-08");
    });

    it("2週間ごと", () => {
      expect(
        calculateNextDueDate({ repeatUnit: "WEEK", repeatInterval: 2, completedAt: "2026-08-01" })
      ).toBe("2026-08-15");
    });

    it("月をまたぐ日数計算", () => {
      expect(
        calculateNextDueDate({ repeatUnit: "DAY", repeatInterval: 5, completedAt: "2026-08-29" })
      ).toBe("2026-09-03");
    });

    it("年をまたぐ日数計算", () => {
      expect(
        calculateNextDueDate({ repeatUnit: "DAY", repeatInterval: 10, completedAt: "2026-12-28" })
      ).toBe("2027-01-07");
    });
  });

  describe("月ごと・月末の扱い", () => {
    it("1/31 + 1か月 → 2/28（平年、2月に31日が存在しないためクランプ）", () => {
      expect(
        calculateNextDueDate({ repeatUnit: "MONTH", repeatInterval: 1, completedAt: "2027-01-31" })
      ).toBe("2027-02-28");
    });

    it("1/31 + 1か月 → 2/29（2028年は閏年）", () => {
      expect(
        calculateNextDueDate({ repeatUnit: "MONTH", repeatInterval: 1, completedAt: "2028-01-31" })
      ).toBe("2028-02-29");
    });

    it("3/31 + 1か月 → 4/30（4月は30日までのためクランプ、5/1に繰り上がらない）", () => {
      expect(
        calculateNextDueDate({ repeatUnit: "MONTH", repeatInterval: 1, completedAt: "2026-03-31" })
      ).toBe("2026-04-30");
    });

    it("毎月(1か月ごと)・月末以外は日をそのまま維持する", () => {
      expect(
        calculateNextDueDate({ repeatUnit: "MONTH", repeatInterval: 1, completedAt: "2026-08-15" })
      ).toBe("2026-09-15");
    });

    it("3か月ごと・年をまたぐ場合", () => {
      expect(
        calculateNextDueDate({ repeatUnit: "MONTH", repeatInterval: 3, completedAt: "2026-11-20" })
      ).toBe("2027-02-20");
    });

    it("6か月ごと", () => {
      expect(
        calculateNextDueDate({ repeatUnit: "MONTH", repeatInterval: 6, completedAt: "2026-08-10" })
      ).toBe("2027-02-10");
    });
  });

  describe("年ごと・閏年の扱い", () => {
    it("毎年(1年ごと)", () => {
      expect(
        calculateNextDueDate({ repeatUnit: "YEAR", repeatInterval: 1, completedAt: "2026-08-08" })
      ).toBe("2027-08-08");
    });

    it("2年ごと", () => {
      expect(
        calculateNextDueDate({ repeatUnit: "YEAR", repeatInterval: 2, completedAt: "2026-08-08" })
      ).toBe("2028-08-08");
    });

    it("閏年の2/29 + 1年 → 翌年は平年のため2/28にクランプされる", () => {
      expect(
        calculateNextDueDate({ repeatUnit: "YEAR", repeatInterval: 1, completedAt: "2028-02-29" })
      ).toBe("2029-02-28");
    });

    it("閏年の2/29 + 4年 → 2032年も閏年のため2/29のまま", () => {
      expect(
        calculateNextDueDate({ repeatUnit: "YEAR", repeatInterval: 4, completedAt: "2028-02-29" })
      ).toBe("2032-02-29");
    });
  });

  describe("入力バリデーション", () => {
    it("repeatIntervalが0以下の場合はエラー", () => {
      expect(() =>
        calculateNextDueDate({ repeatUnit: "DAY", repeatInterval: 0, completedAt: "2026-08-08" })
      ).toThrow();
    });

    it("repeatIntervalが整数でない場合はエラー", () => {
      expect(() =>
        calculateNextDueDate({ repeatUnit: "DAY", repeatInterval: 1.5, completedAt: "2026-08-08" })
      ).toThrow();
    });
  });
});
