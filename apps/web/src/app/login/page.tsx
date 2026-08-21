import { redirect } from "next/navigation";

// SSOの発行元はhome-portalに完全移管済み。todoapp自身はログイン手段を持たないため、
// このルートへの直接アクセス(旧ブックマーク等)もhome-portalの統一ログイン画面へ流す。
export default function LoginPage({
  searchParams,
}: {
  searchParams: { callbackUrl?: string };
}): JSX.Element {
  const callbackUrl = searchParams.callbackUrl ?? "https://tasks.ikuya-baske.com/";
  redirect(`https://home.ikuya-baske.com/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
}
