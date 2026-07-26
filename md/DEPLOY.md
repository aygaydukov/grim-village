# Deploy — fully automatic via GitHub Actions

**Play:** http://45.131.42.53/  
**You do not need to SSH for routine updates.** Every push to `main` (relevant paths) runs CI:

1. `npm test` + `npm run build`
2. Upload release bundle
3. Remote bootstrap: nginx, Node, static files, headless daemon restart

Secrets already on the repo: `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_PATH`, `DEPLOY_SSH_KEY`.

Manual re-run:

```bash
gh workflow run "Build & deploy game to server" --repo aygaydukov/grim-village
gh run watch --repo aygaydukov/grim-village
```

## What lands where

| Path | Purpose |
|------|---------|
| `/var/www/grim-village` | Static game + `/data/` mirror |
| `/opt/grim-village` | App sources for daemon |
| `/var/lib/grim-village` | Persistent settlement saves |

## First deploy / recovery

If the VPS is empty, the same workflow still bootstraps nginx + Node + systemd (`deploy/remote-bootstrap.sh`). No hand steps required beyond working SSH secrets.

## Chronicle Pages

Separate workflow publishes `docs/` to https://aygaydukov.github.io/grim-village/

## Security backlog

- Prefer non-root deploy user
- HTTPS + domain
- fail2ban / key-only SSH
