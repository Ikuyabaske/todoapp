# Upkeep

「予定日」ではなく「実際に完了した日」を基準に次回予定日を計算する、定期メンテナンス管理・通知Webアプリです。
自宅Linuxサーバー上でDocker Composeにより稼働し、Cloudflare Tunnel経由でHTTPS公開、
AndroidとiPhoneの両方にPWA + Web Pushで通知します。

> 実装は `docs/architecture.md` のPhase計画に沿って段階的に進めています。
> 各セクションは対応するPhaseの実装が完了次第、随時追記しています。

## 技術構成

- OS: Linux / Docker / Docker Compose
- Frontend: Next.js (App Router) + React + TypeScript
- Database: PostgreSQL + Prisma
- 認証: Auth.js (NextAuth v4, Credentials Provider)
- PWA: Service Worker + Web Manifest + Web Push (VAPID)
- 外部公開: Cloudflare Tunnel

## 必要環境

- Docker / Docker Compose v2 以降
- （ローカル開発をnpmで直接行う場合）Node.js 20 以降

## 初回セットアップ

```bash
git clone <このリポジトリ>
cd upkeep
cp .env.example .env
# .env を編集し、パスワード・シークレットを必ず変更してください
```

### Docker Composeで起動する

```bash
docker compose build

# 初回のみ / スキーマ変更時: マイグレーション適用 & 初期ユーザー/カテゴリのseed
# (appの実行用イメージは軽量化のためPrisma CLIを含まないため、
#  専用の一回限りのコンテナ(migrateサービス)で実行する)
docker compose --profile tools run --rm migrate

docker compose up -d
```

ブラウザで `http://localhost:3000` にアクセスし、`.env` の `ADMIN_EMAIL` / `ADMIN_PASSWORD` でログインできれば起動成功です。

### ローカル開発（Dockerなしでnpmを直接使う場合）

PostgreSQLだけDockerで立て、Next.jsはホストで直接動かす方法です。

```bash
# DBだけ起動
docker compose up -d db

npm install
# .env の DATABASE_URL を localhost 向けに変更しておくこと
#   postgresql://upkeep:xxxx@localhost:5432/upkeep
npm run db:migrate:dev
npm run db:seed
npm run dev:web
```

`http://localhost:3000` で確認できます。

## .env設定

`.env.example` を参照してください。本番運用前に必ず以下を変更してください。

- `POSTGRES_PASSWORD`
- `NEXTAUTH_SECRET`（`openssl rand -base64 32` で生成）
- `ADMIN_EMAIL` / `ADMIN_PASSWORD`

VAPIDキー・Cloudflare Tunnel Tokenの設定方法は、それぞれ実装が完了するPhase 7・Phase 9のタイミングで本READMEに追記します。

## テスト

日付計算ロジック（`packages/core`）はDB非依存のためユニットテストで検証できます。

```bash
npm install
npm run test --workspace packages/core
```

繰り返し計算（月末クランプ・閏年・年またぎ・完了日基準の計算）をカバーしています。

## 現在の実装状況

- [x] Phase 1: Docker Compose / PostgreSQL / Next.js / Prisma / 基本画面
- [x] Phase 2: タスクCRUD
- [x] Phase 3: 繰り返し計算
- [ ] Phase 4: 完了履歴
- [ ] Phase 5: ホーム画面分類
- [ ] Phase 6: PWA化
- [ ] Phase 7: Web Push
- [ ] Phase 8: scheduler
- [ ] Phase 9: Cloudflare Tunnel
- [ ] Phase 10: セキュリティ・README・テスト
