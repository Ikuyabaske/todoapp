/** 未ログイン、またはセッションが無効な場合。 */
export class UnauthorizedError extends Error {}

/** 対象データが存在しない、または他ユーザーの所有物で見せてはいけない場合。 */
export class NotFoundError extends Error {}

/** レートリミットを超過した場合。 */
export class RateLimitError extends Error {}

/** 招待コード不一致など、権限がなく操作を拒否する場合。 */
export class ForbiddenError extends Error {}

/** メールアドレスの重複など、リクエスト内容が既存データと衝突する場合。 */
export class ConflictError extends Error {}
