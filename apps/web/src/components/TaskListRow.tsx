"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { TaskListItem, type TaskListItemData } from "./TaskListItem";
import { DeleteTaskButton } from "./DeleteTaskButton";
import { SnoozeButton } from "./SnoozeButton";

/**
 * タスク一覧画面の1行。
 * 通常時は「完了」「後で」、編集モード時は「編集」「削除」を表示する
 * （切り替えは親のTaskListViewが持つeditModeで制御）。
 */
export function TaskListRow({
  task,
  editMode,
}: {
  task: TaskListItemData;
  editMode: boolean;
}): JSX.Element {
  const router = useRouter();
  const [completing, setCompleting] = useState(false);

  async function handleComplete(): Promise<void> {
    setCompleting(true);
    try {
      const res = await fetch(`/api/tasks/${task.id}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        window.alert("完了処理に失敗しました");
        return;
      }
      router.refresh();
    } catch {
      window.alert("通信エラーが発生しました");
    } finally {
      setCompleting(false);
    }
  }

  return (
    <div className="task-row">
      <TaskListItem task={task} showStatus />
      <div className="task-row-actions">
        {editMode ? (
          <>
            <Link className="btn btn-sm" href={`/tasks/${task.id}/edit`}>
              編集
            </Link>
            <DeleteTaskButton taskId={task.id} taskName={task.name} compact />
          </>
        ) : (
          <>
            <button
              className="btn btn-sm btn-primary"
              type="button"
              onClick={handleComplete}
              disabled={completing}
            >
              {completing ? "処理中" : "完了"}
            </button>
            <SnoozeButton taskId={task.id} compact />
          </>
        )}
      </div>
    </div>
  );
}
