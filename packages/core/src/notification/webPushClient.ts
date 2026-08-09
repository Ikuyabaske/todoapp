// 注記: packages/coreは基本的にDB非依存の「純粋ロジック」を置く場所だが、
// web-push送信処理はapps/web(テスト送信)とapps/scheduler(Phase8の本番送信)の
// 両方で全く同じVAPID設定・送信処理・エラー判定を必要とするため、
// 重複実装を避ける目的でここに薄いラッパーとして置いている。
import webpush from "web-push";

export interface VapidConfig {
  publicKey: string;
  privateKey: string;
  subject: string;
}

export interface PushSubscriptionKeys {
  endpoint: string;
  p256dh: string;
  auth: string;
}

export interface PushPayload {
  title: string;
  body: string;
  url: string;
}

let configured = false;

export function configureWebPush(config: VapidConfig): void {
  webpush.setVapidDetails(config.subject, config.publicKey, config.privateKey);
  configured = true;
}

export class PushSendError extends Error {
  readonly statusCode?: number;

  constructor(message: string, statusCode?: number) {
    super(message);
    this.name = "PushSendError";
    this.statusCode = statusCode;
  }
}

export async function sendPushNotification(
  subscription: PushSubscriptionKeys,
  payload: PushPayload
): Promise<void> {
  if (!configured) {
    throw new Error("configureWebPush()が呼ばれていません（VAPIDキー未設定の可能性があります）");
  }

  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: { p256dh: subscription.p256dh, auth: subscription.auth },
      },
      JSON.stringify(payload)
    );
  } catch (error) {
    const statusCode = isStatusCodeError(error) ? error.statusCode : undefined;
    const message = error instanceof Error ? error.message : "Push送信に失敗しました";
    throw new PushSendError(message, statusCode);
  }
}

/** 410(Gone)/404(Not Found)は購読が失効したことを示す。呼び出し側でDBから削除すべき。 */
export function isExpiredSubscriptionError(error: unknown): boolean {
  return error instanceof PushSendError && (error.statusCode === 410 || error.statusCode === 404);
}

function isStatusCodeError(error: unknown): error is { statusCode: number } {
  return typeof error === "object" && error !== null && "statusCode" in error;
}
