import { NextResponse } from "next/server";
import { prisma } from "@upkeep/db";
import { resolveSnoozeUntil } from "@upkeep/core";
import { requireUserId } from "@/server/session";
import { handleApiError } from "@/server/api-error";
import { NotFoundError } from "@/server/errors";
import { snoozeTaskSchema } from "@/server/validation/complete";

/**
 * 「あとで」機能。通知タイミング(snoozeUntil)のみを変更し、
 * タスク本来の期限(nextDueAt)には一切手を加えない。
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

    const body = snoozeTaskSchema.parse(await request.json());

    let customUntil: Date | undefined;
    if (body.preset === "CUSTOM") {
      const parsed = new Date(body.customUntil ?? "");
      if (Number.isNaN(parsed.getTime())) {
        return NextResponse.json({ error: "日時の指定が不正です" }, { status: 400 });
      }
      customUntil = parsed;
    }

    const snoozeUntil = resolveSnoozeUntil({ preset: body.preset, now: new Date(), customUntil });

    const updated = await prisma.task.update({
      where: { id: task.id },
      data: { snoozeUntil },
    });

    return NextResponse.json({ task: updated });
  } catch (error) {
    return handleApiError(error);
  }
}
