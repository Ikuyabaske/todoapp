/** 未ログイン、またはセッションが無効な場合。 */
export class UnauthorizedError extends Error {}

/** 対象データが存在しない、または他ユーザーの所有物で見せてはいけない場合。 */
export class NotFoundError extends Error {}
