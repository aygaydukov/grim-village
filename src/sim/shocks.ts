import { recordShock } from "./events";
import { barnStock } from "./map";
import { DAYS_PER_SEASON, seasonForDay } from "./season";
import type { ActiveShock, World } from "./types";
import { chance } from "./util";

/** Множитель регена еды от активного шока (1 = без эффекта). */
export function foodRegenShockFactor(world: World): number {
  return world.activeShock?.regenFactor ?? 1;
}

/** Краткая подпись для HUD */
export function shockLabel(world: World): string | null {
  if (!world.activeShock) return null;
  if (world.activeShock.kind === "crop_failure") {
    const d = world.activeShock.daysLeft;
    return d === 1 ? "неурожай" : `неурожай (${d} дн.)`;
  }
  return null;
}

/**
 * Ежедневный тик шоков: затухание и редкий старт неурожая в осень/зиму.
 * Вызывать сразу после инкремента `stats.day`.
 */
export function tickDailyShocks(world: World): void {
  if (world.activeShock) {
    world.activeShock.daysLeft -= 1;
    if (world.activeShock.daysLeft <= 0) {
      world.activeShock = null;
    }
  }

  const day = world.stats.day;
  const dayInSeason = (day - 1) % DAYS_PER_SEASON;
  if (dayInSeason !== 0) return;
  if (world.activeShock) return;

  const season = seasonForDay(day);
  if (season !== "autumn" && season !== "winter") return;

  const barn = barnStock(world);
  let chanceValue = season === "autumn" ? 0.035 : 0.025;
  if (barn < 35) chanceValue += 0.05;
  if (barn < 20) chanceValue += 0.07;

  if (!chance(world.rng, chanceValue)) return;

  const shock = createCropFailure(world, season);
  world.activeShock = shock;
  recordShock(
    world,
    "неурожай",
    season === "autumn"
      ? "урожай подвёл — лес и поле скудеют"
      : "зима жмёт — добыча еды замедлена",
  );
}

function createCropFailure(
  world: World,
  season: "autumn" | "winter",
): ActiveShock {
  const daysLeft = season === "autumn" ? 2 + Math.floor(world.rng() * 2) : 3 + Math.floor(world.rng() * 2);
  const regenFactor = 0.52 + world.rng() * 0.08;
  return { kind: "crop_failure", daysLeft, regenFactor };
}
