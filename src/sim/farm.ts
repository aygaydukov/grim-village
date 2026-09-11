import { recordHarvest } from "./events";
import { getBarnTile } from "./map";
import { seasonForDay } from "./season";
import type { Agent, World } from "./types";
import { chance } from "./util";

export const FIELD_GROWTH_CAP = 100;
/** Минимальная зрелость для сбора урожая */
const HARVEST_THRESHOLD = 28;
/** Доля зрелости → меры в амбаре */
const HARVEST_YIELD_RATIO = 0.32;

function canTendField(agent: Agent, world: World): boolean {
  if (!agent.alive || agent.profession !== "farmer") return false;
  if (agent.age < 16 || agent.age >= 65) return false;
  if (agent.energy < 30 || agent.hunger > 60) return false;
  if (agent.pregnant > 0) return false;
  const season = seasonForDay(world.stats.day);
  return season !== "winter";
}

/** Сколько земледельцев нужно по сезону */
export function farmerTarget(world: World, workingAdults: number): number {
  if (workingAdults < 8) return 0;
  const season = seasonForDay(world.stats.day);
  if (season === "winter") return 0;
  if (season === "spring") return Math.max(1, Math.round(workingAdults * 0.08));
  if (season === "summer") return 1;
  if (season === "autumn") return Math.max(1, Math.round(workingAdults * 0.1));
  return 1;
}

function growthChance(season: ReturnType<typeof seasonForDay>): number {
  switch (season) {
    case "spring":
      return 0.42;
    case "summer":
      return 0.36;
    case "autumn":
      return 0.28;
    default:
      return 0;
  }
}

function growthStep(season: ReturnType<typeof seasonForDay>): number {
  switch (season) {
    case "spring":
      return 5;
    case "summer":
      return 4;
    case "autumn":
      return 3;
    default:
      return 0;
  }
}

function performHarvest(world: World, barn: NonNullable<ReturnType<typeof getBarnTile>>): void {
  if (world.fieldGrowth < HARVEST_THRESHOLD) return;
  const yieldFood = Math.floor(world.fieldGrowth * HARVEST_YIELD_RATIO);
  if (yieldFood <= 0) return;
  barn.food = Math.min(barn.maxFood, barn.food + yieldFood);
  world.fieldGrowth = Math.max(0, world.fieldGrowth - Math.ceil(yieldFood / HARVEST_YIELD_RATIO));
  recordHarvest(world, `урожай (+${yieldFood} мер в амбар)`);
}

/** Ежедневная работа на пашне — рост посевов и сезонный сбор */
export function tickDailyFarm(world: World): void {
  const barn = getBarnTile(world);
  if (!barn) return;

  const season = seasonForDay(world.stats.day);
  let tended = 0;

  for (const agent of world.agents) {
    if (!canTendField(agent, world)) continue;
    if (world.fieldGrowth >= FIELD_GROWTH_CAP) break;
    if (!chance(world.rng, growthChance(season))) continue;
    world.fieldGrowth = Math.min(FIELD_GROWTH_CAP, world.fieldGrowth + growthStep(season));
    agent.energy = Math.max(8, agent.energy - 4);
    tended += 1;
  }

  if (tended > 0 && world.fieldGrowth >= HARVEST_THRESHOLD && season === "spring") {
    recordHarvest(world, `посевы ${world.fieldGrowth}% зрелости`);
  }

  if (season === "autumn" || (season === "summer" && world.fieldGrowth >= 88)) {
    performHarvest(world, barn);
  }

  if (season === "winter" && world.fieldGrowth > 0) {
    world.fieldGrowth = Math.max(0, world.fieldGrowth - 2);
  }
}

export function farmPos(world: World): { x: number; y: number } {
  return { x: world.farmX + 0.5, y: world.farmY + 0.5 };
}
