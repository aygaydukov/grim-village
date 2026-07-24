import { barnPos, barnStock, findNearestWildFood } from "./map";
import type { Agent, Profession, TaskKind, World } from "./types";
import { chance, clamp, dist } from "./util";

const CHILD_AGE = 12;
const ADULT_AGE = 16;

function isChildAge(age: number): boolean {
  return age < CHILD_AGE;
}

function isAdultAge(age: number): boolean {
  return age >= ADULT_AGE;
}

/** Макс. удаление от якоря профессии */
export function leashRadius(agent: Agent): number {
  switch (agent.profession) {
    case "child":
      return 6;
    case "elder":
      return 5.5;
    case "keeper":
      return 7;
    case "laborer":
      return 11;
    case "gatherer":
      return 16;
  }
}

/** Точка, вокруг которой крутится жизнь */
export function anchorPoint(world: World, agent: Agent): { x: number; y: number } {
  if (agent.profession === "keeper" || agent.profession === "gatherer") {
    return barnPos(world);
  }
  return { x: agent.homeX, y: agent.homeY };
}

export function distanceFromAnchor(world: World, agent: Agent): number {
  const a = anchorPoint(world, agent);
  return dist(agent.x, agent.y, a.x, a.y);
}

export function isBeyondLeash(world: World, agent: Agent): boolean {
  return distanceFromAnchor(world, agent) > leashRadius(agent);
}

export function assignProfession(agent: Agent, world: World): Profession {
  if (isChildAge(agent.age)) return "child";
  if (agent.age >= 65) return "elder";

  const adults = world.agents.filter((a) => a.alive && isAdultAge(a.age) && a.age < 65);
  const gatherers = adults.filter((a) => a.profession === "gatherer").length;
  const keepers = adults.filter((a) => a.profession === "keeper").length;
  const laborers = adults.filter((a) => a.profession === "laborer").length;

  // Квоты: ~40% сборщики, ~20% сторожа, остальное батраки
  const n = Math.max(1, adults.length);
  if (keepers / n < 0.18) return "keeper";
  if (gatherers / n < 0.42) return "gatherer";
  if (laborers / n < 0.45) return "laborer";

  const roll = world.rng();
  if (roll < 0.45) return "gatherer";
  if (roll < 0.65) return "keeper";
  return "laborer";
}

export function pickProfessionForNew(world: World, age: number): Profession {
  if (isChildAge(age)) return "child";
  if (age >= 65) return "elder";
  const roll = world.rng();
  if (roll < 0.4) return "gatherer";
  if (roll < 0.55) return "keeper";
  return "laborer";
}

export function maybeReassignProfession(world: World, agent: Agent): void {
  if (!agent.alive) return;
  if (isChildAge(agent.age)) {
    agent.profession = "child";
    return;
  }
  if (agent.age >= 65) {
    agent.profession = "elder";
    return;
  }
  // Подросток вырос — выдать работу
  if (agent.profession === "child" && isAdultAge(agent.age)) {
    agent.profession = pickProfessionForNew(world, agent.age);
  }
}

/** Локальная точка патруля / игры внутри leash */
export function setLocalTarget(world: World, agent: Agent, radiusScale = 0.7): void {
  const anchor = anchorPoint(world, agent);
  const r = leashRadius(agent) * radiusScale;
  for (let i = 0; i < 10; i++) {
    const angle = world.rng() * Math.PI * 2;
    const d = world.rng() * r;
    const tx = anchor.x + Math.cos(angle) * d;
    const ty = anchor.y + Math.sin(angle) * d;
    if (tx < 1 || ty < 1 || tx >= world.width - 1 || ty >= world.height - 1) continue;
    const tile = world.tiles[Math.floor(ty) * world.width + Math.floor(tx)];
    if (tile && tile.kind !== "water") {
      agent.targetX = tx;
      agent.targetY = ty;
      return;
    }
  }
  agent.targetX = clamp(anchor.x + (world.rng() - 0.5) * 2, 1, world.width - 2);
  agent.targetY = clamp(anchor.y + (world.rng() - 0.5) * 2, 1, world.height - 2);
}

export function findWorkFood(
  world: World,
  agent: Agent,
): { x: number; y: number } | null {
  const maxDist = agent.profession === "gatherer" ? 15 : agent.profession === "laborer" ? 10 : 6;
  const anchor = anchorPoint(world, agent);
  // Ищем еду относительно якоря, чтобы не утаскивать в даль
  return findNearestWildFood(world, anchor.x, anchor.y, maxDist);
}

/**
 * Решает дневную задачу по профессии.
 * Критические нужды (еда/сон) обрабатываются снаружи.
 */
export function planWorkTask(world: World, agent: Agent): TaskKind {
  const stock = barnStock(world);
  const night = world.stats.timeOfDay < 0.22 || world.stats.timeOfDay > 0.78;

  if (night) return "rest";

  switch (agent.profession) {
    case "child":
      return chance(world.rng, 0.55) ? "play" : "idle";

    case "elder":
      if (stock < 25 && chance(world.rng, 0.08)) return "gather";
      return chance(world.rng, 0.4) ? "patrol" : "idle";

    case "keeper":
      if (agent.carriedFood > 0) return "deposit";
      // Сторож подбирает только рядом, если амбар не полон
      if (stock < 160 && chance(world.rng, 0.2) && findWorkFood(world, agent)) return "gather";
      return chance(world.rng, 0.65) ? "patrol" : "idle";

    case "gatherer":
      if (agent.carriedFood > 0) return "deposit";
      if (stock < 200 && agent.energy > 35 && agent.hunger < 55) {
        if (findWorkFood(world, agent) || stock < 40) return "gather";
      }
      return chance(world.rng, 0.35) ? "patrol" : "idle";

    case "laborer":
      if (agent.carriedFood > 0) return "deposit";
      // Батрак помогает собирать, когда запасы средние/низкие
      if (stock < 90 && agent.energy > 40 && agent.hunger < 50 && findWorkFood(world, agent)) {
        return "gather";
      }
      return chance(world.rng, 0.45) ? "patrol" : "idle";
  }
}

export function professionLabel(p: Profession): string {
  switch (p) {
    case "child":
      return "ребёнок";
    case "gatherer":
      return "сборщик";
    case "laborer":
      return "батрак";
    case "keeper":
      return "сторож амбара";
    case "elder":
      return "старец";
  }
}

export function taskLabel(t: TaskKind): string {
  switch (t) {
    case "idle":
      return "без дел у дома";
    case "patrol":
      return "обходит участок";
    case "returnHome":
      return "возвращается";
    case "gather":
      return "сбор для амбара";
    case "deposit":
      return "сдача в амбар";
    case "eat":
      return "добывает еду";
    case "rest":
      return "отдых / сон";
    case "social":
      return "ищет пару";
    case "play":
      return "играет у дома";
  }
}

export function countByProfession(world: World): Record<Profession, number> {
  const out: Record<Profession, number> = {
    child: 0,
    gatherer: 0,
    laborer: 0,
    keeper: 0,
    elder: 0,
  };
  for (const a of world.agents) {
    if (!a.alive) continue;
    out[a.profession] += 1;
  }
  return out;
}

function workingAdults(world: World): Agent[] {
  return world.agents.filter(
    (a) =>
      a.alive &&
      isAdultAge(a.age) &&
      a.age < 65 &&
      (a.profession === "gatherer" || a.profession === "keeper" || a.profession === "laborer"),
  );
}

function gathererScore(agent: Agent): number {
  let score = agent.energy * 0.6 - agent.hunger * 0.4;
  if (agent.pregnant > 0) score -= 40;
  if (agent.carriedFood > 0) score -= 25;
  if (agent.cooldown > 0) score -= 10;
  return score;
}

/** Целевые квоты профессий от запасов амбара */
export function laborTargets(
  world: World,
): { gatherer: number; keeper: number; laborer: number } {
  const adults = world.agents.filter((a) => a.alive && isAdultAge(a.age) && a.age < 65);
  const n = Math.max(1, adults.length);
  const stock = barnStock(world);

  let gatherRatio = 0.42;
  let keeperRatio = 0.18;
  if (stock < 25) {
    gatherRatio = 0.58;
    keeperRatio = 0.14;
  } else if (stock < 50) {
    gatherRatio = 0.5;
    keeperRatio = 0.16;
  } else if (stock > 140) {
    gatherRatio = 0.3;
    keeperRatio = 0.24;
  } else if (stock > 90) {
    gatherRatio = 0.36;
    keeperRatio = 0.2;
  }

  const gatherer = Math.max(1, Math.round(n * gatherRatio));
  const keeper = Math.max(1, Math.min(Math.round(n * keeperRatio), n - gatherer - 1));
  const laborer = Math.max(0, n - gatherer - keeper);
  return { gatherer, keeper, laborer };
}

/**
 * Ежедневная перебалансировка: при низком амбаре больше сборщиков,
 * при избытке — батраки и сторожа.
 */
export function rebalanceVillageLabor(world: World): void {
  const workers = workingAdults(world);
  if (workers.length < 3) return;

  const targets = laborTargets(world);
  const ranked = workers.slice().sort((a, b) => gathererScore(b) - gathererScore(a));

  for (let i = 0; i < ranked.length; i++) {
    const agent = ranked[i]!;
    if (i < targets.gatherer) agent.profession = "gatherer";
    else if (i < targets.gatherer + targets.keeper) agent.profession = "keeper";
    else agent.profession = "laborer";
  }
}
