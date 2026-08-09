// Upkeep Service Worker
//
// Phase 6: PWAとしてインストール可能にするための最小構成。
// Push通知の受信・表示処理(push / notificationclick イベント)はPhase 7で追加する。

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
