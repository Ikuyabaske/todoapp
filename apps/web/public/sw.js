// Upkeep Service Worker

self.addEventListener("install", () => {
  // 新しいService Workerをすぐに有効化する（ページのリロードを待たない）。
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// 家庭内サーバー向けの小規模アプリのため、積極的なオフラインキャッシュ戦略は
// 採用せず「常に最新のタスク状態が見える」ことを優先する。
// fetchハンドラ自体はPWAのインストール可能性判定のために用意し、
// 通常はネットワークへそのまま委譲する。
self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request));
});

// Push通知を受信して表示する。
// ペイロードは packages/core の buildNotificationMessage / sendPushNotification が
// JSON文字列で { title, body, url } を送ってくる想定（url = タップ時に開くタスク詳細等）。
self.addEventListener("push", (event) => {
  let payload = { title: "Upkeep", body: "通知があります", url: "/" };
  try {
    if (event.data) {
      payload = { ...payload, ...event.data.json() };
    }
  } catch (error) {
    console.error("[sw] Push payloadの解析に失敗しました:", error);
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      data: { url: payload.url || "/" },
    })
  );
});

// 通知タップ時に、対応するタスク詳細画面を開く（既に開いているタブがあればそれをフォーカスする）。
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        const clientUrl = new URL(client.url);
        if (clientUrl.pathname === targetUrl && "focus" in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
      return undefined;
    })
  );
});
