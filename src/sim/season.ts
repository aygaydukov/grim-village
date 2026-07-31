import { DAYS_PER_SEASON as DAYS_PER_SEASON_FROM_TIME } from "./time";

/** Четыре сезона по календарю деревни (год = 4 сезона из time.ts). */
export type Season = "spring" | "summer" | "autumn" | "winter";

export const DAYS_PER_SEASON = DAYS_PER_SEASON_FROM_TIME;

export const SEASON_LABELS: Record<Season, string> = {
  spring: "весна",
  summer: "лето",
  autumn: "осень",
  winter: "зима",
};

/** Множитель регена дикой еды — мягкий, без «голодной зимы» в один день. */
export const SEASON_FOOD_FACTOR: Record<Season, number> = {
  spring: 1.05,
  summer: 1.15,
  autumn: 0.92,
  winter: 0.78,
};

const SEASONS: Season[] = ["spring", "summer", "autumn", "winter"];

export function seasonForDay(day: number): Season {
  const idx = Math.floor(Math.max(0, day - 1) / DAYS_PER_SEASON) % 4;
  return SEASONS[idx]!;
}

/** Первый день текущего сезона (1-based) */
export function seasonStartDay(day: number): number {
  return Math.floor(Math.max(0, day - 1) / DAYS_PER_SEASON) * DAYS_PER_SEASON + 1;
}

export function seasonFoodFactor(day: number): number {
  return SEASON_FOOD_FACTOR[seasonForDay(day)];
}

export function seasonNote(season: Season): string {
  switch (season) {
    case "spring":
      return "почки · еда просыпается";
    case "summer":
      return "жара · лес щедрее";
    case "autumn":
      return "урожай · запас на зиму";
    case "winter":
      return "мороз · еда растёт медленнее";
  }
}
