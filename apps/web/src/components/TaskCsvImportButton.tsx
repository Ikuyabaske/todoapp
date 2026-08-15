"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

interface ImportResult {
  imported: number;
  errors: { row: number; name: string; error: string }[];
}

export function TaskCsvImportButton(): JSX.Element {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }
    setPending(true);
    setError(null);
    setResult(null);
    try {
      const text = await file.text();
      const res = await fetch("/api/tasks/import", {
        method: "POST",
        headers: { "Content-Type": "text/csv; charset=utf-8" },
        body: text,
      });
      const body: ImportResult | { error?: string } = await res.json();
      if (!res.ok) {
        setError("error" in body && body.error ? body.error : "インポートに失敗しました");
        return;
      }
      setResult(body as ImportResult);
      router.refresh();
    } catch {
      setError("通信エラーが発生しました");
    } finally {
      setPending(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  return (
    <div className="csv-import">
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        id="csv-import-input"
        className="csv-import-input"
        onChange={handleFileChange}
        disabled={pending}
      />
      <label htmlFor="csv-import-input" className="btn btn-xs">
        {pending ? "取込中..." : "CSVインポート"}
      </label>
      {error && <p className="error-text">{error}</p>}
      {result && (
        <p className="muted">
          {result.imported}件取込みました
          {result.errors[0] &&
            `（${result.errors.length}件失敗: ${result.errors[0].row}行目「${result.errors[0].error}」等）`}
        </p>
      )}
    </div>
  );
}
