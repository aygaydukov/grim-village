import { countByProfession } from "./jobs";
import { barnStock } from "./map";
import { seasonForDay } from "./season";
import { takeDayEvents } from "./events";
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
  let highHunger = 0;
  let stuckAgents = 0;
  for (const a of alive) {
    hungerSum += a.hunger;
    energySum += a.energy;
    if (a.hunger > 70) highHunger += 1;
    if ((a.stuckTicks ?? 0) >= 60) stuckAgents += 1;
  }
  const n = Math.max(1, alive.length);

  const prev = world.dayHistory[world.dayHistory.length - 1];
  const deathsToday = prev ? world.stats.dead - prev.dead : 0;
  const birthsToday = prev ? world.stats.births - prev.births : 0;

  const snapshot: DaySnapshot = {
    day: world.stats.day,
    alive: alive.length,
    dead: world.stats.dead,
    births: world.stats.births,
    deathsToday: Math.max(0, deathsToday),
    birthsToday: Math.max(0, birthsToday),
    highHunger,
    stuckAgents,
    season: seasonForDay(world.stats.day),
    barnFood: barnStock(world),
    craftStock: world.craftStock,
    saltStock: world.saltStock,
    wildFood: wildFoodTotal(world),
    avgHunger: hungerSum / n,
    avgEnergy: energySum / n,
    professions: countByProfession(world),
    events: takeDayEvents(world),
  };

  world.dayHistory.push(snapshot);
  if (world.dayHistory.length > MAX_DAY_HISTORY) {
    world.dayHistory = world.dayHistory.slice(-MAX_DAY_HISTORY);
  }
}
