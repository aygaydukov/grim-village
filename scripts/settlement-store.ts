import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import type { World } from "../src/sim/types.ts";
import { deserializeWorld, serializeWorld, type WorldSave } from "../src/sim/persist.ts";
import { initWorld } from "../src/sim/world.ts";
import { currentSeasonLabel } from "../src/sim/chronicle.ts";
import { barnStock } from "../src/sim/map.ts";
import { countByProfession } from "../src/sim/jobs.ts";
import { AGE_PER_GAME_DAY, YEARS_PER_REAL_DAY } from "../src/sim/time.ts";
import { SETTLEMENT_FATAL_ALIVE_RATIO } from "../src/sim/settlement.ts";
import { renderSettlementSvg } from "./settlement-snapshot.ts";

export interface SettlementMeta {
  version: number;
  id: string;
  seed: number;
  startedAt: string;
  endedAt?: string;
  endReason?: string;
  finalAlive?: number;
  finalDay?: number;
  snapshotPath?: string;
  gameVersion?: string;
}

export interface SettlementRegistry {
  updatedAt: string;
  currentVersion: number;
  settlements: SettlementMeta[];
}

export function defaultDataDir(): string {
  return process.env.GRIM_DATA_DIR ?? join(process.cwd(), "data");
}

export function ensureDataDir(dir = defaultDataDir()): string {
  mkdirSync(dir, { recursive: true });
  mkdirSync(join(dir, "settlements"), { recursive: true });
  return dir;
}

export function loadRegistry(dir = defaultDataDir()): SettlementRegistry {
  const path = join(dir, "registry.json");
  if (!existsSync(path)) {
    return { updatedAt: new Date().toISOString(), currentVersion: 0, settlements: [] };
  }
  return JSON.parse(readFileSync(path, "utf8")) as SettlementRegistry;
}

export function saveRegistry(registry: SettlementRegistry, dir = defaultDataDir()): void {
  ensureDataDir(dir);
  registry.updatedAt = new Date().toISOString();
  atomicWrite(join(dir, "registry.json"), `${JSON.stringify(registry, null, 2)}\n`);
}

export function loadCurrentWorld(dir = defaultDataDir()): World | null {
  const path = join(dir, "current.json");
  if (!existsSync(path)) return null;
  try {
    const raw = JSON.parse(readFileSync(path, "utf8")) as WorldSave & {
      settlementVersion?: number;
      settlementId?: string;
    };
    const world = deserializeWorld(raw);
    return world;
  } catch {
    return null;
  }
}

export function saveCurrentWorld(
  world: World,
  meta: { settlementVersion: number; settlementId: string },
  dir = defaultDataDir(),
): void {
  ensureDataDir(dir);
  const payload = {
    ...serializeWorld(world),
    settlementVersion: meta.settlementVersion,
    settlementId: meta.settlementId,
  };
  atomicWrite(join(dir, "current.json"), `${JSON.stringify(payload)}\n`);
}

export function isFatalSettlement(world: World, initialAlive: number): boolean {
  const alive = world.agents.filter((a) => a.alive).length;
  if (alive === 0) return true;
  if (world.stats.day < 20) return false;
  return alive < Math.max(2, Math.ceil(initialAlive * SETTLEMENT_FATAL_ALIVE_RATIO));
}

export function startNewSettlement(
  dir = defaultDataDir(),
  seed = Date.now() % 1_000_000,
  gameVersion = "unknown",
  reason = "bootstrap",
): { world: World; meta: SettlementMeta; registry: SettlementRegistry } {
  ensureDataDir(dir);
  const registry = loadRegistry(dir);
  const version = registry.currentVersion + 1;
  const id = `settlement-v${version}-${seed}`;
  const world = initWorld(undefined, seed);
  const meta: SettlementMeta = {
    version,
    id,
    seed,
    startedAt: new Date().toISOString(),
    gameVersion,
  };

  // close previous if open
  const prev = registry.settlements.find((s) => s.version === registry.currentVersion && !s.endedAt);
  if (prev) {
    prev.endedAt = meta.startedAt;
    prev.endReason = reason;
  }

  registry.currentVersion = version;
  registry.settlements.push(meta);
  saveRegistry(registry, dir);
  saveCurrentWorld(world, { settlementVersion: version, settlementId: id }, dir);

  const snapRel = `settlements/v${version}/snapshot.svg`;
  const snapAbs = join(dir, snapRel);
  mkdirSync(dirname(snapAbs), { recursive: true });
  writeFileSync(snapAbs, renderSettlementSvg(world), "utf8");
  meta.snapshotPath = snapRel;
  saveRegistry(registry, dir);

  writeSettlementPublicMirror(world, meta, registry, dir);
  return { world, meta, registry };
}

export function archiveFatalAndRestart(
  world: World,
  initialAlive: number,
  dir = defaultDataDir(),
  gameVersion = "unknown",
): { world: World; meta: SettlementMeta } {
  const registry = loadRegistry(dir);
  const current = registry.settlements.find((s) => s.version === registry.currentVersion);
  if (current && !current.endedAt) {
    current.endedAt = new Date().toISOString();
    current.endReason = "fatal_collapse";
    current.finalAlive = world.agents.filter((a) => a.alive).length;
    current.finalDay = world.stats.day;
    const snapRel = `settlements/v${current.version}/snapshot-final.svg`;
    const snapAbs = join(dir, snapRel);
    mkdirSync(dirname(snapAbs), { recursive: true });
    writeFileSync(snapAbs, renderSettlementSvg(world), "utf8");
    current.snapshotPath = snapRel;
    saveRegistry(registry, dir);
  }
  return startNewSettlement(dir, Date.now() % 1_000_000, gameVersion, "fatal_collapse");
}

/** Mirror for nginx/GitHub Pages consumers */
export function writeSettlementPublicMirror(
  world: World,
  meta: SettlementMeta,
  registry: SettlementRegistry,
  dir = defaultDataDir(),
): void {
  const alive = world.agents.filter((a) => a.alive).length;
  const publicDir = process.env.GRIM_PUBLIC_DATA_DIR ?? join(process.cwd(), "dist", "data");
  mkdirSync(publicDir, { recursive: true });
  const status = {
    updatedAt: new Date().toISOString(),
    settlement: meta,
    registrySummary: {
      currentVersion: registry.currentVersion,
      totalSettlements: registry.settlements.length,
    },
    village: {
      day: world.stats.day,
      yearsElapsed: (world.stats.day - 1) * AGE_PER_GAME_DAY,
      season: currentSeasonLabel(world),
      alive,
      dead: world.stats.dead,
      births: world.stats.births,
      barnFood: barnStock(world),
      professions: countByProfession(world),
    },
    timeScale: { yearsPerRealDayAtx1: YEARS_PER_REAL_DAY },
  };
  atomicWrite(join(publicDir, "settlement-status.json"), `${JSON.stringify(status, null, 2)}\n`);
  // publish current save for browser observers (overwrite OK)
  const currentPath = join(dir, "current.json");
  if (existsSync(currentPath)) {
    writeFileSync(join(publicDir, "current.json"), readFileSync(currentPath));
  }
  if (meta.snapshotPath) {
    const from = join(dir, meta.snapshotPath);
    if (existsSync(from)) {
      const to = join(publicDir, `settlement-v${meta.version}.svg`);
      writeFileSync(to, readFileSync(from));
    }
  }
}

function atomicWrite(path: string, contents: string): void {
  mkdirSync(dirname(path), { recursive: true });
  const tmp = `${path}.tmp`;
  writeFileSync(tmp, contents, "utf8");
  renameSync(tmp, path);
}
