import { SignupForm } from "./signup-form";

export default function SignupPage(): JSX.Element {
  return (
    <main className="page">
      <h1>Upkeep に新規登録</h1>
      <p className="lead">招待コードをお持ちの方のみ登録できます。</p>
      <SignupForm />
    </main>
  );
}
