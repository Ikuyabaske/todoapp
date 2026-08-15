"use client";

import { signOut } from "next-auth/react";
import { useState } from "react";

export function LogoutButton(): JSX.Element {
  const [pending, setPending] = useState(false);

  async function handleLogout(): Promise<void> {
    setPending(true);
    try {
      await signOut({ callbackUrl: "/login" });
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
