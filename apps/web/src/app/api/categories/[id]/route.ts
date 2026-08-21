import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@upkeep/db";
import { requireUserId } from "@/server/session";
import { handleApiError } from "@/server/api-error";
import { assertCategoryOwnership } from "@/server/category";

const renameCategorySchema = z.object({
  name: z.string().trim().min(1, "カテゴリ名は必須です").max(50, "50文字以内で入力してください"),
});

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const userId = await requireUserId();
    await assertCategoryOwnership(userId, params.id);
    const { name } = renameCategorySchema.parse(await request.json());

    const category = await prisma.category.update({
      where: { id: params.id },
      data: { name },
    });
    return NextResponse.json({ category });
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
    await assertCategoryOwnership(userId, params.id);

    // 紐づくタスクは削除せず、未分類に戻してからカテゴリを削除する。
    await prisma.$transaction([
      prisma.task.updateMany({
        where: { userId, categoryId: params.id },
        data: { categoryId: null },
      }),
      prisma.category.delete({ where: { id: params.id } }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
