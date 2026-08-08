import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth";
import { prisma } from "@upkeep/db";

export default async function HomePage(): Promise<JSX.Element> {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id ?? null;

  const categories = userId
    ? await prisma.category.findMany({
        where: { userId },
        orderBy: { createdAt: "asc" },
      })
    : [];

  return (
    <main className="page">
      <h1>Upkeep</h1>
      <p className="lead">定期メンテナンス管理アプリ</p>

      <section className="card">
        <h2>セットアップ状況（Phase 1）</h2>
        <ul className="status-list">
          <li>✅ Next.js 起動</li>
          <li>✅ PostgreSQL 接続 / Prisma 疎通</li>
          <li>{userId ? `✅ ログイン中: ${session?.user?.email}` : "❌ 未ログイン"}</li>
          <li>✅ カテゴリ {categories.length} 件（seed投入済み）</li>
        </ul>
      </section>

      <nav className="home-groups">
        <div className="group-card">
          <h3>今日</h3>
          <p className="muted">Phase 5 で実装予定</p>
        </div>
        <div className="group-card">
          <h3>期限切れ</h3>
          <p className="muted">Phase 5 で実装予定</p>
        </div>
        <div className="group-card">
          <h3>今後</h3>
          <p className="muted">Phase 5 で実装予定</p>
        </div>
      </nav>

      <div className="actions">
        <Link className="btn" href="/tasks">
          タスク一覧
        </Link>
        <Link className="btn btn-primary" href="/tasks/new">
          タスクを登録
        </Link>
        <Link className="btn" href="/settings">
          設定
        </Link>
      </div>
    </main>
  );
}
