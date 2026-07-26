/**
 * Headless village daemon: keeps simulating + autosaving without a browser.
 *
 *   GRIM_DATA_DIR=/var/lib/grim-village
 *   GRIM_PUBLIC_DATA_DIR=/var/www/grim-village/data
 *   GRIM_SPEED=4
 *   npm run village:daemon
 */
import { GAME_VERSION } from "../src/version.ts";
import { stepWorld } from "../src/sim/world.ts";
import { TICKS_PER_REAL_SECOND } from "../src/sim/time.ts";
import {
  archiveFatalAndRestart,
  defaultDataDir,
  isFatalSettlement,
  loadCurrentWorld,
  loadRegistry,
  saveCurrentWorld,
  startNewSettlement,
  writeSettlementPublicMirror,
} from "./settlement-store.ts";

const speed = Math.max(1, Number(process.env.GRIM_SPEED ?? 4));
const saveEveryMs = Math.max(5_000, Number(process.env.GRIM_SAVE_MS ?? 30_000));
const frameMs = 1000 / TICKS_PER_REAL_SECOND;
const dir = defaultDataDir();

let initialAlive = 22;
let settlementVersion = 1;
let settlementId = "unknown";

function boot() {
  const existing = loadCurrentWorld(dir);
  const registry = loadRegistry(dir);
  if (existing && registry.currentVersion > 0) {
    const meta = registry.settlements.find((s) => s.version === registry.currentVersion);
    settlementVersion = registry.currentVersion;
    settlementId = meta?.id ?? `settlement-v${settlementVersion}`;
    initialAlive = Math.max(existing.stats.alive + existing.stats.dead, 22);
    console.log(
      `[daemon] resume ${settlementId} day=${existing.stats.day} alive=${existing.stats.alive} speed=×${speed}`,
    );
    return existing;
  }
  const started = startNewSettlement(dir, Date.now() % 1_000_000, GAME_VERSION, "daemon_boot");
  settlementVersion = started.meta.version;
  settlementId = started.meta.id;
  initialAlive = started.world.stats.alive;
  console.log(`[daemon] new ${settlementId} seed=${started.meta.seed}`);
  return started.world;
}

let world = boot();
let lastSave = Date.now();
let lastLog = Date.now();

function persist(reason: string): void {
  saveCurrentWorld(world, { settlementVersion, settlementId }, dir);
  const registry = loadRegistry(dir);
  const meta = registry.settlements.find((s) => s.version === settlementVersion) ?? {
    version: settlementVersion,
    id: settlementId,
    seed: world.seed,
    startedAt: new Date().toISOString(),
    gameVersion: GAME_VERSION,
  };
  writeSettlementPublicMirror(world, meta, registry, dir);
  console.log(
    `[daemon] save (${reason}) day=${world.stats.day} alive=${world.stats.alive} barn=${world.stats.barnFood}`,
  );
}

function maybeReset(): void {
  if (world.stats.day < 20) return;
  if (!isFatalSettlement(world, initialAlive)) return;
  console.warn(`[daemon] fatal collapse — dropping settlement ${settlementId}`);
  const next = archiveFatalAndRestart(world, initialAlive, dir, GAME_VERSION);
  world = next.world;
  settlementVersion = next.meta.version;
  settlementId = next.meta.id;
  initialAlive = world.stats.alive;
  persist("new_settlement");
}

console.log(`[daemon] data=${dir} frameMs=${frameMs} speed=×${speed}`);
persist("boot");

setInterval(() => {
  stepWorld(world, speed);
  maybeReset();
  const now = Date.now();
  if (now - lastSave >= saveEveryMs) {
    lastSave = now;
    persist("interval");
  }
  if (now - lastLog >= 60_000) {
    lastLog = now;
    console.log(
      `[daemon] heartbeat ${settlementId} day=${world.stats.day} alive=${world.agents.filter((a) => a.alive).length}`,
    );
  }
}, frameMs);

process.on("SIGINT", () => {
  persist("shutdown");
  process.exit(0);
});
process.on("SIGTERM", () => {
  persist("shutdown");
  process.exit(0);
});
