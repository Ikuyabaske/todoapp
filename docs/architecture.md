# Upkeep アーキテクチャ設計

## システム構成図

```
[Android/iPhone]
   └─ PWA (ホーム画面アイコン, standalone)
        │ HTTPS
        ▼
   [Cloudflare Edge] ── Cloudflare Tunnel（アウトバウンド接続のみ、ポート開放なし）
        │
        ▼
   [自宅Linuxサーバー: Docker Compose]
        ├─ cloudflared  ──▶ http://app:3000
        ├─ app (Next.js: 画面 + API + PWA配信)
        │       └─ Prisma ──▶ db
        ├─ scheduler (Node: 5分毎に通知対象を検索し web-push 送信)
        │       └─ Prisma ──▶ db
        └─ db (PostgreSQL, named volume で永続化・外部非公開)
```

## ディレクトリ構成（npm workspaces モノレポ）

```
upkeep/
├── apps/
│   ├── web/          # Next.js（画面 + API + PWA）
│   └── scheduler/     # 通知チェック用の常駐プロセス（Phase 8）
├── packages/
│   ├── core/          # DB非依存の純粋ロジック（日付計算・通知判定, Phase 3〜）
│   └── db/            # Prisma schema + Client singleton + seed
└── docs/
```

## 日付/時刻の方針

- `@db.Date` のカラムは時刻を持たないカレンダー日付（JST基準の暦日）専用。
- `notificationTime` は `"HH:mm"` 文字列でJST壁時計を表現し、タイムゾーン変換の曖昧さを避ける。
- `snoozeUntil` のみ実時刻（UTC）。通知タイミングの上書き専用で、`nextDueAt`（本来の期限）は変更しない。
- 変換ロジックは `packages/core/src/date/timezone.ts` に集約する（Phase 3で実装）。

## 通知の重複防止

`NotificationHistory` に `@@unique([taskId, type, scheduledFor])` を設定し、
DB制約そのものを重複送信防止の最終防波堤とする（Phase 7/8）。

## 認証

Auth.js (NextAuth v4) + Credentials Provider、JWTセッション。
すべてのTask/Category等はuserIdで分離し、APIは必ずセッションのuserIdでフィルタする。
