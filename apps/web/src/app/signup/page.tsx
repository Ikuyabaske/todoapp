import { redirect } from "next/navigation";

// SSOの発行元はhome-portalに完全移管済み。新規登録もhome-portalの/signupでのみ行う。
export default function SignupPage({
  searchParams,
}: {
  searchParams: { callbackUrl?: string };
}): JSX.Element {
  const callbackUrl = searchParams.callbackUrl ?? "https://tasks.ikuya-baske.com/";
  redirect(`https://home.ikuya-baske.com/signup?callbackUrl=${encodeURIComponent(callbackUrl)}`);
}
