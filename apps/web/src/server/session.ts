import { getServerSession } from "next-auth";
import { cookies } from "next/headers";
import { authOptions } from "@/server/auth";
import { ForbiddenError, RateLimitError, UnauthorizedError } from "@/server/errors";
import { isRateLimited } from "@/server/rateLimit";
import { checkAppAccess } from "@/server/ssoAccess";

const API_RATE_LIMIT = 120; // 1ユーザーあたりの上限
const API_RATE_WINDOW_MS = 60_000; // 1分間

/**
 * ログイン中のuserIdを取得する。API Route Handler内で使用する。
 *
 * middlewareで既に未ログイン/利用不許可アクセスは弾いているが、API単体としての
 * 堅牢性(多層防御)のため各ハンドラでも必ずこれを呼び出す。
 * middlewareは画面(HTMLページ)のみが対象で/api/*は対象外のため、ここでの
 * checkAppAccess()がAPI直叩きに対する唯一の防御線になる点に注意。
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

  const allowed = await checkAppAccess(cookies().toString());
  if (!allowed) {
    throw new ForbiddenError("このアカウントはこのアプリの利用を許可されていません");
  }

  return userId;
}
