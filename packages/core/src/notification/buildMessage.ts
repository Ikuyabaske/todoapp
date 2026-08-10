export type NotificationKind = "PRE" | "DUE" | "OVERDUE";

export interface BuildNotificationMessageInput {
  kind: NotificationKind;
  taskName: string;
  priority?: "HIGH" | "MEDIUM" | "LOW";
  /** PRE: 期限までの残り日数(正の値)。OVERDUE: 超過日数(正の値)。DUEでは未使用。 */
  days?: number;
}

export interface NotificationMessage {
  title: string;
  body: string;
}

/**
 * Push通知の表示文言を組み立てる（9章の仕様例に準拠）。
 * 例: 「今日はルンバのメンテナンスの日です」「ルンバのメンテナンスが3日過ぎています」
 */
export function buildNotificationMessage(input: BuildNotificationMessageInput): NotificationMessage {
  const { kind, taskName, days, priority } = input;

  switch (kind) {
    case "DUE":
      return { title: "Upkeep", body: `今日は${taskName}の日です` };
    case "OVERDUE":
      if (priority === "HIGH") {
        return {
          title: "🚨 Upkeep 緊急",
          body: `緊急：${taskName}が${days ?? 0}日過ぎています。早めに対応してください`,
        };
      }
      return { title: "Upkeep", body: `${taskName}が${days ?? 0}日過ぎています` };
    case "PRE":
      return { title: "Upkeep", body: `${taskName}まであと${days ?? 0}日です` };
    default: {
      const exhaustiveCheck: never = kind;
      throw new Error(`未知のkindです: ${String(exhaustiveCheck)}`);
    }
  }
}
