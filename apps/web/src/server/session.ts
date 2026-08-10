import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth";
import { RateLimitError, UnauthorizedError } from "@/server/errors";
import { isRateLimited } from "@/server/rateLimit";

const API_RATE_LIMIT = 120; // 1ユーザーあたりの上限
const API_RATE_WINDOW_MS = 60_000; // 1分間

/**
 * ログイン中のuserIdを取得する。API Route Handler内で使用する。
 *
 * middlewareで既に未ログインアクセスは弾いているが、API単体としての
 * 堅牢性(多層防御)のため各ハンドラでも必ずこれを呼び出す。
 * あわせて簡易なレートリミットもここで一括して適用する(20章)。
 */
export async function requireUserId(): Promise<string> {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) {
    throw new UnauthorizedError("認証が必要です");
  }

  if (isRateLimited(`user:${userId}`, API_RATE_LIMIT, API_RATE_WINDOW_MS)) {
    throw new RateLimitError("リクエストが多すぎます。しばらくしてから再試行してください");
  }

  return userId;
}
