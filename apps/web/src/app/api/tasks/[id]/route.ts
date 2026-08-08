import { NextResponse } from "next/server";
import { Prisma, prisma } from "@upkeep/db";
import { parseDateOnly } from "@upkeep/core";
import { requireUserId } from "@/server/session";
import { handleApiError } from "@/server/api-error";
import { NotFoundError } from "@/server/errors";
import { taskUpdateSchema } from "@/server/validation/task";
import { assertCategoryOwnership } from "@/server/category";

async function assertTaskOwnership(userId: string, id: string): Promise<void> {
  const task = await prisma.task.findFirst({ where: { id, userId } });
  if (!task) {
    throw new NotFoundError("タスクが見つかりません");
  }
}

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const userId = await requireUserId();
    const task = await prisma.task.findFirst({
      where: { id: params.id, userId },
      include: {
        category: true,
        histories: { orderBy: { completedAt: "desc" } },
      },
    });
    if (!task) {
      throw new NotFoundError("タスクが見つかりません");
    }
    return NextResponse.json({ task });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const userId = await requireUserId();
    await assertTaskOwnership(userId, params.id);
    const body = taskUpdateSchema.parse(await request.json());

    if (body.categoryId) {
      await assertCategoryOwnership(userId, body.categoryId);
    }

    const data: Prisma.TaskUpdateInput = {};
    if (body.name !== undefined) data.name = body.name;
    if (body.categoryId !== undefined) {
      data.category = body.categoryId
        ? { connect: { id: body.categoryId } }
        : { disconnect: true };
    }
    if (body.repeatUnit !== undefined) data.repeatUnit = body.repeatUnit;
    if (body.repeatInterval !== undefined) data.repeatInterval = body.repeatInterval;
    if (body.firstDueAt !== undefined) data.firstDueAt = parseDateOnly(body.firstDueAt);
    if (body.notificationEnabled !== undefined) data.notificationEnabled = body.notificationEnabled;
    if (body.notificationTime !== undefined) data.notificationTime = body.notificationTime;
    if (body.preNotificationDays !== undefined) data.preNotificationDays = body.preNotificationDays;
    if (body.priority !== undefined) data.priority = body.priority;
    if (body.memo !== undefined) data.memo = body.memo;

    const task = await prisma.task.update({ where: { id: params.id }, data });
    return NextResponse.json({ task });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const userId = await requireUserId();
    await assertTaskOwnership(userId, params.id);
    // TaskHistory/NotificationHistoryはonDelete: Cascadeのため自動的に削除される。
    await prisma.task.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
