import { prisma, type Task } from "@upkeep/db";
import {
  buildNotificationMessage,
  decideNotification,
  formatDateOnly,
  isExpiredSubscriptionError,
  parseDateOnly,
  sendPushNotification,
} from "@upkeep/core";
import { ensureWebPushConfigured } from "./webPush";
import { logger } from "./logger";

const MAX_NOTIFICATION_ATTEMPTS = 3;

/**
 * 1サイクル分の通知チェック処理（8章の仕様）。
 * 通知対象タスクを検索 → 送信要否を判定 → 未送信ならPush送信 → 送信履歴を保存、を行う。
 */
export async function checkAndNotify(now: Date = new Date()): Promise<void> {
  ensureWebPushConfigured();

  const tasks = await prisma.task.findMany({
    where: { isArchived: false, notificationEnabled: true },
  });

  logger.info(`チェック対象タスク: ${tasks.length}件`);

  for (const task of tasks) {
    try {
      await processTask(task, now);
    } catch (error) {
      logger.error(`タスク処理中にエラーが発生しました: taskId=${task.id}`, {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}

async function processTask(task: Task, now: Date): Promise<void> {
  const decision = decideNotification(
    {
      nextDueAt: formatDateOnly(task.nextDueAt),
      notificationEnabled: task.notificationEnabled,
      notificationTime: task.notificationTime,
      preNotificationDays: task.preNotificationDays,
      snoozeUntil: task.snoozeUntil,
    },
    now
  );

  if (!decision.shouldNotify) {
    return;
  }

  // 重複送信防止の一次チェック(存在確認)。最終防波堤はDBのユニーク制約
  // (taskId, type, scheduledFor)であり、これは主にログの静音化・無駄なPush呼び出し
  // 回避のための事前チェックにすぎない。
  const scheduledForDate = parseDateOnly(decision.scheduledFor);
  const existingHistory = await prisma.notificationHistory.findUnique({
    where: {
      taskId_type_scheduledFor: {
        taskId: task.id,
        type: decision.kind,
        scheduledFor: scheduledForDate,
      },
    },
  });
  if (
    existingHistory?.success ||
    (existingHistory?.attemptCount ?? 0) >= MAX_NOTIFICATION_ATTEMPTS
  ) {
    return;
  }

  const subscriptions = await prisma.pushSubscription.findMany({ where: { userId: task.userId } });
  const message = buildNotificationMessage({
    kind: decision.kind,
    taskName: task.name,
    days: decision.days,
    priority: task.priority,
  });

  let successCount = 0;
  let expiredCount = 0;
  let lastError: string | null = null;

  for (const subscription of subscriptions) {
    try {
      await sendPushNotification(
        { endpoint: subscription.endpoint, p256dh: subscription.p256dh, auth: subscription.auth },
        { title: message.title, body: message.body, url: `/tasks/${task.id}` }
      );
      successCount += 1;
    } catch (error) {
      if (isExpiredSubscriptionError(error)) {
        // 失効した購読(410/404)はDBから削除し、次回以降の無駄な送信試行を防ぐ。
        expiredCount += 1;
        await prisma.pushSubscription.delete({ where: { id: subscription.id } }).catch(() => undefined);
      } else {
        lastError = error instanceof Error ? error.message : String(error);
        logger.error(`Push送信に失敗しました: taskId=${task.id}`, { error: lastError });
      }
    }
  }

  const success = subscriptions.length > 0 && successCount > 0;

  // ユニーク制約(taskId, type, scheduledFor)により、同一タスク・同一種別・
  // 同一日の重複INSERTはDBレベルで確実に防止される（重複通知防止の最終防波堤）。
  try {
    await prisma.notificationHistory.upsert({
      where: {
        taskId_type_scheduledFor: {
          taskId: task.id,
          type: decision.kind,
          scheduledFor: scheduledForDate,
        },
      },
      create: {
        taskId: task.id,
        type: decision.kind,
        scheduledFor: scheduledForDate,
        success,
        attemptCount: 1,
        errorMessage: success ? null : buildErrorMessage(subscriptions.length, expiredCount, lastError),
      },
      update: {
        success,
        attemptCount: { increment: 1 },
        sentAt: new Date(),
        errorMessage: success ? null : buildErrorMessage(subscriptions.length, expiredCount, lastError),
      },
    });
  } catch (error) {
    // 極めて短時間に2回チェックが走った場合などのユニーク制約違反はここで握りつぶす。
    logger.info(`NotificationHistory作成をスキップしました(既に記録済みの可能性): taskId=${task.id}`, {
      error: error instanceof Error ? error.message : String(error),
    });
    return;
  }

  if (decision.consumedSnooze) {
    await prisma.task.update({ where: { id: task.id }, data: { snoozeUntil: null } });
  }

  logger.info(
    `通知処理完了: taskId=${task.id} name=${task.name} kind=${decision.kind} success=${success} 送信=${successCount}/${subscriptions.length}`
  );
}

function buildErrorMessage(
  subscriptionCount: number,
  expiredCount: number,
  lastError: string | null
): string {
  if (subscriptionCount === 0) {
    return "Push購読が登録されていません";
  }
  if (lastError) {
    return lastError;
  }
  if (expiredCount > 0) {
    return `購読が失効していたため削除しました(${expiredCount}件)`;
  }
  return "不明な理由で送信に失敗しました";
}
