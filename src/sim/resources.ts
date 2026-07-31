import type { World } from "./types";

const SALT_STOCK_CAP = 48;
const IRON_STOCK_CAP = 36;
const SALT_PER_CAPITA_DAY = 0.08;
const IRON_PER_BUILD_TICK = 0.04;

/** Соль снижает ночной холод и голод; железо ускоряет стройку */
export function tickDailyResources(world: World): void {
  const alive = world.agents.filter((a) => a.alive).length;
  if (alive === 0 || world.saltStock <= 0) return;

  const use = Math.min(world.saltStock, alive * SALT_PER_CAPITA_DAY);
  world.saltStock = Math.max(0, world.saltStock - use);
}

/** Множитель ночного голода (1 = без изменений) */
export function saltHungerMultiplier(world: World): number {
  return world.saltStock > 0 ? 0.82 : 1;
}

/** Множитель ночного холода (энергия) */
export function saltColdMultiplier(world: World): number {
  if (world.saltStock >= 10) return 0.72;
  if (world.saltStock > 0) return 0.88;
  return 1;
}

/** Полный амбар согревает ночью — меньше смертей от холода */
export function barnWarmthMultiplier(world: World): number {
  const stock = world.stats.barnFood;
  if (stock >= 75) return 0.78;
  if (stock >= 55) return 0.88;
  if (stock >= 35) return 0.95;
  return 1;
}

/** Дополнительный прогресс стройки за тик */
export function ironBuildBonus(world: World): number {
  if (world.ironStock <= 0) return 0;
  return 0.35;
}

/** Расход железа при работе на стройке */
export function consumeIronForBuild(world: World): void {
  if (world.ironStock <= 0) return;
  world.ironStock = Math.max(0, world.ironStock - IRON_PER_BUILD_TICK);
}

export function addSalt(world: World, amount: number): number {
  const room = SALT_STOCK_CAP - world.saltStock;
  const gain = Math.min(amount, room);
  world.saltStock += gain;
  return gain;
}

export function addIron(world: World, amount: number): number {
  const room = IRON_STOCK_CAP - world.ironStock;
  const gain = Math.min(amount, room);
  world.ironStock += gain;
  return gain;
}

export function removeSalt(world: World, amount: number): number {
  const taken = Math.min(amount, world.saltStock);
  world.saltStock -= taken;
  return taken;
}

export function removeIron(world: World, amount: number): number {
  const taken = Math.min(amount, world.ironStock);
  world.ironStock -= taken;
  return taken;
}
