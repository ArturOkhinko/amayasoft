#!/usr/bin/env bash
# Обновление продакшена на сервере: ./deploy/deploy.sh
set -euo pipefail
cd "$(dirname "$0")/.."

git pull
docker build -t paywall .
docker rm -f paywall 2>/dev/null || true
docker run -d --name paywall --restart unless-stopped \
  -p 127.0.0.1:3000:3000 \
  -v /opt/paywall-data:/data \
  paywall
docker image prune -f
echo "OK: $(curl -s http://127.0.0.1:3000/api/offers | head -c 80)…"
