"use client";

import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";
import { PwaRegister } from "@/components/PwaRegister";

export function Providers({ children }: { children: ReactNode }): JSX.Element {
  return (
    <SessionProvider>
      <PwaRegister />
      {children}
    </SessionProvider>
  );
}
