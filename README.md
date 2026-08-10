# Upkeep

「予定日」ではなく「実際に完了した日」を基準に次回予定日を計算する、定期メンテナンス管理・通知Webアプリです。
一般的なTodoアプリと異なり、フィルター交換・車検・エアコン掃除のような「終わりのない定期作業」の管理に特化しています。

自宅Linuxサーバー上でDocker Composeにより稼働し、Cloudflare Tunnel経由でHTTPS公開、
AndroidとiPhoneの両方にPWA + Web Pushで通知を届けます。外部バックエンドサービス（Firebase/Supabase等）には依存せず、
自宅サーバー内で完結する構成です。

## 目次

- [技術構成](#技術構成)
- [システム構成](#システム構成)
- [必要環境](#必要環境)
- [初回セットアップ](#初回セットアップ)
- [.env設定](#env設定)
- [VAPIDキーの生成（Web Push用）](#vapidキーの生成web-push用)
- [Prisma Migration](#prisma-migration)
- [Docker起動方法](#docker起動方法)
- [Cloudflare Tunnel設定方法](#cloudflare-tunnel設定方法)
- [PWAとしてインストール](#pwaとしてインストール)
- [Androidでの使い方](#androidでの使い方)
- [iPhoneでの使い方](#iphoneでの使い方)
- [Push通知設定方法](#push通知設定方法)
- [DBバックアップ方法](#dbバックアップ方法)
- [セキュリティ](#セキュリティ)
- [テスト](#テスト)
- [トラブルシューティング](#トラブルシューティング)
- [将来的な拡張](#将来的な拡張)
- [開発フェーズの進捗](#開発フェーズの進捗)

## 技術構成

- OS: Linux / Docker / Docker Compose
- Frontend: Next.js 14 (App Router) + React + TypeScript
- Database: PostgreSQL + Prisma
- 認証: Auth.js (NextAuth v4, Credentials Provider)
- PWA: Service Worker + Web Manifest + Web Push (VAPID)
- 外部公開: Cloudflare Tunnel
- モノレポ構成: npm workspaces（`apps/web`, `apps/scheduler`, `packages/core`, `packages/db`）

日付計算・通知判定ロジックは `packages/core` にDB非依存の純粋関数として実装し、vitestでユニットテストしています
（詳細設計は [`docs/architecture.md`](docs/architecture.md) を参照）。

## システム構成

```
[Android/iPhone]
   └─ PWA (ホーム画面アイコン, standalone)
        │ HTTPS
        ▼
   [Cloudflare Edge] ── Cloudflare Tunnel（アウトバウンド接続のみ、ルーターのポート開放なし）
        │
        ▼
   [自宅Linuxサーバー: Docker Compose]
        ├─ cloudflared  ──▶ http://app:3000
        ├─ app (Next.js: 画面 + API + PWA配信)
        ├─ scheduler (5分毎に通知対象タスクをチェックしPush送信)
        └─ db (PostgreSQL, named volumeで永続化・外部非公開)
```

## 必要環境

- Docker / Docker Compose v2 以降
- （ローカル開発をDocker無しでnpm直接実行する場合）Node.js 20 以降
- Cloudflareに登録済みの独自ドメイン（外部公開する場合のみ）

## 初回セットアップ

```bash
git clone <このリポジトリ>
cd upkeep
cp .env.example .env
# .env を編集し、パスワード・シークレット・VAPIDキーを設定してください（後述）
```

## .env設定

`.env.example` を参照してください。本番運用前に必ず以下を変更してください。

| 変数 | 説明 |
| --- | --- |
| `POSTGRES_PASSWORD` | DBパスワード。強力なランダム文字列に変更する |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` で生成する |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | 初回seedで作成される管理者ユーザー |
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | 下記「VAPIDキーの生成」を参照 |
| `CLOUDFLARE_TUNNEL_TOKEN` | 下記「Cloudflare Tunnel設定方法」を参照 |

秘密情報を含む `.env` はGit管理しません（`.gitignore`済み）。コミットされるのはプレースホルダのみの `.env.example` だけです。

## VAPIDキーの生成（Web Push用）

Push通知にはVAPID鍵ペアが必要です。以下で生成し、`.env`の該当項目に設定してください。

```bash
npx web-push generate-vapid-keys
```

出力された `publicKey` を `VAPID_PUBLIC_KEY` と `NEXT_PUBLIC_VAPID_PUBLIC_KEY` の**両方**に、
`privateKey` を `VAPID_PRIVATE_KEY` に設定します。

> ⚠️ `NEXT_PUBLIC_VAPID_PUBLIC_KEY` はNext.jsのビルド時にクライアントJSへ埋め込まれます。
> 値を変更した場合は `docker compose up -d` だけでは反映されないため、
> **必ず `docker compose build app` からやり直してください。**

## Prisma Migration

スキーマ変更後や初回セットアップ時は、専用の一回限りのコンテナ（`migrate`サービス）でマイグレーションを適用します。
`app` の実行用イメージは軽量化のためPrisma CLIを含んでいないため、このコンテナを使います。

```bash
docker compose --profile tools run --rm migrate
```

内部で以下を実行しています（`prisma migrate deploy` → seed投入）。

```bash
npx prisma migrate deploy --schema prisma/schema.prisma
npx tsx prisma/seed.ts
```

開発中にスキーマを変更した場合は、ローカル環境（Node.js直接実行）で以下を使ってマイグレーションファイルを生成します。

```bash
npm run db:migrate:dev   # prisma migrate dev（マイグレーションファイルを新規作成）
```

生成された `packages/db/prisma/migrations/` 以下のファイルはGit管理し、本番では `migrate deploy` で適用します。

## Docker起動方法

```bash
docker compose build
docker compose --profile tools run --rm migrate   # 初回 / スキーマ変更時のみ
docker compose up -d
```

ブラウザで `http://localhost:3000` にアクセスし、`.env` の `ADMIN_EMAIL` / `ADMIN_PASSWORD` でログインできれば起動成功です
（`app` は `127.0.0.1:3000` にのみバインドされており、サーバー内からの動作確認用です。外部公開はCloudflare Tunnel経由のみで行います）。

停止する場合:

```bash
docker compose down       # コンテナを停止・削除（DBデータは保持）
docker compose down -v    # DBデータも含めて完全に削除する場合のみ
```

### ローカル開発（Dockerなしでnpmを直接使う場合）

PostgreSQLだけDockerで立て、Next.jsはホストで直接動かす方法です。Push通知については後述の注意点を参照してください。

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

> **Push通知とlocalhostの違い**: Push通知(Service Worker)はセキュリティ上、HTTPSまたは`localhost`でのみ動作します。
> ローカル開発中(`npm run dev:web`)は`http://localhost:3000`なのでPush通知の購読・受信ともに動作しますが、
> スマートフォンの実機からは`localhost`にアクセスできないため確認できません。実機での動作確認には、
> Docker Compose + Cloudflare Tunnel経由で実際にHTTPS公開する必要があります。

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
   - URL: `app:3000`（docker-compose内のサービス名とポート。DNSレコードはCloudflareが自動作成される）
6. サーバー側で起動する

   ```bash
   docker compose up -d
   ```

7. `https://tasks.example.com`（設定したドメイン）にアクセスできれば成功

`CLOUDFLARE_TUNNEL_TOKEN` が未設定の場合、`cloudflared` コンテナは起動に失敗し再起動を繰り返しますが、
`app`/`db`/`scheduler` の動作には影響しません。ローカル開発時はそのままで問題ありません。

## PWAとしてインストール

ホーム画面に追加すると、アプリのようにフルスクリーン（standalone）で起動でき、Push通知も受け取れるようになります。
アプリ内の `/settings` 画面にインストール案内を表示しています。

## Androidでの使い方

1. Chromeで `https://tasks.example.com`（公開したURL）を開き、ログインする
2. 右上メニュー（︙）から「ホーム画面に追加」、または `/settings` 画面の「ホーム画面に追加」ボタンをタップ
3. ホーム画面のアイコンから起動すると、standalone表示（アドレスバー無し）で開く
4. `/settings` 画面で「通知を有効にする」をタップし、通知の許可を求められたら「許可」を選択する

## iPhoneでの使い方

iOSでは **必ずSafariでホーム画面に追加してから起動したPWA上でのみ** Push通知が利用できます
（Safariのタブとして開いたままでは通知を購読できません）。

1. Safariで `https://tasks.example.com` を開き、ログインする
2. 共有ボタン（□に↑のアイコン）をタップし、「ホーム画面に追加」を選択
3. ホーム画面に追加されたアイコンから起動する（standalone表示になります）
4. アプリ内の `/settings` 画面で「通知を有効にする」をタップし、通知の許可ダイアログで「許可」を選択する

## Push通知設定方法

1. `/settings` 画面を開く
2. 「通知を有効にする」ボタンをタップ → ブラウザの通知許可ダイアログで「許可」を選択
3. 購読情報がサーバーに登録され、「✅ 通知が有効です」と表示される
4. 「テスト通知を送信」ボタンで、実際にPush通知が届くか確認できる（schedulerの5分待ちを待たずに確認可能）
5. 通知が不要になったら「通知を無効にする」で購読を解除できる

タスク側の設定（登録・編集画面）では、タスクごとに以下を個別に設定できます。

- 通知ON/OFF
- 通知時刻（JST）
- 事前通知日数（期限の何日前から知らせるか）

## DBバックアップ方法

```bash
./scripts/backup.sh                # ./backups/ にgzip圧縮したpg_dumpを作成（7日より古いものは自動削除）
./scripts/backup.sh /path/to/dir   # 出力先を変更する場合
```

cronで定期実行する例（毎日3:00に実行）:

```
0 3 * * * cd /path/to/upkeep && ./scripts/backup.sh >> ./backups/backup.log 2>&1
```

リストアする場合:

```bash
./scripts/restore.sh backups/upkeep_20260101_030000.sql.gz
```

`--clean --if-exists` 付きでダンプしているため、既にマイグレーション済みのDBに対してもそのままリストアできます
（既存データは上書きされるため、実行前に確認プロンプトが表示されます）。

## セキュリティ

- **HTTPS**: Cloudflare Tunnel経由でのみ外部公開し、通信はCloudflareがTLS終端する
- **DB非公開**: `db`サービスはポートを一切公開せず、Docker内部ネットワークからのみアクセス可能
- **環境変数管理**: 秘密情報は`.env`（Git管理外）に集約。コミットされるのはプレースホルダのみの`.env.example`
- **API認証**: すべてのAPIは`requireUserId()`でセッションを検証（未ログイン時はJSON 401を返す）。画面側は`middleware.ts`でも二重に保護
- **データ分離**: Task/Category/PushSubscription等はすべて`userId`で絞り込み、他ユーザーのデータへは構造的にアクセス不可（所有権チェックを個別関数化）
- **Push購読情報の保護**: 購読の登録・削除ともに認証必須。エンドポイント文字列は本人にのみ紐づく
- **CSRF**: Auth.jsの認証フローは標準でCSRFトークンを検証。API本体はCookieの`SameSite=Lax`により、他サイトからのクロスオリジンなPOST/PATCH/DELETEではCookieが送出されないため保護される
- **XSS**: Reactの自動エスケープに依存し、`dangerouslySetInnerHTML`は使用していない
- **SQL Injection**: すべてPrisma経由のパラメータ化クエリで、生SQL(`$queryRaw`等)は使用していない
- **Rate Limit**: ログイン試行はメールアドレス単位で5分間に10回まで（それ以降はロックアウト）。API全体もログインユーザー単位で1分間120リクエストまでに制限（インメモリ実装のため、単一`app`インスタンス運用が前提）
- **秘密鍵管理**: VAPID秘密鍵・DBパスワード・Cloudflare Tunnel Tokenはすべて`.env`のみで管理し、Gitには一切コミットしない

## テスト

日付計算・通知判定ロジック（`packages/core`）はDB非依存のためユニットテストで検証できます。

```bash
npm install
npm run test --workspace packages/core
```

以下を重点的にカバーしています。

- 繰り返し日付計算（月末クランプ、閏年、年またぎ）
- 完了日基準の次回予定日計算（予定日と実際の完了日が異なる場合）
- スヌーズしても本来の期限が変わらないこと
- 通知の重複送信防止（同一タスク・同一種別・同一日の判定）

## トラブルシューティング

**`docker compose up -d` 後、`app` が起動しない**
`docker compose logs app` でエラーを確認してください。多くの場合、`migrate`の未実行（DBスキーマ未作成）か、`.env`の`DATABASE_URL`の誤りです。

**ログインできない**
`.env`の`ADMIN_EMAIL`/`ADMIN_PASSWORD`が、`migrate`実行時にseedされた値と一致しているか確認してください。
パスワードを変更したい場合は`.env`を更新後、`docker compose --profile tools run --rm migrate`を再実行してください（seedはupsertのため安全に再実行できます）。
短時間に何度もログインに失敗すると一時的にロックアウトされます（5分間で自動解除）。

**Push通知が届かない**
- `/settings`画面で「✅ 通知が有効です」になっているか確認する
- iPhoneの場合、Safariのタブではなく必ずホーム画面に追加したアプリから開いているか確認する
- `.env`の`VAPID_PUBLIC_KEY`/`VAPID_PRIVATE_KEY`/`NEXT_PUBLIC_VAPID_PUBLIC_KEY`が正しく設定され、`docker compose build app`を再実行済みか確認する
- `docker compose logs scheduler`で送信エラーが出ていないか確認する

**Cloudflare Tunnelがつながらない**
`docker compose logs cloudflared`を確認してください。`CLOUDFLARE_TUNNEL_TOKEN`が空、またはCloudflareダッシュボード側のPublic Hostname設定（URL: `app:3000`）が誤っている可能性があります。

**PostgreSQLのデータが消えた**
`docker compose down -v`はDBのnamed volumeごと削除します。データを残したまま停止したい場合は`docker compose down`（`-v`無し）を使ってください。

## 将来的な拡張

以下は現時点のMVPには含めていませんが、`userId`によるデータ分離やモノレポ構成により後から追加しやすい設計にしています。

家族共有 / タスク担当者 / テンプレート / AIによるタスク提案・自然言語登録 / 季節タスク / メール・Discord・LINE通知 / 実施率ダッシュボード / カレンダー表示 / 1日未満（時間単位）の繰り返し・通知

## 開発フェーズの進捗

- [x] Phase 1: Docker Compose / PostgreSQL / Next.js / Prisma / 基本画面
- [x] Phase 2: タスクCRUD
- [x] Phase 3: 繰り返し計算
- [x] Phase 4: 完了履歴・スヌーズ
- [x] Phase 5: ホーム画面分類
- [x] Phase 6: PWA化
- [x] Phase 7: Web Push
- [x] Phase 8: scheduler
- [x] Phase 9: Cloudflare Tunnel
- [x] Phase 10: セキュリティ・README・テスト

詳細な設計方針は [`docs/architecture.md`](docs/architecture.md) を参照してください。
