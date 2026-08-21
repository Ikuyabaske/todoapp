import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth";
import { prisma } from "@upkeep/db";
import { InstallPrompt } from "@/components/InstallPrompt";
import { NotificationSettings } from "@/components/NotificationSettings";
import { LogoutButton } from "@/components/LogoutButton";
import { CategoryManager } from "@/components/CategoryManager";

export default async function SettingsPage(): Promise<JSX.Element> {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  const categories = userId
    ? await prisma.category.findMany({
        where: { userId },
        orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
      })
    : [];

  return (
    <main className="page">
      <h1>設定</h1>

      <section className="card">
        <h2>アカウント</h2>
        <p className="muted">{session?.user?.email}</p>
        <LogoutButton />
      </section>

      <section className="card">
        <h2>アプリのインストール</h2>
        <p className="muted">
          ホーム画面に追加すると、アプリのようにフルスクリーンで起動でき、Push通知も受け取れるようになります。
        </p>
        <InstallPrompt />
      </section>

      <section className="card">
        <h2>通知</h2>
        <NotificationSettings />
      </section>

      <section className="card">
        <h2>カテゴリ</h2>
        <p className="muted">
          タスク一覧の絞り込みタブに使われます。「ビジネス用」「勉強用」「家のこと」のように用途に合わせて追加できます。
        </p>
        <CategoryManager categories={categories} />
      </section>
    </main>
  );
}
