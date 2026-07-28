import { recordCaravan } from "./events";
import { barnStock, getBarnTile, syncBarnStat } from "./map";
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

/** Сезонный множитель цен: осень/лето — караваны щедрее */
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
      return 0.17;
    case "autumn":
      return 0.2;
    case "spring":
      return 0.1;
    case "winter":
      return 0.06;
  }
}

/** Редкие визиты караванов: зерно в кризис или вывоз изделий */
export function tickDailyCaravan(world: World): void {
  if (
    world.lastCaravanDay > 0 &&
    world.stats.day - world.lastCaravanDay < CARAVAN_COOLDOWN_DAYS
  ) {
    return;
  }

  const season = seasonForDay(world.stats.day);
  if (!chance(world.rng, caravanArrivalChance(season))) return;

  const barn = getBarnTile(world);
  if (!barn) return;

  const barnFood = barnStock(world);
  const price = seasonalPriceFactor(season);

  // Кризис: караван продаёт зерно за казну
  if (barnFood < CRISIS_BARN && world.treasury >= CRISIS_TREASURY_COST) {
    const foodGain = Math.round(CRISIS_FOOD_BASE * price);
    world.treasury -= CRISIS_TREASURY_COST;
    barn.food = Math.min(barn.maxFood, barn.food + foodGain);
    syncBarnStat(world);
    recordCaravan(
      world,
      `привёз зерно (+${foodGain} мер, −${CRISIS_TREASURY_COST} из казны, ${seasonLabel(season)})`,
    );
    world.lastCaravanDay = world.stats.day;
    return;
  }

  // Экспорт изделий при достатке еды
  if (
    world.craftStock >= MIN_CRAFT_FOR_EXPORT &&
    barnFood >= MIN_BARN_FOR_EXPORT &&
    world.treasury < TREASURY_CAP - EXPORT_TREASURY_BASE
  ) {
    const batch = Math.min(EXPORT_BATCH, world.craftStock - 6);
    if (batch < EXPORT_BATCH) return;

    const treasuryGain = Math.round(EXPORT_TREASURY_BASE * price);
    world.craftStock -= batch;
    world.treasury = Math.min(TREASURY_CAP, world.treasury + treasuryGain);
    recordCaravan(
      world,
      `увёз ${batch} изделий (+${treasuryGain} мер в казну, ${seasonLabel(season)})`,
    );
    world.lastCaravanDay = world.stats.day;
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
