import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@upkeep/db";
import { handleApiError } from "@/server/api-error";
import { ConflictError, ForbiddenError } from "@/server/errors";
import { isRateLimited } from "@/server/rateLimit";
import { signupSchema } from "@/server/validation/auth";

const SIGNUP_ATTEMPT_LIMIT = 20;
const SIGNUP_ATTEMPT_WINDOW_MS = 10 * 60_000; // 10分

// seed.ts(packages/db/prisma/seed.ts)の初期カテゴリと同じ内容。
// 新規登録ユーザーにも同じ初期カテゴリを持たせるため、ここでも定義している。
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

export async function POST(request: Request): Promise<NextResponse> {
  try {
    // 招待コードの総当たり対策。IPが取れない環境では固定キーにフォールバックする。
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    if (isRateLimited(`signup:${ip}`, SIGNUP_ATTEMPT_LIMIT, SIGNUP_ATTEMPT_WINDOW_MS)) {
      throw new ForbiddenError("試行回数が多すぎます。しばらくしてから再試行してください");
    }

    const body = signupSchema.parse(await request.json());

    const inviteCode = process.env.SIGNUP_INVITE_CODE;
    if (!inviteCode || body.inviteCode !== inviteCode) {
      throw new ForbiddenError("招待コードが正しくありません");
    }

    const existing = await prisma.user.findUnique({ where: { email: body.email } });
    if (existing) {
      throw new ConflictError("このメールアドレスは既に登録されています");
    }

    const passwordHash = await bcrypt.hash(body.password, 10);

    const user = await prisma.user.create({
      data: {
        email: body.email,
        passwordHash,
        name: body.name || null,
      },
    });

    await prisma.category.createMany({
      data: DEFAULT_CATEGORIES.map((name) => ({ userId: user.id, name, isDefault: true })),
    });

    return NextResponse.json({ user: { id: user.id, email: user.email } }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
