#!/usr/bin/env bash
# Upkeep - PostgreSQLリストアスクリプト
#
# 使い方:
#   ./scripts/restore.sh backups/upkeep_20260101_030000.sql.gz
#
# 注意: 実行すると既存のデータは上書きされます。
#       本番環境で実行する前に、必ず現状も ./scripts/backup.sh でバックアップしてください。

set -euo pipefail
cd "$(dirname "$0")/.."

FILE="${1:?使い方: ./scripts/restore.sh <バックアップファイル.sql.gz>}"

if [ ! -f "${FILE}" ]; then
  echo "ファイルが見つかりません: ${FILE}" >&2
  exit 1
fi

if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

: "${POSTGRES_USER:?POSTGRES_USERが.envに設定されていません}"
: "${POSTGRES_DB:?POSTGRES_DBが.envに設定されていません}"

echo "[restore] ${FILE} からリストアします。既存データは上書きされます。"
read -r -p "続行しますか？ (yes/no): " CONFIRM
if [ "${CONFIRM}" != "yes" ]; then
  echo "中止しました。"
  exit 1
fi

gunzip -c "${FILE}" | docker compose exec -T db psql -U "${POSTGRES_USER}" "${POSTGRES_DB}"
echo "[restore] 完了しました。"
