import { NextResponse } from "next/server";
import { prisma } from "@upkeep/db";
import { parseDateOnly } from "@upkeep/core";
import { requireUserId } from "@/server/session";
import { handleApiError } from "@/server/api-error";
import { taskInputSchema } from "@/server/validation/task";
import { assertCategoryOwnership } from "@/server/category";

export async function GET(): Promise<NextResponse> {
  try {
    const userId = await requireUserId();
    const tasks = await prisma.task.findMany({
      where: { userId, isArchived: false },
      include: { category: true },
      orderBy: { nextDueAt: "asc" },
    });
    return NextResponse.json({ tasks });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const userId = await requireUserId();
    const body = taskInputSchema.parse(await request.json());

    if (body.categoryId) {
      await assertCategoryOwnership(userId, body.categoryId);
    }

    // 登録直後は「初回予定日 = 次回予定日」。以降はPhase3で実装する
    // 完了日基準の再計算ロジックによってnextDueAtが更新されていく。
    const firstDueAt = parseDateOnly(body.firstDueAt);

    const task = await prisma.task.create({
      data: {
        userId,
        name: body.name,
        categoryId: body.categoryId ?? null,
        repeatUnit: body.repeatUnit,
        repeatInterval: body.repeatInterval,
        firstDueAt,
        nextDueAt: firstDueAt,
        notificationEnabled: body.notificationEnabled,
        notificationTime: body.notificationTime,
        preNotificationDays: body.preNotificationDays,
        priority: body.priority,
        memo: body.memo ?? null,
      },
    });

    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
