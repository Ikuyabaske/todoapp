import { configureWebPush } from "@upkeep/core";

let initialized = false;

/** VAPID設定を環境変数から読み込み、初回のみ@upkeep/coreのweb-pushクライアントを初期化する。 */
export function ensureWebPushConfigured(): void {
  if (initialized) {
    return;
  }

  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;

  if (!publicKey || !privateKey || !subject) {
    throw new Error(
      "VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY / VAPID_SUBJECT が.envに設定されていません"
    );
  }

  configureWebPush({ publicKey, privateKey, subject });
  initialized = true;
}
