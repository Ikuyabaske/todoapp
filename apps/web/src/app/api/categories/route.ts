import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@upkeep/db";
import { requireUserId } from "@/server/session";
import { handleApiError } from "@/server/api-error";

const createCategorySchema = z.object({
  name: z.string().trim().min(1, "カテゴリ名は必須です").max(50, "50文字以内で入力してください"),
});

export async function GET(): Promise<NextResponse> {
  try {
    const userId = await requireUserId();
    const categories = await prisma.category.findMany({
      where: { userId },
      orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
    });
    return NextResponse.json({ categories });
  } catch (error) {
    return handleApiError(error);
  }
}

// 11章: 将来的にユーザーが独自カテゴリを追加できるようにするための最小限のAPI。
export async function POST(request: Request): Promise<NextResponse> {
  try {
    const userId = await requireUserId();
    const { name } = createCategorySchema.parse(await request.json());

    const category = await prisma.category.upsert({
      where: { userId_name: { userId, name } },
      update: {},
      create: { userId, name },
    });

    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
