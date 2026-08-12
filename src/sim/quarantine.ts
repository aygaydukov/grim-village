import { isEpidemicActive } from "./shocks";
import type { Agent, World } from "./types";
import { dist } from "./util";

const HOME_RADIUS = 1.35;
/** Семей на одну больную избу — при большем числе открывается вторая */
const SICK_HUT_HOUSEHOLD_CAPACITY = 4;

function householdKey(agent: Agent): string {
  return `${Math.floor(agent.homeX)},${Math.floor(agent.homeY)}`;
}

function agentsInHousehold(world: World, agent: Agent): Agent[] {
  const key = householdKey(agent);
  return world.agents.filter((a) => a.alive && householdKey(a) === key);
}

/** Индивидуальные исключения: голод, еда в руках, дежурные */
function wouldQuarantineIndividually(agent: Agent): boolean {
  if (agent.profession === "elder" || agent.profession === "keeper") return false;
  if (agent.carriedFood > 0) return false;
  const eatAt = agent.pregnant > 0 ? 52 : 62;
  if (agent.hunger > eatAt - 4) return false;
  return true;
}

/** Семья под карантином, если хоть один взрослый в хижине должен изолироваться */
export function householdUnderQuarantine(world: World, agent: Agent): boolean {
  if (!isEpidemicActive(world)) return false;
  for (const a of agentsInHousehold(world, agent)) {
    if (wouldQuarantineIndividually(a)) return true;
  }
  return false;
}

/** Карантин: семья целиком в больную избу, кроме голода и дежурных */
export function shouldEpidemicQuarantine(world: World, agent: Agent): boolean {
  if (!isEpidemicActive(world)) return false;
  if (agent.profession === "elder" || agent.profession === "keeper") return false;
  if (!householdUnderQuarantine(world, agent)) return false;
  return wouldQuarantineIndividually(agent);
}

function countHutTiles(world: World): number {
  let n = 0;
  for (const tile of world.tiles) {
    if (tile.kind === "hut") n += 1;
  }
  return n;
}

/** Хижины, отсортированные по удалённости от амбара (дальние первыми) */
function farthestHuts(world: World, limit: number): { x: number; y: number }[] {
  const bx = world.barnX + 0.5;
  const by = world.barnY + 0.5;
  const huts: { x: number; y: number; d: number }[] = [];

  for (let y = 0; y < world.height; y++) {
    for (let x = 0; x < world.width; x++) {
      if (world.tiles[y * world.width + x]!.kind !== "hut") continue;
      const hx = x + 0.5;
      const hy = y + 0.5;
      huts.push({ x: hx, y: hy, d: Math.hypot(hx - bx, hy - by) });
    }
  }

  huts.sort((a, b) => b.d - a.d);
  return huts.slice(0, limit).map((h) => ({ x: h.x, y: h.y }));
}

/** Назначить больные избы — одна или две дальние хижины от амбара */
export function assignSickHut(world: World): void {
  const candidates = farthestHuts(world, 2);
  if (candidates.length === 0) {
    clearSickHut(world);
    return;
  }

  world.sickHutX = candidates[0]!.x;
  world.sickHutY = candidates[0]!.y;

  if (candidates.length >= 2 && countHutTiles(world) >= 6) {
    world.sickHut2X = candidates[1]!.x;
    world.sickHut2Y = candidates[1]!.y;
  } else {
    world.sickHut2X = null;
    world.sickHut2Y = null;
  }
}

export function clearSickHut(world: World): void {
  world.sickHutX = null;
  world.sickHutY = null;
  world.sickHut2X = null;
  world.sickHut2Y = null;
}

export function hasSickHut(world: World): boolean {
  return world.sickHutX != null && world.sickHutY != null;
}

export function hasSickHut2(world: World): boolean {
  return world.sickHut2X != null && world.sickHut2Y != null;
}

/** Сколько больных изб активно при эпидемии */
export function countActiveSickHuts(world: World): number {
  if (!isEpidemicActive(world) || !hasSickHut(world)) return 0;
  if (!hasSickHut2(world)) return 1;
  const households = quarantinedHouseholdKeys(world);
  return households.length > SICK_HUT_HOUSEHOLD_CAPACITY ? 2 : 1;
}

function quarantinedHouseholdKeys(world: World): string[] {
  const keys = new Set<string>();
  for (const a of world.agents) {
    if (!a.alive) continue;
    if (!householdUnderQuarantine(world, a)) continue;
    keys.add(householdKey(a));
  }
  return [...keys].sort();
}

function sickHutIndexForHousehold(world: World, key: string): 1 | 2 {
  if (!hasSickHut2(world)) return 1;
  const keys = quarantinedHouseholdKeys(world);
  if (keys.length <= SICK_HUT_HOUSEHOLD_CAPACITY) return 1;
  const idx = keys.indexOf(key);
  if (idx < 0) return 1;
  const mid = Math.ceil(keys.length / 2);
  return idx < mid ? 1 : 2;
}

function sickHutCoords(world: World, index: 1 | 2): { x: number; y: number } | null {
  if (index === 1) {
    if (!hasSickHut(world)) return null;
    return { x: world.sickHutX!, y: world.sickHutY! };
  }
  if (!hasSickHut2(world)) return null;
  return { x: world.sickHut2X!, y: world.sickHut2Y! };
}

/** Куда идти на отдых при карантине: больная изба или свой дом */
export function quarantineTarget(world: World, agent: Agent): { x: number; y: number } {
  if (
    isEpidemicActive(world) &&
    shouldEpidemicQuarantine(world, agent) &&
    hasSickHut(world)
  ) {
    const hutIdx = sickHutIndexForHousehold(world, householdKey(agent));
    const coords = sickHutCoords(world, hutIdx) ?? sickHutCoords(world, 1);
    if (coords) return coords;
  }
  return { x: agent.homeX, y: agent.homeY };
}

/** Житель у целевой хижины (дом или больная изба) */
export function isAtQuarantineSite(world: World, agent: Agent): boolean {
  const target = quarantineTarget(world, agent);
  const hx = Math.floor(target.x);
  const hy = Math.floor(target.y);
  if (hx < 0 || hy < 0 || hx >= world.width || hy >= world.height) return false;
  const tile = world.tiles[hy * world.width + hx];
  if (tile?.kind !== "hut") return false;
  return dist(agent.x, agent.y, target.x, target.y) <= HOME_RADIUS;
}

/** Житель у своей хижины (клетка hut под homeX/homeY) */
export function isAtHomeHut(world: World, agent: Agent): boolean {
  const hx = Math.floor(agent.homeX);
  const hy = Math.floor(agent.homeY);
  if (hx < 0 || hy < 0 || hx >= world.width || hy >= world.height) return false;
  const tile = world.tiles[hy * world.width + hx];
  if (tile?.kind !== "hut") return false;
  return dist(agent.x, agent.y, agent.homeX, agent.homeY) <= HOME_RADIUS;
}

/**
 * Механика изоляции: в эпидемию сон/отдых в больной избе сильнее снижает уязвимость.
 * Старцы и сторожа на посту не считаются «запертыми», но и не штрафуются.
 */
export function epidemicIsolationFactor(world: World, agent: Agent): number {
  if (!isEpidemicActive(world)) return 1;

  const atSickHut =
    hasSickHut(world) &&
    shouldEpidemicQuarantine(world, agent) &&
    isAtQuarantineSite(world, agent);

  if (atSickHut) {
    if (agent.state === "sleep") return 0.3;
    if (agent.state === "seekRest") return 0.42;
  }

  if (isAtHomeHut(world, agent)) {
    if (agent.state === "sleep") return 0.38;
    if (shouldEpidemicQuarantine(world, agent) && agent.state === "seekRest") {
      return 0.52;
    }
  }

  // Работа в поле во время карантина — чуть выше риск заразы
  if (
    shouldEpidemicQuarantine(world, agent) &&
    (agent.state === "gather" ||
      agent.state === "seekGather" ||
      agent.state === "patrol" ||
      agent.state === "wander")
  ) {
    return 1.18;
  }

  return 1;
}

/** Координаты хижин с изолированными жителями (для визуала) */
export function isolatedHutKeys(world: World): Set<string> {
  const keys = new Set<string>();
  if (!isEpidemicActive(world)) return keys;

  if (hasSickHut(world)) {
    keys.add(`${Math.floor(world.sickHutX!)},${Math.floor(world.sickHutY!)}`);
  }
  if (hasSickHut2(world) && countActiveSickHuts(world) >= 2) {
    keys.add(`${Math.floor(world.sickHut2X!)},${Math.floor(world.sickHut2Y!)}`);
  }

  for (const a of world.agents) {
    if (!a.alive) continue;
    if (!shouldEpidemicQuarantine(world, a)) continue;
    if (!isAtQuarantineSite(world, a)) continue;
    if (a.state !== "sleep" && a.state !== "seekRest") continue;
    const target = quarantineTarget(world, a);
    keys.add(`${Math.floor(target.x)},${Math.floor(target.y)}`);
  }
  return keys;
}

/** Сколько жителей сейчас в больной избе / изоляции (для инспектора) */
export function countHomeIsolated(world: World): number {
  if (!isEpidemicActive(world)) return 0;
  let n = 0;
  for (const a of world.agents) {
    if (!a.alive) continue;
    if (!shouldEpidemicQuarantine(world, a)) continue;
    if (!isAtQuarantineSite(world, a)) continue;
    if (a.state === "sleep" || a.state === "seekRest") n += 1;
  }
  return n;
}

/** Сколько семей (хижин) целиком под карантином */
export function countQuarantinedHouseholds(world: World): number {
  if (!isEpidemicActive(world)) return 0;
  const keys = new Set<string>();
  for (const a of world.agents) {
    if (!a.alive) continue;
    if (!householdUnderQuarantine(world, a)) continue;
    keys.add(householdKey(a));
  }
  return keys.size;
}
