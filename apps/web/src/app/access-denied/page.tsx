export default function AccessDeniedPage(): JSX.Element {
  return (
    <main className="page">
      <h1>アクセスが許可されていません</h1>
      <p className="lead">このアカウントはUpkeep(タスク管理)の利用を許可されていません。</p>
      <a className="btn" href="https://home.ikuya-baske.com">
        ホームへ戻る
      </a>
    </main>
  );
}
