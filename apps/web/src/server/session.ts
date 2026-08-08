import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth";
import { UnauthorizedError } from "@/server/errors";

/**
 * ログイン中のuserIdを取得する。API Route Handler内で使用する。
 *
 * middlewareで既に未ログインアクセスは弾いているが、API単体としての
 * 堅牢性(多層防御)のため各ハンドラでも必ずこれを呼び出す。
 */
export async function requireUserId(): Promise<string> {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) {
    throw new UnauthorizedError("認証が必要です");
  }
  return userId;
}
