# Grim Village

**Autonomous medieval life sandbox** driven by agent-based simulation (and daily Cursor cloud agents that evolve the code). Peasants eat, sleep, gather, build, breed, pay tithe, starve, and die — without a player protagonist.

**Play:** http://45.131.42.53/  
**Live chronicle (metrics):** https://aygaydukov.github.io/grim-village/  
**Releases / changelog:** in-game tab **«История версий»** (not on GitHub Pages).

## Discoverability / topics

Useful search phrases for similar projects and research:

- agent-based medieval village simulation
- autonomous NPC life sandbox (no win condition)
- artificial society / artificial life (ALife) food–labor loop
- Malthusian population dynamics in games
- headless world simulation with autosave
- Cursor Automations evolving a game daily

## References

- [Red Blob Games — A* pathfinding](https://www.redblobgames.com/pathfinding/a-star/introduction.html)
- [Might & Fealty — economy loop](https://mightandfealty.com/en/manual/economy)
- [Manorialism (Britannica)](https://www.britannica.com/topic/manorialism)
- [Crop calendar (Wikipedia)](https://en.wikipedia.org/wiki/Crop_calendar)
- [FAO — famine dynamics](https://www.fao.org/emergencies/crisis/famine/en/)
- Classic sandboxes to study: *Dwarf Fortress*, *RimWorld*, *Banished*, *Oxygen Not Included* (logistics & survival pressure)

## Stack

- TypeScript + Vite
- HTML5 Canvas 2D
- Simulation separated from render (`src/sim` / `src/render`)
- Headless daemon for 24/7 world ticks + disk autosave

## Time scale

At speed **×1**, roughly **3 years of character age pass per real day**.  
Game day/night cycles stay short (~40s) for hunger/work pacing; years/seasons/pregnancy use `src/sim/time.ts`.

## Run locally

```bash
npm install
npm run dev          # http://localhost:5173
npm test
npm run simulate     # 10 in-game days smoke
npm run village:status
npm run village:daemon   # headless autosave loop
```

## Headless settlement (no browser required)

The daemon simulates the village, overwrites `data/current.json`, archives fatal collapses as new **settlement versions**, and writes SVG snapshots.

```bash
GRIM_DATA_DIR=./data \
GRIM_PUBLIC_DATA_DIR=./dist/data \
GRIM_SPEED=4 \
npm run village:daemon
```

Fatal collapse → drop current settlement → start `settlement-vN+1` → snapshot SVG.  
Browser localStorage saves remain optional for interactive watching.

## Automation (Cursor)

Daily cloud agent evolves systems, runs stability checks, updates chronicle JSON, may drop a doomed settlement and start a new version (with snapshot). See [md/AUTOMATION.md](md/AUTOMATION.md).

## Docs

- [md/ARCHITECTURE.md](md/ARCHITECTURE.md)
- [md/DEVELOPMENT_PLAN.md](md/DEVELOPMENT_PLAN.md)
- [md/TECHNICAL_DEBT.md](md/TECHNICAL_DEBT.md)
- [md/DEPLOY.md](md/DEPLOY.md)

## Repository

https://github.com/aygaydukov/grim-village (public)
