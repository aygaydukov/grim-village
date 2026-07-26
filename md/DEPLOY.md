# Деплой игры на Selectel VPS

Игра (статика из `dist/`) → `http://45.131.42.53/`  
Каталог на сервере: `/var/www/grim-village`  
SSH: `root@45.131.42.53`, ключ `~/.ssh/id_ed25519_selectel`

Витрина летописи остаётся на Pages: https://aygaydukov.github.io/grim-village/

## 1. Ключ на сервер (один раз)

С Mac:

```bash
ssh-copy-id -i ~/.ssh/id_ed25519_selectel.pub root@45.131.42.53
# или вручную:
ssh -i ~/.ssh/id_ed25519_selectel root@45.131.42.53
# на сервере:
mkdir -p ~/.ssh && chmod 700 ~/.ssh
echo 'ВСТАВЬ_СОДЕРЖИМОЕ_id_ed25519_selectel.pub' >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

Публичный ключ локально:

```bash
cat ~/.ssh/id_ed25519_selectel.pub
```

## 2. Подготовка сервера (один раз, под root)

```bash
ssh -i ~/.ssh/id_ed25519_selectel root@45.131.42.53
```

На сервере:

```bash
apt-get update
apt-get install -y nginx
mkdir -p /var/www/grim-village
chown -R www-data:www-data /var/www/grim-village

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

    location ~* \.(js|css|png|jpg|jpeg|gif|svg|ico|woff2?)$ {
        expires 7d;
        add_header Cache-Control "public";
    }
}
EOF

rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/grim-village /etc/nginx/sites-enabled/grim-village
nginx -t && systemctl enable --now nginx && systemctl reload nginx
```

Права для деплоя от root через SCP:

```bash
chown -R root:root /var/www/grim-village
chmod -R u+rwX /var/www/grim-village
```

## 3. GitHub Secrets (уже можно выставить через `gh`)

| Secret | Значение |
|--------|----------|
| `DEPLOY_HOST` | `45.131.42.53` |
| `DEPLOY_USER` | `root` |
| `DEPLOY_PATH` | `/var/www/grim-village` |
| `DEPLOY_SSH_KEY` | содержимое **приватного** `~/.ssh/id_ed25519_selectel` |

Variable: `DEPLOY_PORT` = `22`

Проверка деплоя:

```bash
gh workflow run "Build & deploy game to server" --repo aygaydukov/grim-village
gh run watch --repo aygaydukov/grim-village
```

Открыть: http://45.131.42.53/

## Безопасность (бэклог)

- Лучше отдельный пользователь `deploy` вместо `root` и отдельный deploy-ключ только для этого хоста.
- Закрыть SSH паролями, оставить только ключи; по возможности сменить порт / fail2ban.
- HTTPS (Let's Encrypt), когда будет домен.
