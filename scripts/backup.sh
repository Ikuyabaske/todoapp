#!/usr/bin/env bash
# Upkeep - PostgreSQLバックアップスクリプト
#
# 使い方:
#   ./scripts/backup.sh [出力先ディレクトリ(既定: ./backups)]
#
# cronで定期実行する例(毎日3:00に実行し、7日より古いバックアップは自動削除):
#   0 3 * * * cd /path/to/upkeep && ./scripts/backup.sh >> ./backups/backup.log 2>&1

set -euo pipefail
cd "$(dirname "$0")/.."

OUT_DIR="${1:-./backups}"
mkdir -p "$OUT_DIR"

if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

: "${POSTGRES_USER:?POSTGRES_USERが.envに設定されていません}"
: "${POSTGRES_DB:?POSTGRES_DBが.envに設定されていません}"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
FILE="${OUT_DIR}/upkeep_${TIMESTAMP}.sql.gz"

echo "[backup] ${FILE} へバックアップを作成します..."
# --clean --if-exists: リストア時に既存オブジェクトを先にDROPしてから再作成する。
# これにより「既にマイグレーション済みのDBへリストアするとエラーになる」問題を避ける。
docker compose exec -T db pg_dump -U "${POSTGRES_USER}" --clean --if-exists "${POSTGRES_DB}" | gzip > "${FILE}"
echo "[backup] 完了: $(du -h "${FILE}" | cut -f1)"

# 7日より古いバックアップは自動削除する(ディスク圧迫防止)。
find "${OUT_DIR}" -name 'upkeep_*.sql.gz' -mtime +7 -delete
