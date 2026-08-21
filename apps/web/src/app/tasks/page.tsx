import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth";
import { prisma } from "@upkeep/db";
import { TaskListView } from "@/components/TaskListView";
import { TaskCsvImportButton } from "@/components/TaskCsvImportButton";

export default async function TasksPage(): Promise<JSX.Element> {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  const [tasks, categories] = userId
    ? await Promise.all([
        prisma.task.findMany({
          where: { userId, isArchived: false },
          include: { category: true },
          orderBy: { nextDueAt: "asc" },
        }),
        prisma.category.findMany({
          where: { userId },
          orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
        }),
      ])
    : [[], []];

  return (
    <main className="page">
      <TaskListView tasks={tasks} categories={categories} />

      <div className="actions">
        <a className="btn btn-xs" href="/api/tasks/export">
          CSVエクスポート
        </a>
        <TaskCsvImportButton />
      </div>
    </main>
  );
}
