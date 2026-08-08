import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth";
import { prisma } from "@upkeep/db";
import { TaskForm } from "@/components/TaskForm";

export default async function NewTaskPage(): Promise<JSX.Element> {
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
      <h1>タスク登録</h1>
      <TaskForm mode="create" categories={categories} />
    </main>
  );
}
