#!/usr/bin/env bash
# Deploy "pull": roda na VPS por um systemd timer (a cada ~1 min).
# Verifica se há commit novo na origin/main; se houver, dispara o setup.sh.
# Substitui o deploy via SSH do GitHub, que era bloqueado de forma
# intermitente pelo firewall do provedor (timeout na porta 22).
# Só depende de a VPS ALCANÇAR o GitHub (outbound), que funciona.
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/moadir}"
git config --global --add safe.directory "$APP_DIR" 2>/dev/null || true
cd "$APP_DIR"

# fetch silencioso; se a rede falhar, sai sem erro (tenta de novo no próximo tick)
git fetch --quiet origin main || exit 0

LOCAL="$(git rev-parse HEAD)"
REMOTE="$(git rev-parse origin/main)"

if [ "$LOCAL" != "$REMOTE" ]; then
  echo "$(date -Is) commit novo ${REMOTE:0:7} (estava em ${LOCAL:0:7}) — deployando"
  bash "$APP_DIR/deploy/setup.sh"
else
  echo "$(date -Is) sem mudancas (${LOCAL:0:7})"
fi
