import { NextResponse } from "next/server";
import { prisma } from "@upkeep/db";
import { buildNotificationMessage, isExpiredSubscriptionError, sendPushNotification } from "@upkeep/core";
import { requireUserId } from "@/server/session";
import { handleApiError } from "@/server/api-error";
import { ensureWebPushConfigured } from "@/server/webPush";

/**
 * 設定画面からの「テスト通知を送信」用エンドポイント。
 * scheduler(Phase8)を待たずに、Push配送経路全体(購読→送信→SW受信→表示)を確認できるようにする。
 */
export async function POST(): Promise<NextResponse> {
  try {
    const userId = await requireUserId();
    ensureWebPushConfigured();

    const subscriptions = await prisma.pushSubscription.findMany({ where: { userId } });
    if (subscriptions.length === 0) {
      return NextResponse.json(
        { error: "通知の購読が見つかりません。先に通知を有効にしてください。" },
        { status: 400 }
      );
    }

    const message = buildNotificationMessage({ kind: "DUE", taskName: "テスト通知" });
    let sent = 0;

    for (const sub of subscriptions) {
      try {
        await sendPushNotification(
          { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
          { title: message.title, body: `${message.body}（これはテスト通知です）`, url: "/" }
        );
        sent += 1;
      } catch (error) {
        if (isExpiredSubscriptionError(error)) {
          // 失効した購読はDBから削除しておく(重複エラーの温床にしない)。
          await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => undefined);
        } else {
          console.error("[api/push/test] 送信失敗:", error);
        }
      }
    }

    return NextResponse.json({ sent, total: subscriptions.length });
  } catch (error) {
    return handleApiError(error);
  }
}
