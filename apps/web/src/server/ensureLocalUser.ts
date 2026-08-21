import bcrypt from "bcryptjs";
import { prisma, type User } from "@upkeep/db";

// SSOの発行元がhome-portalに移管されたため、todoapp自身はログイン処理を行わない。
// ただしTask/Category/PushSubscriptionはUser.idへの外部キーを持っているため、
// emailを鍵にローカルのUser行をfind-or-createしてidを解決する
// (news/shiny-broccoliのensure_local_userと同じパターン)。
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

export async function ensureLocalUser(email: string, name: string | null): Promise<User> {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return existing;
  }

  // 認証はhome-portal側で行うため、このpasswordHashはtodoapp内では一切使われない
  // (ダミー値。NOT NULL制約を満たすためだけに、推測不可能なランダム値のハッシュを入れる)。
  const passwordHash = await bcrypt.hash(crypto.randomUUID(), 10);

  const user = await prisma.user.create({
    data: { email, name, passwordHash },
  });

  await prisma.category.createMany({
    data: DEFAULT_CATEGORIES.map((categoryName) => ({
      userId: user.id,
      name: categoryName,
      isDefault: true,
    })),
  });

  return user;
}
