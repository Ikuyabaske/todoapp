import { withAuth } from "next-auth/middleware";

// 未ログイン時は /login にリダイレクトする。
// next-auth/middlewareはデフォルトだと組み込みの/api/auth/signinへ
// リダイレクトするため、authOptionsと同じpages.signInを明示する。
export default withAuth({
  pages: {
    signIn: "/login",
  },
});

// このmiddlewareは「画面(ページ)」のみを対象とし、未ログイン時は/loginへ
// リダイレクトする。/api/* はここでは保護しない — HTMLへの307リダイレクトは
// fetch/PWAクライアントにとって扱いにくいため、各Route Handler内の
// requireUserId()がJSON 401を返す方式に統一する（多層防御は維持される）。
export const config = {
  matcher: [
    "/((?!api|login|signup|manifest\\.webmanifest|sw\\.js|icons|_next/static|_next/image|favicon\\.ico).*)",
  ],
};
