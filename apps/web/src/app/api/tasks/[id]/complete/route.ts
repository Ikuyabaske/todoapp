import { NextResponse } from "next/server";
import { prisma } from "@upkeep/db";
import { calculateNextDueDate, parseDateOnly, toJstDateString } from "@upkeep/core";
import { requireUserId } from "@/server/session";
import { handleApiError } from "@/server/api-error";
import { NotFoundError } from "@/server/errors";
import { completeTaskSchema } from "@/server/validation/complete";

/**
 * タスクを「完了」として記録する。
 *
 * 1. TaskHistoryに完了履歴を保存（本仕様の核心: 実際の完了日を保存する）
 * 2. lastCompletedAtを更新
 * 3. 実際の完了日を基準にcalculateNextDueDateで次回予定日を計算
 * 4. nextDueAtを更新
 * 5. snoozeUntilをリセット（次のサイクルに向けて通知延期状態を解除）
 *
 * 2〜5は同一トランザクションで行い、途中失敗による不整合を防ぐ。
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const userId = await requireUserId();
    const task = await prisma.task.findFirst({ where: { id: params.id, userId } });
    if (!task) {
      throw new NotFoundError("タスクが見つかりません");
    }

    const rawBody: unknown = await request.json().catch(() => ({}));
    const body = completeTaskSchema.parse(rawBody);
    const completedAt = body.completedAt ?? toJstDateString(new Date());

    const isOneTimeTask = task.repeatUnit === "ONCE";
    const nextDueAt = isOneTimeTask
      ? null
      : calculateNextDueDate({
          repeatUnit: task.repeatUnit,
          repeatInterval: task.repeatInterval,
          completedAt,
        });

    const [history, updatedTask] = await prisma.$transaction([
      prisma.taskHistory.create({
        data: {
          taskId: task.id,
          completedAt: parseDateOnly(completedAt),
          dueAtAtCompletion: task.nextDueAt,
          note: body.note ?? null,
        },
      }),
      prisma.task.update({
        where: { id: task.id },
        data: {
          lastCompletedAt: parseDateOnly(completedAt),
          ...(nextDueAt ? { nextDueAt: parseDateOnly(nextDueAt) } : {}),
          ...(isOneTimeTask ? { isArchived: true, notificationEnabled: false } : {}),
          snoozeUntil: null,
        },
      }),
    ]);

    return NextResponse.json({ task: updatedTask, history });
  } catch (error) {
    return handleApiError(error);
  }
}
