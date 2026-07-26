# Automation: Medieval Society Daily

Cloud agent evolves the **neural/agent-based life sandbox**, updates the public chronicle, and keeps the headless settlement healthy.

- Play: http://45.131.42.53/
- Chronicle (Pages): https://aygaydukov.github.io/grim-village/
- **Game releases / changelog:** in-game tab only (`src/version.ts` → «История версий»). Do **not** duplicate full release notes on GitHub Pages.

## Prompt additions (paste into Cursor Automation)

You maintain an autonomous medieval village simulation.

After code changes:

1. Run `npm test` and `npm run simulate` (10-day smoke). If unstable, fix balance before finishing.
2. Run `npm run village:status` to refresh `docs/status.json` (chronicle metrics — not release notes).
3. Update `src/version.ts` CHANGELOG + `GAME_VERSION` when you ship a player-visible feature (this powers the in-game Releases tab).
4. Commit and push to `main`.

### Settlements & fatal drops

- Headless world lives in `GRIM_DATA_DIR` (`current.json` + `registry.json`). Overwrite saves is OK.
- If the settlement is **fatally doomed** (extinction / population collapse), you **may drop** the current settlement DB/save and regenerate a new world.
- Each drop **must** create a new settlement version (`settlement-vN`):
  - archive previous entry in `data/registry.json` with `endReason`
  - write SVG snapshot via settlement tools (`scripts/settlement-snapshot.ts` / `startNewSettlement`)
  - copy snapshot into `docs/settlements/vN/snapshot.svg` (and note it in the commit)
- After each **release** (version bump), ensure a settlement snapshot exists for the current version (`docs/settlements/v{N}/snapshot.svg`).

### Do not

- Put long release changelogs on the GitHub Pages landing page.
- Block forever on a dead village — drop and restart with a new settlement version.

## Local / server daemon

```bash
npm run village:daemon
```

Server: see [DEPLOY.md](DEPLOY.md) systemd unit.

## CI/CD

- Pages: `docs/` chronicle
- Deploy: static game to `45.131.42.53` + keep daemon running with shared `data/`
