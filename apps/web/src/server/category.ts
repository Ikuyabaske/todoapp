import { prisma } from "@upkeep/db";
import { NotFoundError } from "@/server/errors";

/** カテゴリが指定ユーザーの所有物であることを確認する（他ユーザーのカテゴリ流用を防ぐ）。 */
export async function assertCategoryOwnership(userId: string, categoryId: string): Promise<void> {
  const category = await prisma.category.findFirst({ where: { id: categoryId, userId } });
  if (!category) {
    throw new NotFoundError("指定されたカテゴリが見つかりません");
  }
}
