import { spawnInitialPopulation } from "./agent";
import { simulateTick } from "./behavior";
import { tickDailyGovernment } from "./government";
import { recordDaySnapshot } from "./history";
import { generateMap, syncBarnStat } from "./map";
import type { Rng } from "./util";
import type { World, WorldConfig } from "./types";
import { createRng } from "./util";
import { DEFAULT_DAY_LENGTH } from "./time";

export const DEFAULT_CONFIG: WorldConfig = {
  width: 64,
  height: 48,
  initialPopulation: 22,
};

export function initWorld(config: WorldConfig = DEFAULT_CONFIG, seed = 1337): World {
  const { tiles, hutSpots, barn } = generateMap(config.width, config.height, seed);
  const rng = createRng(seed);
  const world: World = {
    width: config.width,
    height: config.height,
    tiles,
    agents: [],
    nextId: 1,
    tick: 0,
    dayLength: DEFAULT_DAY_LENGTH,
    barnX: barn.x,
    barnY: barn.y,
    stats: {
      alive: 0,
      dead: 0,
      day: 1,
      timeOfDay: 0.3,
      births: 0,
      barnFood: 0,
    },
    dayHistory: [],
    seed,
    pendingDayEvents: [],
    activeShock: null,
    buildProject: null,
    lastHutBuiltDay: 0,
    treasury: 0,
    starostaId: null,
    starostaPolicy: "balanced",
    lastMigrationDay: 0,
    lastImmigrationDay: 0,
    rng,
  };

  spawnInitialPopulation(world, hutSpots, config.initialPopulation);
  world.stats.alive = world.agents.filter((a) => a.alive).length;
  syncBarnStat(world);
  tickDailyGovernment(world);
  recordDaySnapshot(world);
  return world;
}

export function stepWorld(world: World, steps = 1): void {
  for (let i = 0; i < steps; i++) {
    simulateTick(world);
  }
}

/** Текущее состояние PRNG для сериализации */
export function rngState(world: World): number {
  return (world.rng as Rng).state;
}

/** Восстановить PRNG после десериализации */
export function restoreRng(world: World, state: number): void {
  world.rng = createRng(world.seed, state);
}
