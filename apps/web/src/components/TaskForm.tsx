"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export interface TaskFormCategory {
  id: string;
  name: string;
}

export interface TaskFormValues {
  name: string;
  categoryId: string;
  repeatUnit: "DAY" | "WEEK" | "MONTH" | "YEAR";
  repeatInterval: number;
  firstDueAt: string;
  notificationEnabled: boolean;
  notificationTime: string;
  preNotificationDays: number;
  priority: "HIGH" | "MEDIUM" | "LOW";
  memo: string;
}

const DEFAULT_VALUES: TaskFormValues = {
  name: "",
  categoryId: "",
  repeatUnit: "MONTH",
  repeatInterval: 1,
  firstDueAt: new Date().toISOString().slice(0, 10),
  notificationEnabled: true,
  notificationTime: "09:00",
  preNotificationDays: 0,
  priority: "MEDIUM",
  memo: "",
};

interface TaskFormProps {
  categories: TaskFormCategory[];
  initialValues?: Partial<TaskFormValues>;
  mode: "create" | "edit";
  taskId?: string;
}

export function TaskForm({ categories, initialValues, mode, taskId }: TaskFormProps): JSX.Element {
  const router = useRouter();
  const [values, setValues] = useState<TaskFormValues>({ ...DEFAULT_VALUES, ...initialValues });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function update<K extends keyof TaskFormValues>(key: K, value: TaskFormValues[K]): void {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const payload = {
      name: values.name,
      categoryId: values.categoryId || null,
      repeatUnit: values.repeatUnit,
      repeatInterval: Number(values.repeatInterval),
      firstDueAt: values.firstDueAt,
      notificationEnabled: values.notificationEnabled,
      notificationTime: values.notificationTime,
      preNotificationDays: Number(values.preNotificationDays),
      priority: values.priority,
      memo: values.memo || null,
    };

    try {
      const url = mode === "create" ? "/api/tasks" : `/api/tasks/${taskId}`;
      const method = mode === "create" ? "POST" : "PATCH";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body: { error?: string } = await res.json().catch(() => ({}));
        setError(body.error ?? "保存に失敗しました");
        return;
      }

      const body: { task: { id: string } } = await res.json();
      router.push(`/tasks/${body.task.id}`);
      router.refresh();
    } catch {
      setError("通信エラーが発生しました。ネットワークをご確認ください。");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      <label>
        タスク名
        <input
          type="text"
          required
          maxLength={100}
          value={values.name}
          onChange={(e) => update("name", e.target.value)}
        />
      </label>

      <label>
        カテゴリ
        <select value={values.categoryId} onChange={(e) => update("categoryId", e.target.value)}>
          <option value="">未分類</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>

      <label>
        繰り返し
        <div className="inline-fields">
          <select
            value={values.repeatUnit}
            onChange={(e) => update("repeatUnit", e.target.value as TaskFormValues["repeatUnit"])}
          >
            <option value="DAY">日ごと</option>
            <option value="WEEK">週ごと</option>
            <option value="MONTH">か月ごと</option>
            <option value="YEAR">年ごと</option>
          </select>
          <input
            type="number"
            min={1}
            max={365}
            required
            value={values.repeatInterval}
            onChange={(e) => update("repeatInterval", Number(e.target.value))}
          />
        </div>
      </label>

      <label>
        初回予定日
        <input
          type="date"
          required
          value={values.firstDueAt}
          onChange={(e) => update("firstDueAt", e.target.value)}
        />
      </label>

      <label>
        優先度
        <select
          value={values.priority}
          onChange={(e) => update("priority", e.target.value as TaskFormValues["priority"])}
        >
          <option value="HIGH">高</option>
          <option value="MEDIUM">中</option>
          <option value="LOW">低</option>
        </select>
      </label>

      <label className="checkbox-label">
        <input
          type="checkbox"
          checked={values.notificationEnabled}
          onChange={(e) => update("notificationEnabled", e.target.checked)}
        />
        通知を有効にする
      </label>

      <label>
        通知時刻
        <input
          type="time"
          value={values.notificationTime}
          onChange={(e) => update("notificationTime", e.target.value)}
          disabled={!values.notificationEnabled}
        />
      </label>

      <label>
        事前通知（何日前に知らせるか）
        <input
          type="number"
          min={0}
          max={30}
          value={values.preNotificationDays}
          onChange={(e) => update("preNotificationDays", Number(e.target.value))}
          disabled={!values.notificationEnabled}
        />
      </label>

      <label>
        メモ
        <textarea
          rows={4}
          maxLength={2000}
          value={values.memo}
          onChange={(e) => update("memo", e.target.value)}
        />
      </label>

      {error && <p className="error-text">{error}</p>}

      <button className="btn btn-primary" type="submit" disabled={submitting}>
        {submitting ? "保存中..." : mode === "create" ? "登録する" : "保存する"}
      </button>
    </form>
  );
}
