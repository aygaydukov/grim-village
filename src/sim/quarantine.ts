import { isEpidemicActive } from "./shocks";
import type { Agent, World } from "./types";
import { dist } from "./util";

const HOME_RADIUS = 1.35;

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

/** Назначить «больную избу» — хижину дальше всего от амбара */
export function assignSickHut(world: World): void {
  let bestX: number | null = null;
  let bestY: number | null = null;
  let bestD = -1;
  const bx = world.barnX + 0.5;
  const by = world.barnY + 0.5;

  for (let y = 0; y < world.height; y++) {
    for (let x = 0; x < world.width; x++) {
      if (world.tiles[y * world.width + x]!.kind !== "hut") continue;
      const hx = x + 0.5;
      const hy = y + 0.5;
      const d = Math.hypot(hx - bx, hy - by);
      if (d > bestD) {
        bestD = d;
        bestX = hx;
        bestY = hy;
      }
    }
  }

  world.sickHutX = bestX;
  world.sickHutY = bestY;
}

export function clearSickHut(world: World): void {
  world.sickHutX = null;
  world.sickHutY = null;
}

export function hasSickHut(world: World): boolean {
  return world.sickHutX != null && world.sickHutY != null;
}

/** Куда идти на отдых при карантине: больная изба или свой дом */
export function quarantineTarget(world: World, agent: Agent): { x: number; y: number } {
  if (
    isEpidemicActive(world) &&
    shouldEpidemicQuarantine(world, agent) &&
    hasSickHut(world)
  ) {
    return { x: world.sickHutX!, y: world.sickHutY! };
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
