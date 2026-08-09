"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const PRESET_LABELS = {
  ONE_HOUR: "1時間後",
  TONIGHT: "今日の夜",
  TOMORROW: "明日",
  THREE_DAYS: "3日後",
  ONE_WEEK: "1週間後",
  CUSTOM: "日付指定",
} as const;

type SnoozePreset = keyof typeof PRESET_LABELS;

export function SnoozeButton({ taskId }: { taskId: string }): JSX.Element {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [preset, setPreset] = useState<SnoozePreset>("TOMORROW");
  const [customUntil, setCustomUntil] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSnooze(): Promise<void> {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/tasks/${taskId}/snooze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          preset,
          customUntil: preset === "CUSTOM" ? customUntil : undefined,
        }),
      });
      if (!res.ok) {
        const body: { error?: string } = await res.json().catch(() => ({}));
        setError(body.error ?? "あとで設定に失敗しました");
        return;
      }
      setOpen(false);
      router.refresh();
    } catch {
      setError("通信エラーが発生しました");
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) {
    return (
      <button className="btn" type="button" onClick={() => setOpen(true)}>
        あとで
      </button>
    );
  }

  return (
    <div className="snooze-panel">
      <select value={preset} onChange={(e) => setPreset(e.target.value as SnoozePreset)}>
        {Object.entries(PRESET_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      {preset === "CUSTOM" && (
        <input
          type="datetime-local"
          value={customUntil}
          onChange={(e) => setCustomUntil(e.target.value)}
        />
      )}
      <div className="actions">
        <button className="btn btn-primary" type="button" onClick={handleSnooze} disabled={submitting}>
          {submitting ? "設定中..." : "設定する"}
        </button>
        <button className="btn" type="button" onClick={() => setOpen(false)}>
          キャンセル
        </button>
      </div>
      {error && <p className="error-text">{error}</p>}
      <p className="muted">※ 本来の期限日は変更されません。通知タイミングのみ延期します。</p>
    </div>
  );
}
