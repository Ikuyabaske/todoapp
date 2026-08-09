import { describe, expect, it } from "vitest";
import { classifyTaskStatus } from "../src/date/taskStatus";

describe("classifyTaskStatus", () => {
  it("今日が期限日ならTODAY, diffDays=0", () => {
    const status = classifyTaskStatus("2026-08-08", "2026-08-08");
    expect(status).toEqual({ group: "TODAY", diffDays: 0 });
  });

  it("期限日が過去ならOVERDUE, diffDaysは負", () => {
    // 仕様例: エアコン掃除、3日超過
    const status = classifyTaskStatus("2026-08-05", "2026-08-08");
    expect(status).toEqual({ group: "OVERDUE", diffDays: -3 });
  });

  it("期限日が未来ならUPCOMING, diffDaysは正", () => {
    // 仕様例: 車内清掃、あと10日
    const status = classifyTaskStatus("2026-08-18", "2026-08-08");
    expect(status).toEqual({ group: "UPCOMING", diffDays: 10 });
  });

  it("todayを省略した場合は現在時刻(JST)基準で判定される", () => {
    const status = classifyTaskStatus("2999-01-01");
    expect(status.group).toBe("UPCOMING");
  });
});
