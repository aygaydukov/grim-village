import { recordBake } from "./events";
import { barnStock, getBarnTile } from "./map";
import { seasonForDay } from "./season";
import type { Agent, World } from "./types";
import { chance } from "./util";

const DRIED_STOCK_CAP = 54;
const MIN_BARN_TO_PRESERVE = 78;
/** Сырья из амбара на одну меру сушёного запаса */
const FOOD_PER_DRIED = 3;
const WINTER_RELEASE_THRESHOLD = 28;
/** Одна мерa сушёного → столько мер в амбаре при раздаче */
const DRIED_TO_BARN_RATIO = 2;

function avgHunger(world: World): number {
  const alive = world.agents.filter((a) => a.alive);
  if (alive.length === 0) return 0;
  let sum = 0;
  for (const a of alive) sum += a.hunger;
  return sum / alive.length;
}

/** Сколько пекарей целесообразно при избытке в амбаре */
export function bakerTarget(world: World, workingAdults: number): number {
  if (workingAdults < 8) return 0;
  const barn = barnStock(world);
  const hunger = avgHunger(world);
  if (barn < MIN_BARN_TO_PRESERVE || hunger > 55) return 0;
  if (world.driedStock >= DRIED_STOCK_CAP - 4) return 0;
  if (barn >= 130) return Math.max(1, Math.round(workingAdults * 0.1));
  if (barn >= 100) return Math.max(0, Math.round(workingAdults * 0.06));
  if (barn >= 85) return 1;
  return 0;
}

function canBake(agent: Agent, world: World): boolean {
  if (!agent.alive || agent.profession !== "baker") return false;
  if (agent.age < 16 || agent.age >= 65) return false;
  if (agent.energy < 32 || agent.hunger > 58) return false;
  if (agent.pregnant > 0) return false;
  return barnStock(world) >= MIN_BARN_TO_PRESERVE;
}

/** Ежедневная сушка излишков и зимняя раздача в амбар */
export function tickDailyBakery(world: World): void {
  const barn = getBarnTile(world);
  if (!barn) return;

  let produced = 0;
  for (const agent of world.agents) {
    if (!canBake(agent, world)) continue;
    if (world.driedStock >= DRIED_STOCK_CAP) break;
    if (barn.food < FOOD_PER_DRIED + 12) break;

    if (chance(world.rng, 0.38)) {
      barn.food -= FOOD_PER_DRIED;
      world.driedStock += 1;
      produced += 1;
      agent.energy = Math.max(8, agent.energy - 5);
    }
  }

  if (produced > 0) {
    recordBake(world, `сушка (+${produced} мер запаса)`);
  }

  const season = seasonForDay(world.stats.day);
  if (
    (season === "winter" || season === "autumn") &&
    world.driedStock > 0 &&
    barn.food < WINTER_RELEASE_THRESHOLD
  ) {
    const need = WINTER_RELEASE_THRESHOLD - barn.food;
    const release = Math.min(world.driedStock, Math.ceil(need / DRIED_TO_BARN_RATIO));
    if (release > 0) {
      world.driedStock -= release;
      const gain = release * DRIED_TO_BARN_RATIO;
      barn.food = Math.min(barn.maxFood, barn.food + gain);
      recordBake(world, `из запаса в амбар (+${gain} мер)`);
    }
  }
}

export function bakeryPos(world: World): { x: number; y: number } {
  return { x: world.bakeryX + 0.5, y: world.bakeryY + 0.5 };
}
