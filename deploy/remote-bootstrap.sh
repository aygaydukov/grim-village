#!/usr/bin/env bash
# Idempotent server bootstrap — run by GitHub Actions over SSH.
set -euo pipefail

WEB="${GRIM_WEB_ROOT:-/var/www/grim-village}"
APP="${GRIM_APP_ROOT:-/opt/grim-village}"
DATA="${GRIM_DATA_DIR:-/var/lib/grim-village}"
BUNDLE="${1:-/tmp/grim-bundle.tgz}"

echo "[bootstrap] web=$WEB app=$APP data=$DATA"

if ! command -v node >/dev/null 2>&1 || ! node -v | grep -qE 'v2[2-9]|v[3-9]'; then
  echo "[bootstrap] installing Node.js 22..."
  export DEBIAN_FRONTEND=noninteractive
  apt-get update -y
  apt-get install -y ca-certificates curl gnupg
  mkdir -p /etc/apt/keyrings
  curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg
  echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_22.x nodistro main" >/etc/apt/sources.list.d/nodesource.list
  apt-get update -y
  apt-get install -y nodejs
fi

if ! command -v nginx >/dev/null 2>&1; then
  echo "[bootstrap] installing nginx..."
  export DEBIAN_FRONTEND=noninteractive
  apt-get update -y
  apt-get install -y nginx
fi

mkdir -p "$WEB" "$WEB/data" "$APP" "$DATA" /tmp/grim-unpack
rm -rf /tmp/grim-unpack/*
tar -xzf "$BUNDLE" -C /tmp/grim-unpack

# Static site (preserve /data)
rsync -a --delete --exclude data/ /tmp/grim-unpack/www/ "$WEB/"
mkdir -p "$WEB/data"

# App sources for daemon
rsync -a --delete /tmp/grim-unpack/app/ "$APP/"

cd "$APP"
npm ci

cat >/etc/nginx/sites-available/grim-village <<EOF
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;
    root ${WEB};
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location /data/ {
        add_header Cache-Control "no-store";
        try_files \$uri =404;
    }
}
EOF
rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/grim-village /etc/nginx/sites-enabled/grim-village
nginx -t
systemctl enable nginx
systemctl reload nginx

cp "$APP/deploy/grim-village.service" /etc/systemd/system/grim-village.service
systemctl daemon-reload
systemctl enable grim-village
systemctl restart grim-village
systemctl --no-pager --full status grim-village || true

echo "[bootstrap] done"
node -v
curl -sI http://127.0.0.1/ | head -5 || true
