import { describe, expect, it } from "vitest";
import { decideNotification } from "../src/notification/decide";

const baseTask = {
  nextDueAt: "2026-08-10",
  repeatUnit: "MONTH" as const,
  repeatInterval: 1,
  notificationEnabled: true,
  notificationTime: "09:00",
  preNotificationDays: 1,
  snoozeUntil: null,
};

describe("decideNotification", () => {
  it("通知が無効なら常にfalse", () => {
    const now = new Date("2026-08-10T00:30:00.000Z"); // JST 09:30
    const decision = decideNotification({ ...baseTask, notificationEnabled: false }, now);
    expect(decision.shouldNotify).toBe(false);
  });

  it("当日・通知時刻を過ぎていればDUEでtrue", () => {
    // JST 2026-08-10 09:30 (通知時刻09:00を過ぎている)
    const now = new Date("2026-08-10T00:30:00.000Z");
    const decision = decideNotification(baseTask, now);
    expect(decision).toMatchObject({ shouldNotify: true, kind: "DUE", days: 0, reminderSlot: "once" });
  });

  it("当日でも通知時刻より前ならfalse", () => {
    // JST 2026-08-10 08:00 (通知時刻09:00より前)
    const now = new Date("2026-08-09T23:00:00.000Z");
    const decision = decideNotification(baseTask, now);
    expect(decision.shouldNotify).toBe(false);
  });

  it("事前通知期間内(preNotificationDays)ならPREでtrue", () => {
    // 期限8/10、preNotificationDays=1 → 8/9からPRE通知対象
    const now = new Date("2026-08-09T00:30:00.000Z"); // JST 8/9 09:30
    const decision = decideNotification(baseTask, now);
    expect(decision).toMatchObject({ shouldNotify: true, kind: "PRE", days: 1 });
  });

  it("事前通知期間より前はfalse", () => {
    // 期限8/10、preNotificationDays=1 → 8/8はまだ対象外
    const now = new Date("2026-08-08T00:30:00.000Z");
    const decision = decideNotification(baseTask, now);
    expect(decision.shouldNotify).toBe(false);
  });

  it("期限超過ならOVERDUEでtrue、daysは超過日数", () => {
    // 期限8/10、現在8/13 09:30 JST → 3日超過
    const now = new Date("2026-08-13T00:30:00.000Z");
    const decision = decideNotification(baseTask, now);
    expect(decision).toMatchObject({ shouldNotify: true, kind: "OVERDUE", days: 3 });
  });

  describe("毎日タスクのリマインド", () => {
    const dailyTask = {
      ...baseTask,
      repeatUnit: "DAY" as const,
      repeatInterval: 1,
      preNotificationDays: 0,
    };

    it("毎日タスクの当日通知は通知時刻から1時間ごとのスロットになる", () => {
      const first = decideNotification(dailyTask, new Date("2026-08-10T00:30:00.000Z")); // JST 09:30
      const second = decideNotification(dailyTask, new Date("2026-08-10T01:30:00.000Z")); // JST 10:30
      const third = decideNotification(dailyTask, new Date("2026-08-10T02:29:00.000Z")); // JST 11:29

      expect(first).toMatchObject({ shouldNotify: true, kind: "DUE", reminderSlot: "hourly-0" });
      expect(second).toMatchObject({ shouldNotify: true, kind: "DUE", reminderSlot: "hourly-1" });
      expect(third).toMatchObject({ shouldNotify: true, kind: "DUE", reminderSlot: "hourly-2" });
    });

    it("毎日タスクでも1時間が経過するまでは同じスロットになる", () => {
      const first = decideNotification(dailyTask, new Date("2026-08-10T00:05:00.000Z")); // JST 09:05
      const sameHour = decideNotification(dailyTask, new Date("2026-08-10T00:59:00.000Z")); // JST 09:59

      expect(first.reminderSlot).toBe("hourly-0");
      expect(sameHour.reminderSlot).toBe("hourly-0");
    });

    it("毎日タスクの期限超過通知も1時間ごとのスロットになる", () => {
      const decision = decideNotification(dailyTask, new Date("2026-08-11T01:30:00.000Z")); // JST 10:30

      expect(decision).toMatchObject({
        shouldNotify: true,
        kind: "OVERDUE",
        days: 1,
        reminderSlot: "hourly-1",
      });
    });

    it("毎日タスクでも事前通知は従来通り1日1回にする", () => {
      const decision = decideNotification(
        { ...dailyTask, nextDueAt: "2026-08-11", preNotificationDays: 1 },
        new Date("2026-08-10T00:30:00.000Z")
      );

      expect(decision).toMatchObject({ shouldNotify: true, kind: "PRE", reminderSlot: "once" });
    });
  });

  it("scheduledForは常にJSTの今日の日付になる(重複防止キー)", () => {
    const now = new Date("2026-08-13T00:30:00.000Z"); // JST 8/13
    const decision = decideNotification(baseTask, now);
    expect(decision.scheduledFor).toBe("2026-08-13");
  });

  describe("スヌーズとの相互作用", () => {
    it("snoozeUntilが未来なら、通常の通知時刻を過ぎていてもfalse", () => {
      // 通常なら09:00に通知だが、12:00までスヌーズされている
      const now = new Date("2026-08-10T02:00:00.000Z"); // JST 11:00 (09:00は過ぎたが12:00前)
      const snoozeUntil = new Date("2026-08-10T03:00:00.000Z"); // JST 12:00
      const decision = decideNotification({ ...baseTask, snoozeUntil }, now);
      expect(decision.shouldNotify).toBe(false);
    });

    it("snoozeUntilに到達したらtrueになり、consumedSnooze=trueを返す", () => {
      const now = new Date("2026-08-10T03:00:00.000Z"); // JST 12:00 ちょうど
      const snoozeUntil = new Date("2026-08-10T03:00:00.000Z");
      const decision = decideNotification({ ...baseTask, snoozeUntil }, now);
      expect(decision).toMatchObject({ shouldNotify: true, consumedSnooze: true });
    });

    it("スヌーズしても期限(nextDueAt)自体には影響しないため、期限超過日数の計算は変わらない", () => {
      // 期限は8/10のまま。8/13にスヌーズが解けても「3日超過」の判定は変わらない。
      const now = new Date("2026-08-13T01:00:00.000Z");
      const snoozeUntil = new Date("2026-08-13T00:30:00.000Z");
      const decision = decideNotification({ ...baseTask, snoozeUntil }, now);
      expect(decision).toMatchObject({ kind: "OVERDUE", days: 3 });
    });
  });
});
