import { NextResponse } from "next/server";
import { ZodError } from "zod";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  RateLimitError,
  UnauthorizedError,
} from "@/server/errors";

/**
 * API Route Handler共通のエラーハンドリング。
 * 想定内のエラーは適切なHTTPステータスに変換し、
 * 想定外のエラーはログに出力した上で500として返す
 * （内部情報をレスポンスに含めない）。
 */
export function handleApiError(error: unknown): NextResponse {
  if (error instanceof UnauthorizedError) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
  if (error instanceof ForbiddenError) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }
  if (error instanceof NotFoundError) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }
  if (error instanceof ConflictError) {
    return NextResponse.json({ error: error.message }, { status: 409 });
  }
  if (error instanceof RateLimitError) {
    return NextResponse.json({ error: error.message }, { status: 429 });
  }
  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: "入力内容に誤りがあります", details: error.flatten() },
      { status: 400 }
    );
  }

  console.error("[api] unexpected error:", error);
  return NextResponse.json({ error: "サーバーエラーが発生しました" }, { status: 500 });
}
