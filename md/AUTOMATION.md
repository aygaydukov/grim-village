# Automation: Medieval Society Daily

Cloud agent evolves the **agent-based medieval life sandbox**, updates the public chronicle, and keeps settlements healthy.

- Play: http://45.131.42.53/
- Chronicle (Pages): https://aygaydukov.github.io/grim-village/
- **Game releases:** in-game tab «История версий» only (`src/version.ts`). Not on GitHub Pages.

## Prompt additions (paste into Cursor Automation)

You maintain an autonomous medieval village simulation.

After code changes, **always** finish with this sequence:

1. `npm test`
2. `npm run simulate` — 10-day smoke. If unstable, fix balance before finishing.
3. `npm run simulate:ci` — optional 100-day CI smoke (shortened pregnancy, checks births).
4. `npm run village:status` — refresh `docs/status.json` (metrics chronicle).
5. **`npm run settlement:snapshot`** — run **10 in-game days** on the current settlement, then write an SVG map snapshot to `docs/settlements/v{N}/snapshot.svg`.  
   - Do **not** snapshot only at spawn; the post-sim snapshot is the release artifact.  
   - Commit the new/updated `docs/settlements/v{N}/` files.
6. If you shipped a player-visible feature: bump `GAME_VERSION` + `CHANGELOG` in `src/version.ts`.
7. Commit and push to `main`.

### Settlements & fatal drops

- Saves may be overwritten (`data/current.json`). That is OK.
- If the settlement is **fatally doomed** after the 10-day run (extinction / collapse):  
  - drop it (`npm run settlement:new` or archive via settlement tools),  
  - start `settlement-vN+1`,  
  - run **`npm run settlement:snapshot` again** on the new version (10 days → snapshot).
- Each settlement version must have a **post-10-day** snapshot under `docs/settlements/v{N}/`.

### Do not

- Put full release notes on GitHub Pages.
- Commit a spawn-only snapshot as the release snapshot (always simulate 10 days first).
- Leave a dead village without dropping and restarting.

## Commands

```bash
npm run settlement:snapshot      # 10 days → SVG → docs/settlements/vN/
npm run settlement:snapshot 15   # optional day count
npm run settlement:new           # new settlement version (spawn snapshot only)
npm run village:daemon           # 24/7 server loop
```

## CI/CD

Push to `main` deploys playable build + restarts headless daemon automatically (see [DEPLOY.md](DEPLOY.md)).
