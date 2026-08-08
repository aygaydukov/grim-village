import { shouldEpidemicQuarantine } from "./behavior";
import { isEpidemicActive } from "./shocks";
import type { Agent, World } from "./types";
import { dist } from "./util";

const HOME_RADIUS = 1.35;

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
 * Механика изоляции: в эпидемию сон/отдых дома снижает уязвимость к болезни.
 * Старцы и сторожа на посту не считаются «запертыми», но и не штрафуются.
 */
export function epidemicIsolationFactor(world: World, agent: Agent): number {
  if (!isEpidemicActive(world)) return 1;

  if (isAtHomeHut(world, agent)) {
    if (agent.state === "sleep") return 0.38;
    if (
      shouldEpidemicQuarantine(world, agent) &&
      (agent.state === "seekRest" || agent.state === "sleep")
    ) {
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
  for (const a of world.agents) {
    if (!a.alive) continue;
    if (!shouldEpidemicQuarantine(world, a)) continue;
    if (!isAtHomeHut(world, a)) continue;
    if (a.state !== "sleep" && a.state !== "seekRest") continue;
    keys.add(`${Math.floor(a.homeX)},${Math.floor(a.homeY)}`);
  }
  return keys;
}

/** Сколько жителей сейчас изолированы в своих хижинах (для инспектора) */
export function countHomeIsolated(world: World): number {
  if (!isEpidemicActive(world)) return 0;
  let n = 0;
  for (const a of world.agents) {
    if (!a.alive) continue;
    if (!shouldEpidemicQuarantine(world, a)) continue;
    if (!isAtHomeHut(world, a)) continue;
    if (a.state === "sleep" || a.state === "seekRest") n += 1;
  }
  return n;
}
