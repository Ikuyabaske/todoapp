import { getToken } from "next-auth/jwt";
import { NextResponse, type NextRequest } from "next/server";
import { checkAppAccess } from "@/server/ssoAccess";

// SSOの発行元はhome-portalに移管済みのため、未ログイン時はtodoappローカルの
// /login ではなく home-portal の /login へリダイレクトする
// (news/shiny-broccoli/ai-factory-webのsso_login_redirect/requireUserと同じ発想)。
const SSO_LOGIN_URL = process.env.SSO_LOGIN_URL ?? "https://home.ikuya-baske.com/login";
const TASKS_PUBLIC_URL = process.env.NEXTAUTH_URL ?? "https://tasks.ikuya-baske.com";

export default async function middleware(request: NextRequest): Promise<NextResponse> {
  // 「ログイン済みか」はローカルでJWTをデコードするだけの高速な判定(トークンの真正性のみ確認)。
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET, secureCookie: true });
  if (!token) {
    const callbackUrl = encodeURIComponent(
      `${TASKS_PUBLIC_URL}${request.nextUrl.pathname}${request.nextUrl.search}`
    );
    return NextResponse.redirect(`${SSO_LOGIN_URL}?callbackUrl=${callbackUrl}`);
  }

  // 「tasksアプリを利用してよいか」はhome-portalのDBを都度参照して判定する
  // (server/ssoAccess.tsのコメント参照。JWTには埋め込まずここで毎回確認する)。
  const allowed = await checkAppAccess(request.headers.get("cookie") ?? "");
  if (!allowed) {
    return NextResponse.redirect(`${TASKS_PUBLIC_URL}/access-denied`);
  }

  return NextResponse.next();
}

// このmiddlewareは「画面(ページ)」のみを対象とし、未ログイン時はhome-portalの/loginへ
// リダイレクトする。/api/* はここでは保護しない — HTMLへの307リダイレクトは
// fetch/PWAクライアントにとって扱いにくいため、各Route Handler内の
// requireUserId()がJSON 401/403を返す方式に統一する（多層防御は維持される）。
export const config = {
  matcher: [
    "/((?!api|login|signup|access-denied|manifest\\.webmanifest|sw\\.js|icons|_next/static|_next/image|favicon\\.ico).*)",
  ],
};
