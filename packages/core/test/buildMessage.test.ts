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

  it("PRE: 事前通知の文言", () => {
    const msg = buildNotificationMessage({ kind: "PRE", taskName: "車検", days: 2 });
    expect(msg.body).toBe("車検まであと2日です");
  });
});
