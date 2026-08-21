import type { NextAuthOptions } from "next-auth";
import { ensureLocalUser } from "@/server/ensureLocalUser";

/**
 * 認証設定 (Auth.js / NextAuth v4)。
 *
 * SSOの発行元はhome-portal(home.ikuya-baske.com)に完全移管済み。
 * todoappはログインの手段(Credentials Provider・/login・/signup)を一切持たず、
 * home-portalが発行した共有JWT(同一NEXTAUTH_SECRET・.ikuya-baske.comドメインCookie)を
 * 復号してセッションとして扱うだけの「SSOクライアント」に徹する。
 * 未ログイン時はmiddleware.tsがhome-portalの/loginへリダイレクトする。
 *
 * すべてのTask/Category等はuserId外部キーで分離されているため、
 * 各ユーザーは自分のデータのみを参照・操作する。ただしそのuserIdはtodoapp内の
 * ローカルUserのidであり、home-portal側のUser.idとは別物(emailで対応付け、
 * server/ensureLocalUser.ts参照)。
 */
export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  useSecureCookies: true,
  // セッションCookieを.ikuya-baske.com配下の全サブドメインで共有し、home-portal(SSOの発行元)
  // が発行したセッションをtodoappでもそのまま読める(逆方向も同様)ようにする(SSO)。
  //
  // callbackUrlはあえてドメイン共有しない(home-portal/auth.tsの同コメント参照)。
  // 「以前どこかのアプリで使われたcallbackUrlの値」が別アプリのログイン/ログアウト後に
  // 紛れ込む不具合の原因になるため、常にクエリパラメータで明示的に渡す。
  cookies: {
    sessionToken: {
      name: `__Secure-next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: true,
        domain: ".ikuya-baske.com",
      },
    },
  },
  // ログイン手段(Provider)を一切持たない。ここでの唯一の役割はhome-portalが
  // 発行した共有JWTをsecretで復号すること(getServerSession/getTokenの内部処理)。
  providers: [],
  callbacks: {
    // SSOの発行元がhome-portalに移管されたため、token.userIdは
    // (home-portal側のUser.idであり)todoapp内のUser.idとは無関係になった。
    // token.emailを鍵にtodoapp内のローカルUserをfind-or-createして解決する。
    async session({ session, token }) {
      if (session.user && typeof token.email === "string") {
        const localUser = await ensureLocalUser(
          token.email,
          typeof token.name === "string" ? token.name : null
        );
        session.user.id = localUser.id;
      }
      return session;
    },
    // signOut()のcallbackUrl(home-portalのログイン画面)を許可する。
    // これがないとNextAuthの既定挙動で外部originへのredirectがtodoapp自身のbaseUrlに
    // 差し替えられてしまう。
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      try {
        const parsed = new URL(url, baseUrl);
        if (parsed.origin === "https://home.ikuya-baske.com") return parsed.toString();
      } catch {
        // Invalid callback URLs fall through to the local base URL.
      }
      return baseUrl;
    },
  },
};
