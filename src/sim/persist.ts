import type { ActiveShock, Agent, DayEvent, DaySnapshot, Tile, World, WorldStats } from "./types";
import { createRng } from "./util";
import { restoreRng, rngState } from "./world";

export const SAVE_VERSION = 2;
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
  stats: WorldStats;
  dayHistory: DaySnapshot[];
  pendingDayEvents: DayEvent[];
  activeShock: ActiveShock | null;
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
    stats: { ...world.stats },
    dayHistory: world.dayHistory.map((s) => ({
      ...s,
      events: s.events ? [...s.events] : undefined,
    })),
    pendingDayEvents: [...world.pendingDayEvents],
    activeShock: world.activeShock ? { ...world.activeShock } : null,
  };
}

export function deserializeWorld(data: WorldSave): World {
  if (data.version !== SAVE_VERSION && data.version !== 1) {
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
    stats: { ...data.stats },
    dayHistory: data.dayHistory,
    seed: data.seed,
    pendingDayEvents: data.pendingDayEvents ?? [],
    activeShock: data.activeShock ?? null,
    rng: createRng(data.seed),
  };
  restoreRng(world, data.rngState);
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
