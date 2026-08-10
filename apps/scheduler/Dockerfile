# syntax=docker/dockerfile:1
# Upkeep - apps/scheduler Dockerfile
#
# 小規模な常駐プロセスのため、事前コンパイル(tsc/バンドル)は行わず、
# tsxでTypeScriptソースを直接実行する。これによりworkspaceパッケージ
# (@upkeep/core, @upkeep/db)間の依存解決を、Next.jsのようなバンドラ無しでも
# 単純かつ確実に行える(モノレポでのworkspace参照は実行時にsrc/*.tsを
# そのまま参照するため、tscで別途distを作ると経路がずれる問題を避けられる)。

FROM node:20-alpine AS base
WORKDIR /repo
RUN apk add --no-cache libc6-compat openssl

# ---- deps ----
FROM base AS deps
COPY package.json package-lock.json* ./
COPY apps/web/package.json apps/web/package.json
COPY apps/scheduler/package.json apps/scheduler/package.json
COPY packages/core/package.json packages/core/package.json
COPY packages/db/package.json packages/db/package.json
RUN npm install --workspaces --include-workspace-root

# ---- runner ----
FROM base AS runner
ENV NODE_ENV=production
RUN addgroup -S nodejs && adduser -S scheduler -G nodejs

COPY --chown=scheduler:nodejs package.json ./
COPY --from=deps --chown=scheduler:nodejs /repo/node_modules ./node_modules
COPY --chown=scheduler:nodejs packages/db ./packages/db
COPY --chown=scheduler:nodejs packages/core ./packages/core
COPY --chown=scheduler:nodejs apps/scheduler ./apps/scheduler

RUN npm run generate --workspace packages/db

USER scheduler
CMD ["npm", "run", "start", "--workspace", "apps/scheduler"]
