#!/usr/bin/env bash
#
# Provisiona / atualiza o app moadir na VPS (Ubuntu/Debian).
# Roda como root. É idempotente: a 1ª vez instala tudo; nas próximas, só
# atualiza o código, rebuilda e reinicia o serviço.
#
# Uso (primeira vez, sem ter o repo ainda):
#   curl -fsSL https://raw.githubusercontent.com/marcioscar/moadir/main/deploy/setup.sh | sudo bash
#
# Uso (já clonado):
#   sudo bash /opt/moadir/deploy/setup.sh
#
# Sobrescreva variáveis na chamada, ex.:
#   sudo DOMAIN=meu.dominio.com RUN_CERTBOT=0 bash deploy/setup.sh

set -euo pipefail

# ---- Configuração (ajuste se quiser) ----------------------------------------
REPO="${REPO:-https://github.com/marcioscar/moadir.git}"
APP_DIR="${APP_DIR:-/opt/moadir}"
APP_USER="${APP_USER:-www-data}"
NODE_MAJOR="${NODE_MAJOR:-24}"
DOMAIN="${DOMAIN:-2.25.175.240.nip.io}"   # nip.io resolve para o IP da VPS
RUN_CERTBOT="${RUN_CERTBOT:-1}"           # 1 = emite HTTPS via Let's Encrypt
CERTBOT_EMAIL="${CERTBOT_EMAIL:-marcioscar@gmail.com}"
# -----------------------------------------------------------------------------

log() { echo -e "\n\033[1;34m==>\033[0m $*"; }

if [[ "$EUID" -ne 0 ]]; then
  echo "Rode como root (use sudo)." >&2
  exit 1
fi

# 1. Node.js -------------------------------------------------------------------
if ! command -v node >/dev/null || [[ "$(node -v | sed 's/v\([0-9]*\).*/\1/')" -lt "$NODE_MAJOR" ]]; then
  log "Instalando Node.js ${NODE_MAJOR}.x"
  curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | bash -
  apt-get install -y nodejs
else
  log "Node.js já presente: $(node -v)"
fi

# 2. Pacotes do sistema --------------------------------------------------------
log "Instalando nginx, git, certbot"
apt-get install -y nginx git certbot python3-certbot-nginx
corepack enable

# 3. Código --------------------------------------------------------------------
git config --global --add safe.directory "$APP_DIR" 2>/dev/null || true
if [[ -d "$APP_DIR/.git" ]]; then
  log "Atualizando código em $APP_DIR"
  git -C "$APP_DIR" pull --ff-only
else
  log "Clonando repositório em $APP_DIR"
  git clone "$REPO" "$APP_DIR"
fi
cd "$APP_DIR"

# 4. Build ---------------------------------------------------------------------
log "Instalando dependências e buildando"
pnpm install --frozen-lockfile
pnpm run build
chown -R "$APP_USER:$APP_USER" "$APP_DIR"

# 5. systemd -------------------------------------------------------------------
log "Configurando serviço systemd"
cp deploy/moadir.service /etc/systemd/system/moadir.service
systemctl daemon-reload
systemctl enable moadir
systemctl restart moadir

# 6. nginx ---------------------------------------------------------------------
log "Configurando nginx"
cp deploy/nginx-moadir.conf /etc/nginx/sites-available/moadir
ln -sf /etc/nginx/sites-available/moadir /etc/nginx/sites-enabled/moadir
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx

# 7. Firewall (se ufw estiver ativo) ------------------------------------------
if command -v ufw >/dev/null && ufw status | grep -q "Status: active"; then
  log "Liberando portas 80/443 no ufw"
  ufw allow 80,443/tcp || true
fi

# 8. HTTPS ---------------------------------------------------------------------
if [[ "$RUN_CERTBOT" == "1" ]]; then
  if [[ -d "/etc/letsencrypt/live/$DOMAIN" ]]; then
    log "Certificado para $DOMAIN já existe — pulando certbot"
  else
    log "Emitindo certificado HTTPS para $DOMAIN"
    certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos \
      -m "$CERTBOT_EMAIL" --redirect
  fi
fi

log "Pronto! Status do serviço:"
systemctl --no-pager status moadir | head -n 5
echo
if [[ "$RUN_CERTBOT" == "1" ]]; then
  echo "Acesse: https://$DOMAIN"
else
  echo "Acesse: http://$DOMAIN"
fi
