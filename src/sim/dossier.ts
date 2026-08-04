import { ageLabel, childrenOf, isAdult, isChild } from "./agent";
import { policyLabel, starostaName } from "./government";
import { countByProfession, professionLabel, taskLabel } from "./jobs";
import { fullName, SEX_LABELS, STATE_LABELS } from "./names";
import { seasonForDay, seasonNote } from "./season";
import type { Agent, Profession, StarostaPolicy, World } from "./types";

export interface VillageReport {
  name: string;
  day: number;
  phase: string;
  alive: number;
  dead: number;
  births: number;
  children: number;
  adults: number;
  elders: number;
  men: number;
  women: number;
  pregnant: number;
  hungry: number;
  sleeping: number;
  working: number;
  couples: number;
  barnFood: number;
  barnCapacity: number;
  wildFood: number;
  forestTiles: number;
  hutCount: number;
  carriedFood: number;
  treasury: number;
  craftStock: number;
  saltStock: number;
  ironStock: number;
  starosta: string | null;
  starostaPolicy: StarostaPolicy;
  starostaPolicyLabel: string;
  avgHunger: number;
  avgEnergy: number;
  professions: Record<Profession, number>;
  outlook: string;
  chronicle: string;
  deathCauses: Record<string, number>;
  immigrationArrivals: number;
  stabilityNote: string;
  settlementVersion: number;
  stuckAgents: number;
}

export function timePhase(world: World): string {
  const t = world.stats.timeOfDay;
  if (t < 0.2 || t > 0.8) return "ночь";
  if (t < 0.28) return "утро";
  if (t > 0.72) return "сумерки";
  return "день";
}

/** Часы суток: 0.0 = 00:00, 0.5 = 12:00 */
export function formatClock(timeOfDay: number): string {
  const totalMinutes = Math.floor(((timeOfDay % 1) + 1) % 1 * 24 * 60);
  const h = Math.floor(totalMinutes / 60) % 24;
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function timeOfDayNote(world: World): string {
  const phase = timePhase(world);
  const season = seasonNote(seasonForDay(world.stats.day));
  switch (phase) {
    case "ночь":
      return `${season} · холод · еда почти не растёт · спят в хижинах`;
    case "утро":
      return `${season} · светлеет · пора к работе`;
    case "сумерки":
      return `${season} · темнеет · пора к дому`;
    default:
      return `${season} · тепло · сбор и рост еды`;
  }
}

export function collectVillageReport(world: World): VillageReport {
  const alive = world.agents.filter((a) => a.alive);
  let children = 0;
  let adults = 0;
  let elders = 0;
  let men = 0;
  let women = 0;
  let pregnant = 0;
  let hungry = 0;
  let sleeping = 0;
  let working = 0;
  let hungerSum = 0;
  let energySum = 0;
  let carriedFood = 0;
  const seenCouples = new Set<string>();

  for (const a of alive) {
    if (a.sex === "male") men += 1;
    else women += 1;
    if (isChild(a)) children += 1;
    else if (a.age >= 65) elders += 1;
    else if (isAdult(a)) adults += 1;
    else adults += 1;

    if (a.pregnant > 0) pregnant += 1;
    if (a.hunger > 70) hungry += 1;
    if (a.state === "sleep") sleeping += 1;
    if (a.state === "seekGather" || a.state === "gather" || a.state === "deposit" || a.task === "gather")
      working += 1;
    hungerSum += a.hunger;
    energySum += a.energy;
    carriedFood += a.carriedFood;

    if (a.spouseId != null) {
      const lo = Math.min(a.id, a.spouseId);
      const hi = Math.max(a.id, a.spouseId);
      seenCouples.add(`${lo}:${hi}`);
    }
  }

  let wildFood = 0;
  let forestTiles = 0;
  let hutCount = 0;
  let barnCapacity = 220;
  for (const tile of world.tiles) {
    if (tile.kind === "forest") {
      forestTiles += 1;
      wildFood += tile.food;
    } else if (tile.kind === "grass") {
      wildFood += tile.food;
    } else if (tile.kind === "hut") {
      hutCount += 1;
    } else if (tile.kind === "barn") {
      barnCapacity = tile.maxFood;
    }
  }

  const barnFood = world.stats.barnFood;
  const n = Math.max(1, alive.length);
  const avgHunger = hungerSum / n;
  const avgEnergy = energySum / n;
  const professions = countByProfession(world);
  const deathCauses = collectDeathCauses(world);
  const immigrationArrivals = countImmigrationArrivals(world);
  const stuckAgents = countStuckAgents(world);
  const stabilityNote = buildStabilityNote(world, deathCauses, immigrationArrivals, stuckAgents);

  let outlook: string;
  if (alive.length === 0) outlook = "Деревня мертва. Остались только следы ног в грязи.";
  else if (barnFood < 8 && wildFood < 15) outlook = "Запасы на исходе. Голод уже смотрит в окна.";
  else if (hungry > alive.length * 0.4) outlook = "Многие ходят на пустой желудок. Зима ещё не пришла — а уже пахнет бедой.";
  else if (barnFood > 80) outlook = "Амбар тяжёлый. Пока земля кормит — люди живут.";
  else if (stabilityNote) outlook = stabilityNote;
  else outlook = "Деревня дышит ровно. Пока ровно.";

  const jobsLine = `Роли: сборщики ${professions.gatherer}, батраки ${professions.laborer}, сторожа ${professions.keeper}, ремесленники ${professions.artisan}, старцы ${professions.elder}, дети ${professions.child}.`;
  const starosta = starostaName(world);

  const chronicle = [
    `Поселение стоит ${world.stats.day} ${dayWord(world.stats.day)}.`,
    hutCount > 0 ? `Хижин: ${hutCount}.` : "Крова почти нет.",
    `В амбаре ${barnFood} из ${barnCapacity} мер еды.`,
    world.treasury > 0 ? `В казне старосты ${world.treasury} мер.` : "Казна пуста — десятина ещё не накопилась.",
    world.craftStock > 0 ? `В мастерской ${world.craftStock} изделий.` : "",
    world.saltStock > 0 ? `Соль в амбаре: ${Math.round(world.saltStock)} мешков.` : "",
    world.ironStock > 0 ? `Железо на складе: ${Math.round(world.ironStock)} слитков.` : "",
    starosta ? `Староста: ${starosta}.` : "Старосту пока не назначили.",
    `Политика: ${policyLabel(world.starostaPolicy)}.`,
    `В лесу и на лугах ещё ${wildFood} дикой пищи.`,
    jobsLine,
    world.stats.births > 0
      ? `За память деревни родилось ${world.stats.births}.`
      : "Новых жизней пока не было.",
    world.stats.dead > 0
      ? `Земля приняла ${world.stats.dead}${formatDeathCauseSummary(deathCauses)}.`
      : "Смерть пока молчит.",
  ].join(" ");

  return {
    name: "Безымянная деревня",
    day: world.stats.day,
    phase: timePhase(world),
    alive: alive.length,
    dead: world.stats.dead,
    births: world.stats.births,
    children,
    adults,
    elders,
    men,
    women,
    pregnant,
    hungry,
    sleeping,
    working,
    couples: seenCouples.size,
    barnFood,
    barnCapacity,
    wildFood,
    forestTiles,
    hutCount,
    carriedFood,
    treasury: world.treasury,
    craftStock: world.craftStock,
    saltStock: world.saltStock,
    ironStock: world.ironStock,
    starosta,
    starostaPolicy: world.starostaPolicy,
    starostaPolicyLabel: policyLabel(world.starostaPolicy),
    avgHunger,
    avgEnergy,
    professions,
    outlook,
    chronicle,
    deathCauses,
    immigrationArrivals,
    stabilityNote,
    settlementVersion: world.settlementVersion,
    stuckAgents,
  };
}

function countStuckAgents(world: World): number {
  let n = 0;
  for (const a of world.agents) {
    if (!a.alive) continue;
    if ((a.stuckTicks ?? 0) >= 60) n += 1;
  }
  return n;
}

function collectDeathCauses(world: World): Record<string, number> {
  const causes: Record<string, number> = {};
  for (const agent of world.agents) {
    if (agent.alive || !agent.deathCause) continue;
    causes[agent.deathCause] = (causes[agent.deathCause] ?? 0) + 1;
  }
  return causes;
}

function countImmigrationArrivals(world: World): number {
  let total = 0;
  for (const snap of world.dayHistory) {
    for (const event of snap.events ?? []) {
      if (event.kind !== "immigration") continue;
      const match = event.detail?.match(/(\d+)/);
      total += match ? Number(match[1]) : 1;
    }
  }
  return total;
}

function buildStabilityNote(
  world: World,
  deathCauses: Record<string, number>,
  immigrationArrivals: number,
  stuckAgents: number,
): string {
  const totalDead = world.stats.dead;
  if (stuckAgents >= 2) {
    return `Тревога: ${stuckAgents} жителей застряли у воды или за участком — проверь путь и leash.`;
  }

  if (totalDead === 0) return "";

  const hungerDeaths =
    (deathCauses["голод"] ?? 0) + (deathCauses["холод и истощение"] ?? 0);

  if (world.stats.alive === 0) {
    return "Поселение вымерло — нужен перезапуск и разбор механик.";
  }

  if (hungerDeaths >= Math.ceil(totalDead * 0.55) && immigrationArrivals > 0) {
    return "Тревога: смерти в основном от голода, пополнение — миграция. Внутренний цикл слаб.";
  }

  if (hungerDeaths >= Math.ceil(totalDead * 0.6)) {
    return "Тревога: большинство смертей от голода — проверь сбор, профессии и потребление.";
  }

  const diseaseDeaths = deathCauses["болезнь"] ?? 0;
  if (diseaseDeaths >= Math.ceil(totalDead * 0.45) && hungerDeaths < Math.ceil(totalDead * 0.35)) {
    return "Эпидемия отняла жизни — соль в амбаре снижает смертность; это не провал еды.";
  }

  if (immigrationArrivals > totalDead && world.stats.births === 0) {
    return "Население держится на беженцах — рождений нет, внутренняя устойчивость под вопросом.";
  }

  return "";
}

function formatDeathCauseSummary(causes: Record<string, number>): string {
  const entries = Object.entries(causes).sort((a, b) => b[1] - a[1]);
  if (entries.length === 0) return "";
  const top = entries
    .slice(0, 3)
    .map(([cause, n]) => `${cause} ${n}`)
    .join(", ");
  return ` (${top})`;
}

function dayWord(n: number): string {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return "день";
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return "дня";
  return "дней";
}

/** Короткий «текст о жителе» для карточки */
export function agentChronicle(agent: Agent, world: World): string {
  const sex = SEX_LABELS[agent.sex];
  const age = ageLabel(agent.age);
  const state = STATE_LABELS[agent.state] ?? agent.state;
  const kids = childrenOf(world, agent.id).filter((k) => k.alive);
  const spouse = agent.spouseId != null ? world.agents.find((a) => a.id === agent.spouseId) : null;

  const lines: string[] = [];

  if (!agent.alive) {
    lines.push(
      `${fullName(agent)} — ${sex}, ${age}. Больше не ходит по земле.`,
      agent.deathCause ? `Причина: ${agent.deathCause}.` : "Причина смерти неизвестна.",
    );
    return lines.join(" ");
  }

  lines.push(
    `${fullName(agent)} — ${sex}, ${age} (${agent.age.toFixed(0)} лет), ${professionLabel(agent.profession)}. Сейчас ${taskLabel(agent.task)} (${state}).`,
  );

  if (spouse?.alive) {
    lines.push(`Супруг(а): ${fullName(spouse)}.`);
  } else if (agent.spouseId != null) {
    lines.push("Супруг(а) похоронен(а).");
  } else if (isAdult(agent)) {
    lines.push("Пары нет — или ещё не нашёл(а).");
  }

  if (kids.length > 0) {
    lines.push(`Живых детей: ${kids.map((k) => fullName(k)).join(", ")}.`);
  }

  if (agent.motherId != null || agent.fatherId != null) {
    const m = agent.motherId != null ? world.agents.find((a) => a.id === agent.motherId) : null;
    const f = agent.fatherId != null ? world.agents.find((a) => a.id === agent.fatherId) : null;
    const parents = [m ? fullName(m) : null, f ? fullName(f) : null].filter(Boolean).join(" и ");
    if (parents) lines.push(`Родители: ${parents}.`);
  }

  if (agent.pregnant > 0) {
    lines.push("Носит ребёнка. Шаги тяжелее обычного.");
  }

  if (agent.hunger > 80) lines.push("Голод грызёт изнутри.");
  else if (agent.hunger > 55) lines.push("Уже поглядывает на амбар.");
  else if (agent.hunger < 25) lines.push("Сыт(а) — редкая удача.");

  if (agent.energy < 25) lines.push("Силы на исходе.");
  else if (agent.energy > 80) lines.push("Ещё может таскать мешки.");

  if (agent.carriedFood > 0) {
    lines.push(`Несёт ${agent.carriedFood} ед. еды в амбар.`);
  }

  return lines.join(" ");
}

export function healthLabel(hunger: number, energy: number): string {
  if (hunger > 85 || energy < 15) return "на грани";
  if (hunger > 65 || energy < 35) return "плохо";
  if (hunger > 45 || energy < 55) return "терпимо";
  return "крепко";
}
