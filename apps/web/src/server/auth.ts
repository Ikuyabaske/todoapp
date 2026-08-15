import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@upkeep/db";
import { isRateLimited } from "@/server/rateLimit";

const LOGIN_ATTEMPT_LIMIT = 10;
const LOGIN_ATTEMPT_WINDOW_MS = 5 * 60_000; // 5分

/**
 * 認証設定 (Auth.js / NextAuth v4, Credentials Provider)。
 *
 * 初期ユーザーは `npm run db:seed` が .env の ADMIN_EMAIL / ADMIN_PASSWORD
 * から作成する。それ以降のユーザーは /signup (招待コード必須、
 * apps/web/src/app/api/auth/signup/route.ts) から自己登録できる。
 *
 * すべてのTask/Category等はuserId外部キーで分離されているため、
 * 各ユーザーは自分のデータのみを参照・操作する。
 */
export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "メールアドレス", type: "email" },
        password: { label: "パスワード", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          return null;
        }

        // ブルートフォース対策: メールアドレス単位で試行回数を制限する。
        // 存在有無に関わらずnullを返すことでアカウント列挙を防いでいるのと同様、
        // ここでも制限超過時は理由を出さずnullで統一する。
        if (isRateLimited(`login:${credentials.email}`, LOGIN_ATTEMPT_LIMIT, LOGIN_ATTEMPT_WINDOW_MS)) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });
        if (!user) {
          return null;
        }

        const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!isValid) {
          return null;
        }

        return { id: user.id, email: user.email, name: user.name ?? undefined };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && typeof token.userId === "string") {
        session.user.id = token.userId;
      }
      return session;
    },
  },
};
