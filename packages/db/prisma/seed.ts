import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// 初期カテゴリ（11章）。将来的にユーザーが独自カテゴリを追加できるよう
// isDefault=true で区別し、ユーザー追加分と混在させられる設計にしている。
const DEFAULT_CATEGORIES = [
  "家事",
  "掃除",
  "車",
  "PC・家電",
  "健康",
  "育児",
  "手続き",
  "契約",
  "その他",
] as const;

async function main(): Promise<void> {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "ADMIN_EMAIL / ADMIN_PASSWORD が .env に設定されていません。seedを実行する前に設定してください。"
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, passwordHash, name: "管理者" },
  });

  for (const name of DEFAULT_CATEGORIES) {
    await prisma.category.upsert({
      where: { userId_name: { userId: user.id, name } },
      update: {},
      create: { userId: user.id, name, isDefault: true },
    });
  }

  console.log(`[seed] 完了: user=${user.email} categories=${DEFAULT_CATEGORIES.length}件`);
}

main()
  .catch((e: unknown) => {
    console.error("[seed] 失敗:", e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
