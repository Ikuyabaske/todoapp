interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

/**
 * 単一プロセス内のインメモリ実装によるシンプルなレートリミット。
 * 自宅サーバーでの単一appインスタンス運用(MVP)では十分だが、
 * 複数インスタンスへスケールアウトする場合はRedis等の共有ストアに
 * 置き換える必要がある点に注意。
 */
export function isRateLimited(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }

  existing.count += 1;
  return existing.count > limit;
}

// 期限切れバケットの定期クリーンアップ(メモリリーク防止)。
// プロセスの終了を妨げないようunref()しておく。
const cleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) {
      buckets.delete(key);
    }
  }
}, 60_000);
cleanupTimer.unref();
