import type {
  ActiveShock,
  Agent,
  BuildProject,
  DayEvent,
  DaySnapshot,
  StarostaPolicy,
  Tile,
  World,
  WorldStats,
} from "./types";
import { ensureWorkshop } from "./map";
import { createRng } from "./util";
import { restoreRng, rngState } from "./world";

export const SAVE_VERSION = 11;
export const STORAGE_KEY = "grim-village-save";

export interface WorldSave {
  version: number;
  savedAt: string;
  seed: number;
  rngState: number;
  width: number;
  height: number;
  tiles: Tile[];
  agents: Agent[];
  nextId: number;
  tick: number;
  dayLength: number;
  barnX: number;
  barnY: number;
  workshopX?: number;
  workshopY?: number;
  stats: WorldStats;
  dayHistory: DaySnapshot[];
  pendingDayEvents: DayEvent[];
  activeShock: ActiveShock | null;
  buildProject?: BuildProject | null;
  lastHutBuiltDay?: number;
  treasury?: number;
  starostaId?: number | null;
  starostaPolicy?: StarostaPolicy;
  lastMigrationDay?: number;
  lastImmigrationDay?: number;
  craftStock?: number;
  saltStock?: number;
  ironStock?: number;
  lastCaravanDay?: number;
  settlementVersion?: number;
  settlementId?: string;
}

export function serializeWorld(world: World): WorldSave {
  return {
    version: SAVE_VERSION,
    savedAt: new Date().toISOString(),
    seed: world.seed,
    rngState: rngState(world),
    width: world.width,
    height: world.height,
    tiles: world.tiles.map((t) => ({ ...t })),
    agents: world.agents.map((a) => ({ ...a })),
    nextId: world.nextId,
    tick: world.tick,
    dayLength: world.dayLength,
    barnX: world.barnX,
    barnY: world.barnY,
    workshopX: world.workshopX,
    workshopY: world.workshopY,
    stats: { ...world.stats },
    dayHistory: world.dayHistory.map((s) => ({
      ...s,
      events: s.events ? [...s.events] : undefined,
    })),
    pendingDayEvents: [...world.pendingDayEvents],
    activeShock: world.activeShock ? { ...world.activeShock } : null,
    buildProject: world.buildProject ? { ...world.buildProject } : null,
    lastHutBuiltDay: world.lastHutBuiltDay,
    treasury: world.treasury,
    starostaId: world.starostaId,
    starostaPolicy: world.starostaPolicy,
    lastMigrationDay: world.lastMigrationDay,
    lastImmigrationDay: world.lastImmigrationDay,
    craftStock: world.craftStock,
    saltStock: world.saltStock,
    ironStock: world.ironStock,
    lastCaravanDay: world.lastCaravanDay,
    settlementVersion: world.settlementVersion,
    settlementId: world.settlementId,
  };
}

export function deserializeWorld(data: WorldSave): World {
  if (
    data.version !== SAVE_VERSION &&
    data.version !== 10 &&
    data.version !== 9 &&
    data.version !== 8 &&
    data.version !== 7 &&
    data.version !== 6 &&
    data.version !== 5 &&
    data.version !== 4 &&
    data.version !== 3 &&
    data.version !== 2 &&
    data.version !== 1
  ) {
    throw new Error(`Неподдерживаемая версия сохранения: ${data.version}`);
  }
  const world: World = {
    width: data.width,
    height: data.height,
    tiles: data.tiles,
    agents: data.agents,
    nextId: data.nextId,
    tick: data.tick,
    dayLength: data.dayLength,
    barnX: data.barnX,
    barnY: data.barnY,
    workshopX: data.workshopX ?? data.barnX + 2,
    workshopY: data.workshopY ?? data.barnY + 1,
    stats: { ...data.stats },
    dayHistory: data.dayHistory,
    seed: data.seed,
    pendingDayEvents: data.pendingDayEvents ?? [],
    activeShock: data.activeShock ?? null,
    buildProject: data.buildProject ?? null,
    lastHutBuiltDay: data.lastHutBuiltDay ?? 0,
    treasury: data.treasury ?? 0,
    starostaId: data.starostaId ?? null,
    starostaPolicy: data.starostaPolicy ?? "balanced",
    lastMigrationDay: data.lastMigrationDay ?? 0,
    lastImmigrationDay: data.lastImmigrationDay ?? 0,
    craftStock: data.craftStock ?? 0,
    saltStock: data.saltStock ?? 0,
    ironStock: data.ironStock ?? 0,
    lastCaravanDay: data.lastCaravanDay ?? 0,
    settlementVersion: data.settlementVersion ?? 1,
    settlementId: data.settlementId ?? "unknown",
    rng: createRng(data.seed),
  };
  restoreRng(world, data.rngState);
  if (data.version < SAVE_VERSION) {
    ensureWorkshop(world);
  }
  return world;
}

export function saveWorldToStorage(world: World): void {
  const payload = serializeWorld(world);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export function loadWorldFromStorage(): World | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as WorldSave;
    return deserializeWorld(data);
  } catch {
    return null;
  }
}

export function clearWorldStorage(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function hasSavedWorld(): boolean {
  return localStorage.getItem(STORAGE_KEY) != null;
}
