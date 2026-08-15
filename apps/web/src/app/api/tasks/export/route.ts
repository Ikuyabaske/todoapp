import { NextResponse } from "next/server";
import { prisma } from "@upkeep/db";
import { requireUserId } from "@/server/session";
import { handleApiError } from "@/server/api-error";
import { tasksToCsv } from "@/lib/csv";

export async function GET(): Promise<NextResponse> {
  try {
    const userId = await requireUserId();
    const tasks = await prisma.task.findMany({
      where: { userId, isArchived: false },
      include: { category: true },
      orderBy: { nextDueAt: "asc" },
    });

    const csv = tasksToCsv(tasks);
    const filename = `upkeep-tasks-${new Date().toISOString().slice(0, 10)}.csv`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
