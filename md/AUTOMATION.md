# Automation: Medieval Society Daily

Cloud agent evolves the **agent-based life sandbox**, updates the public chronicle, and keeps the headless settlement healthy.

- Play: http://45.131.42.53/
- Chronicle (Pages): https://aygaydukov.github.io/grim-village/
- **Game releases / changelog:** in-game tab only (`src/version.ts` → «История версий»). Do **not** duplicate full release notes on GitHub Pages.

## Prompt additions (paste into Cursor Automation)

You maintain an autonomous medieval village simulation.

**After every update (mandatory order):**

1. Run `npm test` and `npm run simulate` (10-day smoke). If unstable, fix balance before finishing.
2. Run `npm run village:status` → refresh `docs/status.json`.
3. **Always** run `npm run settlement:snapshot` → writes/updates:
   - `docs/settlements/v{N}/snapshot.svg` (latest for this settlement)
   - `docs/settlements/v{N}/snapshot-{timestamp}.svg` (archive of this update)
4. If you ship a player-visible feature: bump `GAME_VERSION` + entry in `src/version.ts` CHANGELOG (in-game Releases tab).
5. Commit **including** the new SVG snapshots and push to `main`.

### Settlements & fatal drops

- Overwrite saves is OK (`data/current.json`).
- If the settlement is **fatally doomed**, drop and regenerate:
  - `npm run settlement:new` (or daemon auto-drop)
  - then **again** `npm run settlement:snapshot`
- Each drop creates a new settlement version `vN+1` with its own folder under `docs/settlements/`.

### Do not

- Skip the snapshot step after an update.
- Put long release changelogs on the GitHub Pages landing page.
- Block forever on a dead village — drop and restart with a new settlement version.

## Commands

```bash
npm run village:status
npm run settlement:snapshot   # after every update
npm run settlement:new        # only on fatal drop / reset
npm run village:daemon
```

## CI/CD

Push to `main` auto-deploys game + daemon via GitHub Actions (no manual SSH).
