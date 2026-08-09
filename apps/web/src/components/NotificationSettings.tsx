"use client";

import { useEffect, useState } from "react";
import { urlBase64ToUint8Array } from "@/lib/push";

type Status = "checking" | "unsupported" | "denied" | "subscribed" | "unsubscribed";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

export function NotificationSettings(): JSX.Element {
  const [status, setStatus] = useState<Status>("checking");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    void refreshStatus();
  }, []);

  async function refreshStatus(): Promise<void> {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setStatus("unsupported");
      return;
    }
    if (Notification.permission === "denied") {
      setStatus("denied");
      return;
    }
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setStatus(subscription ? "subscribed" : "unsubscribed");
    } catch {
      setStatus("unsubscribed");
    }
  }

  async function handleEnable(): Promise<void> {
    setBusy(true);
    setMessage(null);
    try {
      if (!VAPID_PUBLIC_KEY) {
        setMessage("VAPID公開鍵が設定されていません（サーバー管理者に確認してください）");
        return;
      }

      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("denied");
        setMessage("通知が許可されませんでした。ブラウザの設定から許可してください。");
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        // TSの型定義上ArrayBuffer/SharedArrayBufferの扱いでUint8Arrayが
        // BufferSourceと厳密一致しないため、.bufferで明示的にArrayBufferへ変換する。
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY).buffer as ArrayBuffer,
      });

      const json = subscription.toJSON();
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys }),
      });
      if (!res.ok) {
        throw new Error("サーバーへの登録に失敗しました");
      }

      setStatus("subscribed");
      setMessage("通知を有効にしました。");
    } catch (error) {
      console.error("[push] 有効化に失敗:", error);
      setMessage("通知の有効化に失敗しました。");
    } finally {
      setBusy(false);
    }
  }

  async function handleDisable(): Promise<void> {
    setBusy(true);
    setMessage(null);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
        await subscription.unsubscribe();
      }
      setStatus("unsubscribed");
      setMessage("通知を無効にしました。");
    } catch (error) {
      console.error("[push] 無効化に失敗:", error);
      setMessage("通知の無効化に失敗しました。");
    } finally {
      setBusy(false);
    }
  }

  async function handleTest(): Promise<void> {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/push/test", { method: "POST" });
      const body: { sent?: number; total?: number; error?: string } = await res.json();
      if (!res.ok) {
        setMessage(body.error ?? "テスト通知の送信に失敗しました");
        return;
      }
      setMessage(`テスト通知を送信しました（${body.sent}/${body.total}台）。数秒以内に届きます。`);
    } catch {
      setMessage("テスト通知の送信に失敗しました");
    } finally {
      setBusy(false);
    }
  }

  if (status === "checking") {
    return <p className="muted">確認中...</p>;
  }

  if (status === "unsupported") {
    return (
      <p className="muted">
        このブラウザはPush通知に対応していません。iPhoneの場合はホーム画面に追加してから開いてください。
      </p>
    );
  }

  if (status === "denied") {
    return <p className="muted">通知がブロックされています。ブラウザの設定から許可してください。</p>;
  }

  return (
    <div>
      <p className="muted">
        状態: {status === "subscribed" ? "✅ 通知が有効です" : "通知は無効です"}
      </p>
      <div className="actions">
        {status === "subscribed" ? (
          <>
            <button className="btn" type="button" onClick={handleDisable} disabled={busy}>
              通知を無効にする
            </button>
            <button className="btn btn-primary" type="button" onClick={handleTest} disabled={busy}>
              テスト通知を送信
            </button>
          </>
        ) : (
          <button className="btn btn-primary" type="button" onClick={handleEnable} disabled={busy}>
            通知を有効にする
          </button>
        )}
      </div>
      {message && <p className="muted">{message}</p>}
    </div>
  );
}
