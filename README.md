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

## VAPIDキーの生成（Web Push用）

Push通知にはVAPID鍵ペアが必要です。以下で生成し、`.env`の該当項目に設定してください。

```bash
npx web-push generate-vapid-keys
```

出力された `publicKey` を `VAPID_PUBLIC_KEY` と `NEXT_PUBLIC_VAPID_PUBLIC_KEY` の両方に、
`privateKey` を `VAPID_PRIVATE_KEY` に設定します。`NEXT_PUBLIC_VAPID_PUBLIC_KEY` は
Next.jsのビルド時にクライアントJSへ埋め込まれるため、値を変更した場合は
**必ず `docker compose build app` からやり直してください**（`up -d` だけでは反映されません）。

## Cloudflare Tunnel設定方法

ルーターのポート開放を一切行わず、Cloudflare Tunnel経由でHTTPS公開します。

1. [Cloudflare Zero Trustダッシュボード](https://one.dash.cloudflare.com/) にログイン（Cloudflareに登録済みの独自ドメインが必要です）
2. **Networks → Tunnels → Create a tunnel** を選択し、トンネル名（例: `upkeep`）を入力
3. 接続方式は **Docker** を選択すると、`TUNNEL_TOKEN` を含む起動コマンドが表示されるので、
   トークン部分（`--token` の後の文字列）だけをコピーする
4. `.env` の `CLOUDFLARE_TUNNEL_TOKEN` に貼り付ける
5. トンネル作成画面のまま **Public Hostname** タブで以下を設定する
   - Subdomain/Domain: 公開したいドメイン（例: `tasks.example.com`）
   - Service Type: `HTTP`
   - URL: `app:3000`（docker-compose内のサービス名とポート。DNSレコードはCloudflareが自動作成）
6. サーバー側で起動する

   ```bash
   docker compose up -d
   ```

7. `https://tasks.example.com`（設定したドメイン）にアクセスできれば成功

`CLOUDFLARE_TUNNEL_TOKEN` が未設定の場合、`cloudflared` コンテナは起動に失敗し再起動を繰り返しますが、
`app`/`db`/`scheduler` の動作には影響しません。ローカル開発時はそのままで問題ありません。

## PWAとしてインストール

ブラウザで開いた後、`/settings` 画面（または各ブラウザの標準メニュー）から「ホーム画面に追加」を行うと、
アプリのようにフルスクリーン（standalone）で起動できるようになります。詳しい手順はPhase 10で本README に追記予定です。

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
- [x] Phase 4: 完了履歴・スヌーズ
- [x] Phase 5: ホーム画面分類
- [x] Phase 6: PWA化
- [x] Phase 7: Web Push
- [x] Phase 8: scheduler
- [x] Phase 9: Cloudflare Tunnel
- [ ] Phase 10: セキュリティ・README・テスト
