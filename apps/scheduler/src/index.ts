import { checkAndNotify } from "./checkAndNotify";
import { logger } from "./logger";

const DEFAULT_INTERVAL_MINUTES = 5;

function getIntervalMs(): number {
  const raw = process.env.SCHEDULER_INTERVAL_MINUTES;
  const minutes = raw ? Number(raw) : DEFAULT_INTERVAL_MINUTES;

  if (!Number.isFinite(minutes) || minutes <= 0) {
    logger.error(
      `SCHEDULER_INTERVAL_MINUTESの値が不正なため既定値(${DEFAULT_INTERVAL_MINUTES}分)を使用します`,
      { raw }
    );
    return DEFAULT_INTERVAL_MINUTES * 60_000;
  }

  return minutes * 60_000;
}

async function tick(): Promise<void> {
  const startedAt = Date.now();
  try {
    await checkAndNotify();
  } catch (error) {
    logger.error("チェックサイクルで予期しないエラーが発生しました", {
      error: error instanceof Error ? error.message : String(error),
    });
  } finally {
    logger.info(`チェックサイクル完了 (${Date.now() - startedAt}ms)`);
  }
}

async function main(): Promise<void> {
  const intervalMs = getIntervalMs();
  logger.info(`scheduler起動: ${intervalMs / 60_000}分間隔で実行します`);

  // コンテナ再起動直後からの通知漏れを最小化するため、起動直後にも1回実行する。
  await tick();

  const timer = setInterval(() => {
    void tick();
  }, intervalMs);

  function shutdown(signal: string): void {
    logger.info(`${signal}を受信、シャットダウンします`);
    clearInterval(timer);
    process.exit(0);
  }

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

main().catch((error: unknown) => {
  logger.error("scheduler起動に失敗しました", {
    error: error instanceof Error ? error.message : String(error),
  });
  process.exit(1);
});
