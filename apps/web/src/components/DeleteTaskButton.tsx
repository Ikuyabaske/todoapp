"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeleteTaskButton({ taskId, taskName }: { taskId: string; taskName: string }): JSX.Element {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleDelete(): Promise<void> {
    if (!window.confirm(`「${taskName}」を削除します。完了履歴も含めて元に戻せません。よろしいですか？`)) {
      return;
    }
    setPending(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
      if (!res.ok) {
        window.alert("削除に失敗しました");
        return;
      }
      router.push("/tasks");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <button className="btn btn-danger" type="button" onClick={handleDelete} disabled={pending}>
      {pending ? "削除中..." : "削除"}
    </button>
  );
}
