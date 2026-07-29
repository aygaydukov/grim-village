import { recordCraft, recordTrade } from "./events";
import { barnStock, getBarnTile } from "./map";
import type { Agent, World } from "./types";
import { chance } from "./util";

const CRAFT_STOCK_CAP = 72;
const MIN_BARN_TO_CRAFT = 52;
const FOOD_PER_UNIT = 2;
const TRADE_THRESHOLD = 18;
const TRADE_BATCH = 12;
const TRADE_TREASURY_GAIN = 10;
const TREASURY_CAP = 90;

function avgHunger(world: World): number {
  const alive = world.agents.filter((a) => a.alive);
  if (alive.length === 0) return 0;
  let sum = 0;
  for (const a of alive) sum += a.hunger;
  return sum / alive.length;
}

/** Сколько ремесленников целесообразно при текущих запасах */
export function artisanTarget(world: World, workingAdults: number): number {
  if (workingAdults < 7) return 0;
  const barn = barnStock(world);
  const hunger = avgHunger(world);
  if (barn < 55 || hunger > 58) return 0;
  if (barn >= 115) return Math.max(1, Math.round(workingAdults * 0.14));
  if (barn >= 88) return Math.max(0, Math.round(workingAdults * 0.1));
  if (barn >= 70) return Math.max(0, Math.round(workingAdults * 0.06));
  return 0;
}

function canCraft(agent: Agent, world: World): boolean {
  if (!agent.alive || agent.profession !== "artisan") return false;
  if (agent.age < 16 || agent.age >= 65) return false;
  if (agent.energy < 34 || agent.hunger > 58) return false;
  if (agent.pregnant > 0) return false;
  return barnStock(world) >= MIN_BARN_TO_CRAFT;
}

/** Ежедневное производство ремесленных товаров и торговля с соседями */
export function tickDailyCraft(world: World): void {
  const barn = getBarnTile(world);
  if (!barn) return;

  let produced = 0;
  for (const agent of world.agents) {
    if (!canCraft(agent, world)) continue;
    if (world.craftStock >= CRAFT_STOCK_CAP) break;
    if (barn.food < FOOD_PER_UNIT) break;

    const units = chance(world.rng, 0.35) ? 2 : 1;
    for (let i = 0; i < units; i++) {
      if (barn.food < FOOD_PER_UNIT || world.craftStock >= CRAFT_STOCK_CAP) break;
      barn.food -= FOOD_PER_UNIT;
      world.craftStock += 1;
      produced += 1;
      agent.energy = Math.max(8, agent.energy - 6);
    }
  }

  if (produced > 0) {
    recordCraft(world, `мастерская (+${produced} изделий)`);
  }

  if (world.craftStock >= TRADE_THRESHOLD && barnStock(world) >= 38) {
    const batch = Math.min(TRADE_BATCH, world.craftStock - 6);
    if (batch >= TRADE_BATCH && world.treasury < TREASURY_CAP - TRADE_TREASURY_GAIN) {
      world.craftStock -= batch;
      world.treasury = Math.min(TREASURY_CAP, world.treasury + TRADE_TREASURY_GAIN);
      recordTrade(world, `обмен ${batch} изделий (+${TRADE_TREASURY_GAIN} мер в казну)`);
    }
  }
}
