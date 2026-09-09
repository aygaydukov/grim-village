import { getTile } from "./map";
import type { Agent, World } from "./types";
import { clamp, dist } from "./util";

/** Сколько жителей одновременно у колодца */
export const MAX_AT_WELL = 3;
/** Радиус «очереди» у колодца */
export const WELL_QUEUE_RADIUS = 1.6;
/** Радиус «напился» — бонус к силам */
export const WELL_DRINK_RADIUS = 0.85;

export function hasWell(world: World): boolean {
  return world.wellX != null && world.wellY != null;
}

export function wellPos(world: World): { x: number; y: number } | null {
  if (!hasWell(world)) return null;
  return { x: world.wellX! + 0.5, y: world.wellY! + 0.5 };
}

export function countAtWell(world: World): number {
  const wp = wellPos(world);
  if (!wp) return 0;
  let n = 0;
  for (const a of world.agents) {
    if (!a.alive) continue;
    if (dist(a.x, a.y, wp.x, wp.y) < WELL_QUEUE_RADIUS) n++;
  }
  return n;
}

/** Можно ли подойти к колодцу (очередь не переполнена или уже в зоне) */
export function canApproachWell(world: World, agent: Agent): boolean {
  if (!hasWell(world)) return false;
  const wp = wellPos(world)!;
  if (dist(agent.x, agent.y, wp.x, wp.y) < WELL_QUEUE_RADIUS) return true;
  return countAtWell(world) < MAX_AT_WELL;
}

/** Лёгкий бонус от воды — меньше истощения у воды */
export function tickWellHydration(world: World, agent: Agent): void {
  if (!hasWell(world) || !agent.alive) return;
  const wp = wellPos(world)!;
  if (dist(agent.x, agent.y, wp.x, wp.y) > WELL_DRINK_RADIUS) return;
  agent.energy = clamp(agent.energy + 0.06, 0, 100);
  if (agent.hunger > 40) {
    agent.hunger = clamp(agent.hunger - 0.015, 0, 100);
  }
}

/** Ближайшая вода (для диагностики застревания у воды) */
export function isNearWater(world: World, x: number, y: number, radius = 2.5): boolean {
  const fx = Math.floor(x);
  const fy = Math.floor(y);
  const r = Math.ceil(radius);
  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      const tile = getTile(world, fx + dx, fy + dy);
      if (tile?.kind === "water" && dist(x, y, fx + dx + 0.5, fy + dy + 0.5) <= radius) {
        return true;
      }
    }
  }
  return false;
}
