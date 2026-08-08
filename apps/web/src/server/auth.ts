import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@upkeep/db";

/**
 * 認証設定 (Auth.js / NextAuth v4, Credentials Provider)。
 *
 * MVPでは自宅サーバーの単一ユーザー運用を想定し、公開の会員登録画面は
 * 用意しない。初期ユーザーは `npm run db:seed` が .env の
 * ADMIN_EMAIL / ADMIN_PASSWORD から作成する。
 *
 * すべてのTask/Category等はuserId外部キーで分離されているため、
 * 将来複数ユーザー化する際もこのCredentials認証の上に
 * 追加のProviderを載せるだけで拡張できる。
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
