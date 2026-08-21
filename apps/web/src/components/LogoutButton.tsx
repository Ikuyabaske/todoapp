"use client";

import { signOut } from "next-auth/react";
import { useState } from "react";

export function LogoutButton(): JSX.Element {
  const [pending, setPending] = useState(false);

  async function handleLogout(): Promise<void> {
    setPending(true);
    try {
      // SSOの発行元はhome-portalのみ(todoappはログイン手段を持たない)なので、
      // ログアウト後はhome-portalのログイン画面へ遷移する。
      await signOut({ callbackUrl: "https://home.ikuya-baske.com/login" });
    } finally {
      setPending(false);
    }
  }

  return (
    <button className="btn btn-danger" type="button" onClick={handleLogout} disabled={pending}>
      {pending ? "ログアウト中..." : "ログアウト"}
    </button>
  );
}
