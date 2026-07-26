# Deploy — Selectel VPS

**Play:** http://45.131.42.53/  
**Static root:** `/var/www/grim-village`  
**Daemon data:** `/var/lib/grim-village`  
**SSH:** `root@45.131.42.53` with `~/.ssh/id_ed25519_selectel`

Chronicle Pages: https://aygaydukov.github.io/grim-village/  
Releases: in-game tab only.

## Nginx (`/data/` for live save mirror)

```bash
mkdir -p /var/www/grim-village/data /var/lib/grim-village /opt/grim-village

cat >/etc/nginx/sites-available/grim-village <<'EOF'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;
    root /var/www/grim-village;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /data/ {
        default_type application/json;
        add_header Cache-Control "no-store";
        try_files $uri =404;
    }
}
EOF

ln -sf /etc/nginx/sites-available/grim-village /etc/nginx/sites-enabled/grim-village
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
```

## App files + Node daemon

On the server (once):

```bash
# Node 22 if missing
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs

# sync repo or at least package.json + src + scripts
mkdir -p /opt/grim-village
# after CI deploy of dist/, also keep a git checkout or rsync of sources for the daemon:
#   git clone https://github.com/aygaydukov/grim-village.git /opt/grim-village
cd /opt/grim-village && npm ci

cp deploy/grim-village.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable --now grim-village
systemctl status grim-village
```

Daemon overwrites `/var/lib/grim-village/current.json` and mirrors to `/var/www/grim-village/data/` for the browser.

## GitHub Actions secrets

Already set: `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_PATH=/var/www/grim-village`, `DEPLOY_SSH_KEY`.

```bash
gh workflow run "Build & deploy game to server" --repo aygaydukov/grim-village
```

## Security backlog

- Prefer non-root `deploy` user + dedicated key
- HTTPS when a domain exists
- fail2ban / disable password SSH
