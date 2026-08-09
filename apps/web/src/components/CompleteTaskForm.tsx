"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

function todayJst(): string {
  // 表示用の初期値。厳密なJST変換はサーバー側(completedAt省略時)が担うため、
  // ここではブラウザのローカル日付をそのまま初期値として使えば十分
  // (日本国内利用前提のため、ブラウザのタイムゾーンもJSTである想定)。
  return new Date().toISOString().slice(0, 10);
}

export function CompleteTaskForm({ taskId }: { taskId: string }): JSX.Element {
  const router = useRouter();
  const [completedAt, setCompletedAt] = useState(todayJst());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/tasks/${taskId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completedAt }),
      });
      if (!res.ok) {
        const body: { error?: string } = await res.json().catch(() => ({}));
        setError(body.error ?? "完了処理に失敗しました");
        return;
      }
      router.refresh();
    } catch {
      setError("通信エラーが発生しました");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="inline-fields complete-form" onSubmit={handleSubmit}>
      <input
        type="date"
        value={completedAt}
        max={todayJst()}
        onChange={(e) => setCompletedAt(e.target.value)}
        aria-label="完了日"
      />
      <button className="btn btn-primary" type="submit" disabled={submitting}>
        {submitting ? "記録中..." : "完了"}
      </button>
      {error && <p className="error-text">{error}</p>}
    </form>
  );
}
