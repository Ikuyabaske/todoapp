import type { DefaultSession } from "next-auth";

// next-authの型にuserIdを追加する型拡張。
// これにより session.user.id / token.userId を型安全に扱える。
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
  }
}
