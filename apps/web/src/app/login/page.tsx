import Link from "next/link";
import { Suspense } from "react";
import { LoginForm } from "./login-form";

export default function LoginPage(): JSX.Element {
  return (
    <main className="page">
      <h1>Upkeep にログイン</h1>
      {/* useSearchParams()を使うLoginFormはCSRバイアウトのためSuspenseで包む */}
      <Suspense fallback={<p className="muted">読み込み中...</p>}>
        <LoginForm />
      </Suspense>
      <p className="muted">
        アカウントをお持ちでない方は <Link href="/signup">新規登録</Link>
      </p>
    </main>
  );
}
