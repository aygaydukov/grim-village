import { spawnInitialPopulation } from "./agent";
import { simulateTick } from "./behavior";
import { generateMap, syncBarnStat } from "./map";
import type { World, WorldConfig } from "./types";
import { createRng } from "./util";

export const DEFAULT_CONFIG: WorldConfig = {
  width: 64,
  height: 48,
  initialPopulation: 22,
};

export function initWorld(config: WorldConfig = DEFAULT_CONFIG, seed = 1337): World {
  const { tiles, hutSpots, barn } = generateMap(config.width, config.height, seed);
  const world: World = {
    width: config.width,
    height: config.height,
    tiles,
    agents: [],
    nextId: 1,
    tick: 0,
    dayLength: 1200,
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
    rng: createRng(seed),
  };

  spawnInitialPopulation(world, hutSpots, config.initialPopulation);
  world.stats.alive = world.agents.filter((a) => a.alive).length;
  syncBarnStat(world);
  return world;
}

export function stepWorld(world: World, steps = 1): void {
  for (let i = 0; i < steps; i++) {
    simulateTick(world);
  }
}
