import { countByProfession } from "./jobs";
import { barnStock } from "./map";
import type { DaySnapshot, World } from "./types";

export const MAX_DAY_HISTORY = 30;

function wildFoodTotal(world: World): number {
  let total = 0;
  for (const tile of world.tiles) {
    if (tile.kind === "forest" || tile.kind === "grass") total += tile.food;
  }
  return total;
}

/** Снимок показателей в конце игрового дня */
export function recordDaySnapshot(world: World): void {
  const alive = world.agents.filter((a) => a.alive);
  let hungerSum = 0;
  let energySum = 0;
  for (const a of alive) {
    hungerSum += a.hunger;
    energySum += a.energy;
  }
  const n = Math.max(1, alive.length);

  const snapshot: DaySnapshot = {
    day: world.stats.day,
    alive: alive.length,
    dead: world.stats.dead,
    births: world.stats.births,
    barnFood: barnStock(world),
    wildFood: wildFoodTotal(world),
    avgHunger: hungerSum / n,
    avgEnergy: energySum / n,
    professions: countByProfession(world),
  };

  world.dayHistory.push(snapshot);
  if (world.dayHistory.length > MAX_DAY_HISTORY) {
    world.dayHistory = world.dayHistory.slice(-MAX_DAY_HISTORY);
  }
}
