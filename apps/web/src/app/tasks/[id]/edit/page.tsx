import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { formatDateOnly } from "@upkeep/core";
import { authOptions } from "@/server/auth";
import { prisma } from "@upkeep/db";
import { TaskForm } from "@/components/TaskForm";

export default async function EditTaskPage({
  params,
}: {
  params: { id: string };
}): Promise<JSX.Element> {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) {
    notFound();
  }

  const [task, categories] = await Promise.all([
    prisma.task.findFirst({ where: { id: params.id, userId } }),
    prisma.category.findMany({ where: { userId }, orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }] }),
  ]);

  if (!task) {
    notFound();
  }

  return (
    <main className="page">
      <h1>タスク編集</h1>
      <TaskForm
        mode="edit"
        taskId={task.id}
        categories={categories}
        initialValues={{
          name: task.name,
          categoryId: task.categoryId ?? "",
          repeatUnit: task.repeatUnit,
          repeatInterval: task.repeatInterval,
          firstDueAt: formatDateOnly(task.firstDueAt),
          notificationEnabled: task.notificationEnabled,
          notificationTime: task.notificationTime,
          preNotificationDays: task.preNotificationDays,
          priority: task.priority,
          memo: task.memo ?? "",
        }}
      />
    </main>
  );
}
