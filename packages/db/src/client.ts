import { PrismaClient } from "@prisma/client";

// Next.jsのdev環境でのホットリロード時に PrismaClient が
// 何度も生成されてDBコネクションを使い切らないよう、
// globalThisにシングルトンとしてキャッシュする定石パターン。
declare global {
  // eslint-disable-next-line no-var
  var __upkeepPrisma: PrismaClient | undefined;
}

export const prisma: PrismaClient =
  globalThis.__upkeepPrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.__upkeepPrisma = prisma;
}

export * from "@prisma/client";
