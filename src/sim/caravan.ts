import { recordCaravan } from "./events";
import { barnStock, getBarnTile, syncBarnStat } from "./map";
import { addIron, addSalt, removeIron } from "./resources";
import { seasonForDay } from "./season";
import type { Season, World } from "./types";
import { chance } from "./util";

const CARAVAN_COOLDOWN_DAYS = 14;
const MIN_CRAFT_FOR_EXPORT = 20;
const EXPORT_BATCH = 10;
const EXPORT_TREASURY_BASE = 14;
const CRISIS_BARN = 28;
const CRISIS_TREASURY_COST = 12;
const CRISIS_FOOD_BASE = 32;
const TREASURY_CAP = 90;
const MIN_BARN_FOR_EXPORT = 38;

const SALT_BUY_COST = 9;
const SALT_BUY_AMOUNT = 8;
const SALT_MIN_BARN = 34;

const IRON_BUY_COST = 11;
const IRON_BUY_AMOUNT = 6;
const IRON_SELL_AMOUNT = 8;
const IRON_SELL_GAIN = 13;
const IRON_MIN_FOR_SELL = 14;

function seasonalPriceFactor(season: Season): number {
  switch (season) {
    case "summer":
      return 1.12;
    case "autumn":
      return 1.18;
    case "spring":
      return 1.0;
    case "winter":
      return 0.88;
  }
}

function caravanArrivalChance(season: Season): number {
  switch (season) {
    case "summer":
      return 0.2;
    case "autumn":
      return 0.22;
    case "spring":
      return 0.12;
    case "winter":
      return 0.07;
  }
}

function seasonLabel(season: Season): string {
  switch (season) {
    case "spring":
      return "весна";
    case "summer":
      return "лето";
    case "autumn":
      return "осень";
    case "winter":
      return "зима";
  }
}

function markCaravanDay(world: World): void {
  world.lastCaravanDay = world.stats.day;
}

function trySaltTrade(world: World, season: Season, barnFood: number, price: number): boolean {
  if (season === "winter") return false;
  if (world.saltStock >= 20) return false;
  if (barnFood < SALT_MIN_BARN) return false;

  const cost = Math.round(SALT_BUY_COST * price);
  if (world.treasury < cost) return false;

  const gain = addSalt(world, Math.round(SALT_BUY_AMOUNT * price));
  if (gain <= 0) return false;

  world.treasury -= cost;
  recordCaravan(
    world,
    `привёз соль (+${gain} мешков, −${cost} из казны, ${seasonLabel(season)})`,
  );
  markCaravanDay(world);
  return true;
}

function tryIronTrade(world: World, season: Season, barnFood: number, price: number): boolean {
  if (season !== "spring" && season !== "autumn") return false;

  if (
    world.ironStock >= IRON_MIN_FOR_SELL &&
    world.treasury < TREASURY_CAP - IRON_SELL_GAIN &&
    barnFood >= MIN_BARN_FOR_EXPORT
  ) {
    const sold = removeIron(world, IRON_SELL_AMOUNT);
    if (sold >= IRON_SELL_AMOUNT) {
      const gain = Math.round(IRON_SELL_GAIN * price);
      world.treasury = Math.min(TREASURY_CAP, world.treasury + gain);
      recordCaravan(
        world,
        `купил железо (${sold} слитков, +${gain} мер в казну, ${seasonLabel(season)})`,
      );
      markCaravanDay(world);
      return true;
    }
  }

  if (world.ironStock >= 10 || barnFood < SALT_MIN_BARN) return false;

  const cost = Math.round(IRON_BUY_COST * price);
  if (world.treasury < cost) return false;

  const gain = addIron(world, Math.round(IRON_BUY_AMOUNT * price));
  if (gain <= 0) return false;

  world.treasury -= cost;
  recordCaravan(
    world,
    `привёз железо (+${gain} слитков, −${cost} из казны, ${seasonLabel(season)})`,
  );
  markCaravanDay(world);
  return true;
}

function tryCrisisGrain(world: World, season: Season, barnFood: number, price: number): boolean {
  if (barnFood >= CRISIS_BARN || world.treasury < CRISIS_TREASURY_COST) return false;

  const foodGain = Math.round(CRISIS_FOOD_BASE * price);
  const barn = getBarnTile(world);
  if (!barn) return false;

  world.treasury -= CRISIS_TREASURY_COST;
  barn.food = Math.min(barn.maxFood, barn.food + foodGain);
  syncBarnStat(world);
  recordCaravan(
    world,
    `привёз зерно (+${foodGain} мер, −${CRISIS_TREASURY_COST} из казны, ${seasonLabel(season)})`,
  );
  markCaravanDay(world);
  return true;
}

function tryCraftExport(world: World, season: Season, barnFood: number, price: number): boolean {
  if (
    world.craftStock < MIN_CRAFT_FOR_EXPORT ||
    barnFood < MIN_BARN_FOR_EXPORT ||
    world.treasury >= TREASURY_CAP - EXPORT_TREASURY_BASE
  ) {
    return false;
  }

  const batch = Math.min(EXPORT_BATCH, world.craftStock - 6);
  if (batch < EXPORT_BATCH) return false;

  const treasuryGain = Math.round(EXPORT_TREASURY_BASE * price);
  world.craftStock -= batch;
  world.treasury = Math.min(TREASURY_CAP, world.treasury + treasuryGain);
  recordCaravan(
    world,
    `увёз ${batch} изделий (+${treasuryGain} мер в казну, ${seasonLabel(season)})`,
  );
  markCaravanDay(world);
  return true;
}

/** Редкие визиты караванов: сезонные маршруты (соль, железо, зерно, изделия) */
export function tickDailyCaravan(world: World): void {
  if (
    world.lastCaravanDay > 0 &&
    world.stats.day - world.lastCaravanDay < CARAVAN_COOLDOWN_DAYS
  ) {
    return;
  }

  const season = seasonForDay(world.stats.day);
  if (!chance(world.rng, caravanArrivalChance(season))) return;
  if (!getBarnTile(world)) return;

  const barnFood = barnStock(world);
  const price = seasonalPriceFactor(season);

  if (season === "winter") {
    tryCrisisGrain(world, season, barnFood, price);
    return;
  }

  if (barnFood < CRISIS_BARN && tryCrisisGrain(world, season, barnFood, price)) return;

  if ((season === "summer" || season === "autumn") && trySaltTrade(world, season, barnFood, price)) {
    return;
  }
  if ((season === "spring" || season === "autumn") && tryIronTrade(world, season, barnFood, price)) {
    return;
  }
  if (tryCraftExport(world, season, barnFood, price)) return;
  if (season === "spring" && trySaltTrade(world, season, barnFood, price)) return;
}
