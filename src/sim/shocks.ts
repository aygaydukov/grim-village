import { killAgent } from "./agent";
import { recordDeath, recordShock } from "./events";
import { barnStock } from "./map";
import { DAYS_PER_SEASON, seasonForDay } from "./season";
import type { ActiveShock, Agent, World } from "./types";
import { chance } from "./util";

const EPIDEMIC_COOLDOWN_DAYS = 120;

/** Активна ли эпидемия */
export function isEpidemicActive(world: World): boolean {
  return world.activeShock?.kind === "epidemic";
}

/** Живые старцы (профессия elder или возраст ≥ 65) */
export function countLivingElders(world: World): number {
  let n = 0;
  for (const a of world.agents) {
    if (!a.alive) continue;
    if (a.profession === "elder" || a.age >= 65) n += 1;
  }
  return n;
}

/** Множитель смертности от лекарей-старцев (1 = без эффекта) */
export function epidemicHealerMultiplier(world: World): number {
  const elders = countLivingElders(world);
  if (elders === 0) return 1;
  let mul = 0.68;
  if (elders >= 2) mul *= 0.82;
  const starosta = world.starostaId != null
    ? world.agents.find((a) => a.id === world.starostaId)
    : null;
  if (
    starosta?.alive &&
    (starosta.profession === "elder" || starosta.age >= 65)
  ) {
    mul *= 0.72;
  }
  return mul;
}

/** Множитель регена еды от активного шока (1 = без эффекта). */
export function foodRegenShockFactor(world: World): number {
  const shock = world.activeShock;
  if (!shock || shock.kind !== "crop_failure") return 1;
  return shock.regenFactor;
}

/** Краткая подпись для HUD */
export function shockLabel(world: World): string | null {
  const shock = world.activeShock;
  if (!shock) return null;
  if (shock.kind === "crop_failure") {
    const d = shock.daysLeft;
    return d === 1 ? "неурожай" : `неурожай (${d} дн.)`;
  }
  if (shock.kind === "epidemic") {
    const d = shock.daysLeft;
    const elders = countLivingElders(world);
    const quarantine = elders > 0 ? "карантин · старцы лечат" : "карантин";
    const base = d === 1 ? "эпидемия" : `эпидемия (${d} дн.)`;
    return `${base} · ${quarantine}`;
  }
  return null;
}

/**
 * Ежедневный тик шоков: затухание и редкий старт неурожая / эпидемии.
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
  if (season === "autumn" || season === "winter") {
    maybeStartCropFailure(world, season);
  } else if (season === "spring" || season === "summer") {
    maybeStartEpidemic(world, season);
  }
}

/** Смерти от болезни во время активной эпидемии — один тик на день. */
export function tickEpidemicMortality(world: World): void {
  const shock = world.activeShock;
  if (!shock || shock.kind !== "epidemic") return;

  const saltMul =
    world.saltStock >= 8 ? 0.45 : world.saltStock >= 3 ? 0.72 : 1;
  const rate = shock.mortalityRate * saltMul * epidemicHealerMultiplier(world);

  for (const agent of world.agents) {
    if (!agent.alive) continue;
    const vuln = epidemicVulnerability(agent);
    if (!chance(world.rng, rate * vuln)) continue;
    killAgent(agent, "болезнь");
    world.stats.dead += 1;
    recordDeath(world, agent, "болезнь");
  }
}

function epidemicVulnerability(agent: Agent): number {
  if (agent.age < 3 || agent.profession === "child") return 1.55;
  if (agent.age >= 65 || agent.profession === "elder") return 1.35;
  return 1;
}

function maybeStartCropFailure(
  world: World,
  season: "autumn" | "winter",
): void {
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

function maybeStartEpidemic(
  world: World,
  season: "spring" | "summer",
): void {
  const day = world.stats.day;
  if (day - world.lastEpidemicDay < EPIDEMIC_COOLDOWN_DAYS) return;

  const alive = world.stats.alive;
  if (alive < 15) return;

  let chanceValue = season === "spring" ? 0.02 : 0.012;
  if (alive >= 22) chanceValue += 0.008;
  if (alive >= 26) chanceValue += 0.006;

  if (!chance(world.rng, chanceValue)) return;

  const daysLeft = 5 + Math.floor(world.rng() * 4);
  const mortalityRate = 0.022 + world.rng() * 0.012;
  world.activeShock = createEpidemic(daysLeft, mortalityRate);
  world.lastEpidemicDay = day;
  const elders = countLivingElders(world);
  const elderNote =
    elders > 0
      ? `старцы у постелей (${elders}) — карантин в хижинах`
      : "карантин в хижинах — старцев мало";
  recordShock(
    world,
    "эпидемия",
    season === "spring"
      ? `чума бродит по избе и полю; ${elderNote}`
      : `лихорадка жмёт на деревню; ${elderNote}`,
  );
}

function createCropFailure(
  world: World,
  season: "autumn" | "winter",
): ActiveShock {
  const daysLeft =
    season === "autumn" ? 2 + Math.floor(world.rng() * 2) : 3 + Math.floor(world.rng() * 2);
  const regenFactor = 0.52 + world.rng() * 0.08;
  return { kind: "crop_failure", daysLeft, regenFactor };
}

function createEpidemic(daysLeft: number, mortalityRate: number): ActiveShock {
  return { kind: "epidemic", daysLeft, mortalityRate };
}
