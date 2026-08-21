"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export interface CategoryManagerItem {
  id: string;
  name: string;
}

/**
 * 「ビジネス用」「勉強用」「家のこと」のようにユーザーが自由にカテゴリ（タブ）を
 * 追加・削除できるようにする設定画面用コンポーネント。
 */
export function CategoryManager({ categories }: { categories: CategoryManagerItem[] }): JSX.Element {
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleAdd(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) {
        const body: { error?: string } = await res.json().catch(() => ({}));
        setError(body.error ?? "追加に失敗しました");
        return;
      }
      setName("");
      router.refresh();
    } catch {
      setError("通信エラーが発生しました");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(category: CategoryManagerItem): Promise<void> {
    if (
      !window.confirm(
        `「${category.name}」を削除します。このカテゴリのタスクは未分類になります。よろしいですか？`
      )
    ) {
      return;
    }
    setDeletingId(category.id);
    try {
      const res = await fetch(`/api/categories/${category.id}`, { method: "DELETE" });
      if (!res.ok) {
        window.alert("削除に失敗しました");
        return;
      }
      router.refresh();
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      {categories.length === 0 ? (
        <p className="muted">カテゴリはまだありません。</p>
      ) : (
        <ul className="category-manage-list">
          {categories.map((c) => (
            <li key={c.id} className="category-manage-row">
              <span>{c.name}</span>
              <button
                type="button"
                className="btn btn-sm btn-danger"
                onClick={() => handleDelete(c)}
                disabled={deletingId === c.id}
              >
                {deletingId === c.id ? "削除中..." : "削除"}
              </button>
            </li>
          ))}
        </ul>
      )}

      <form className="inline-fields" onSubmit={handleAdd} style={{ marginTop: 10 }}>
        <input
          type="text"
          placeholder="新しいカテゴリ名（例: ビジネス用）"
          maxLength={50}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <button className="btn btn-primary btn-sm" type="submit" disabled={submitting}>
          {submitting ? "追加中..." : "追加"}
        </button>
      </form>
      {error && <p className="error-text">{error}</p>}
    </div>
  );
}
