# syntax=docker/dockerfile:1
# Upkeep - apps/web (Next.js) Dockerfile
# npm workspaces のモノレポ構成に対応した multi-stage build。
# ビルドコンテキストはリポジトリルート（docker-compose.yml参照）。

FROM node:20-alpine AS base
WORKDIR /repo
RUN apk add --no-cache libc6-compat openssl

# ---- deps: 依存関係インストール（package.jsonのみコピーしてキャッシュを効かせる） ----
FROM base AS deps
COPY package.json package-lock.json* ./
COPY apps/web/package.json apps/web/package.json
COPY apps/scheduler/package.json apps/scheduler/package.json
COPY packages/core/package.json packages/core/package.json
COPY packages/db/package.json packages/db/package.json
RUN npm install --workspaces --include-workspace-root

# ---- build: Prisma Client生成 + Next.jsビルド ----
FROM base AS build
COPY --from=deps /repo/node_modules ./node_modules
COPY . .
RUN npm run generate --workspace packages/db
RUN npm run build --workspace apps/web

# ---- runner: 実行用の最小イメージ（standalone出力のみ含む） ----
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
# Prisma Query Engine (linux-musl-openssl系) の実行に必要
RUN apk add --no-cache openssl libc6-compat
RUN addgroup -S nodejs && adduser -S nextjs -G nodejs

# outputFileTracingRoot をリポジトリルートにしているため、
# standalone出力はモノレポ全体の相対パスを保った構造で生成される。
COPY --from=build --chown=nextjs:nodejs /repo/apps/web/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /repo/apps/web/.next/static ./apps/web/.next/static
COPY --from=build --chown=nextjs:nodejs /repo/apps/web/public ./apps/web/public

USER nextjs
EXPOSE 3000
CMD ["node", "apps/web/server.js"]
