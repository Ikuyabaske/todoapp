import { NextResponse } from "next/server";
import { prisma } from "@upkeep/db";
import { requireUserId } from "@/server/session";
import { handleApiError } from "@/server/api-error";
import { pushSubscribeSchema, pushUnsubscribeSchema } from "@/server/validation/push";

/** 現在ログイン中のユーザーが保持しているPush購読数を返す（設定画面表示用）。 */
export async function GET(): Promise<NextResponse> {
  try {
    const userId = await requireUserId();
    const count = await prisma.pushSubscription.count({ where: { userId } });
    return NextResponse.json({ count });
  } catch (error) {
    return handleApiError(error);
  }
}

/** ブラウザから取得したPush購読情報をDBに保存する。同じendpointは上書き(upsert)する。 */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    const userId = await requireUserId();
    const body = pushSubscribeSchema.parse(await request.json());

    const subscription = await prisma.pushSubscription.upsert({
      where: { endpoint: body.endpoint },
      update: { userId, p256dh: body.keys.p256dh, auth: body.keys.auth },
      create: { userId, endpoint: body.endpoint, p256dh: body.keys.p256dh, auth: body.keys.auth },
    });

    return NextResponse.json({ subscription }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

/** 通知を無効化した際に、対応する購読情報をDBから削除する。 */
export async function DELETE(request: Request): Promise<NextResponse> {
  try {
    const userId = await requireUserId();
    const body = pushUnsubscribeSchema.parse(await request.json());

    await prisma.pushSubscription.deleteMany({ where: { endpoint: body.endpoint, userId } });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
