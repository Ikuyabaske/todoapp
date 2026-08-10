function timestamp(): string {
  return new Date().toISOString();
}

/** シンプルな構造化ログ出力（27章: ログを適切に出力する）。 */
export const logger = {
  info(message: string, meta?: Record<string, unknown>): void {
    console.log(`[${timestamp()}] [scheduler] ${message}`, meta ?? "");
  },
  error(message: string, meta?: Record<string, unknown>): void {
    console.error(`[${timestamp()}] [scheduler] ${message}`, meta ?? "");
  },
};
