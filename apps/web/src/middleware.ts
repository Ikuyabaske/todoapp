import { withAuth } from "next-auth/middleware";

// 未ログイン時は /login にリダイレクトする。
// next-auth/middlewareはデフォルトだと組み込みの/api/auth/signinへ
// リダイレクトするため、authOptionsと同じpages.signInを明示する。
export default withAuth({
  pages: {
    signIn: "/login",
  },
});

// 認証(NextAuth)自体のAPI、ログイン画面、PWA関連の静的ファイル
// (manifest / service worker / icons) は認証チェックの対象外とする。
export const config = {
  matcher: [
    "/((?!api/auth|login|manifest\\.webmanifest|sw\\.js|icons|_next/static|_next/image|favicon\\.ico).*)",
  ],
};
