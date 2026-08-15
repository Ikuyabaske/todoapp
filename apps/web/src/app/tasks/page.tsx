import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth";
import { prisma } from "@upkeep/db";
import { TaskListView } from "@/components/TaskListView";

export default async function TasksPage(): Promise<JSX.Element> {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  const tasks = userId
    ? await prisma.task.findMany({
        where: { userId, isArchived: false },
        include: { category: true },
        orderBy: { nextDueAt: "asc" },
      })
    : [];

  return (
    <main className="page">
      <TaskListView tasks={tasks} />

      <div className="actions">
        <Link className="btn btn-primary" href="/tasks/new">
          + タスクを登録
        </Link>
        <Link className="btn" href="/">
          ホームに戻る
        </Link>
      </div>
    </main>
  );
}
