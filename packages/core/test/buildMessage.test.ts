import { describe, expect, it } from "vitest";
import { buildNotificationMessage } from "../src/notification/buildMessage";

describe("buildNotificationMessage", () => {
  it("DUE: 仕様書の例文と一致する", () => {
    const msg = buildNotificationMessage({ kind: "DUE", taskName: "ルンバのメンテナンス" });
    expect(msg.body).toBe("今日はルンバのメンテナンスの日です");
  });

  it("OVERDUE: 仕様書の例文と一致する", () => {
    const msg = buildNotificationMessage({ kind: "OVERDUE", taskName: "ルンバのメンテナンス", days: 3 });
    expect(msg.body).toBe("ルンバのメンテナンスが3日過ぎています");
  });

  it("OVERDUEかつ優先度・高: 緊急文面にする", () => {
    const msg = buildNotificationMessage({
      kind: "OVERDUE",
      taskName: "防災用品点検",
      days: 3,
      priority: "HIGH",
    });
    expect(msg.title).toBe("🚨 Upkeep 緊急");
    expect(msg.body).toBe("緊急：防災用品点検が3日過ぎています。早めに対応してください");
  });

  it("PRE: 事前通知の文言", () => {
    const msg = buildNotificationMessage({ kind: "PRE", taskName: "車検", days: 2 });
    expect(msg.body).toBe("車検まであと2日です");
  });
});
