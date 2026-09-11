import { fullName } from "./names";
import { moveToward } from "./agent";
import { recordBurial, recordGraveyardFounded } from "./events";
import { getTile, placeGraveyard, barnStock } from "./map";
import type { Agent, World } from "./types";
import { dist } from "./util";

/** Дней до того, как старцы/батраки заберут тело с площади */
export const BURIAL_WAIT_DAYS = 2;
const MOVE_SPEED = 0.055;

export function hasGraveyard(world: World): boolean {
  return world.graveyardX != null && world.graveyardY != null;
}

export function graveyardPos(world: World): { x: number; y: number } | null {
  if (!hasGraveyard(world)) return null;
  return { x: world.graveyardX! + 0.5, y: world.graveyardY! + 0.5 };
}

export function unburiedBodies(world: World): Agent[] {
  return world.agents.filter((a) => !a.alive && a.burialCarrierId == null);
}

export function countUnburiedBodies(world: World): number {
  return unburiedBodies(world).length;
}

/** Найти место для кладбища — окраина, подальше от амбара */
function findGraveyardSite(world: World): { x: number; y: number } | null {
  const cx = world.barnX;
  const cy = world.barnY;
  let best: { x: number; y: number; score: number } | null = null;

  for (let y = 2; y < world.height - 2; y++) {
    for (let x = 2; x < world.width - 2; x++) {
      const tile = getTile(world, x, y);
      if (!tile) continue;
      if (tile.kind === "water" || tile.kind === "hut" || tile.kind === "barn" || tile.kind === "workshop" || tile.kind === "bakery" || tile.kind === "farm" || tile.kind === "well") {
        continue;
      }
      if (tile.kind === "graveyard") continue;

      const d = Math.hypot(x - cx, y - cy);
      if (d < 11 || d > 20) continue;

      let nearBuilding = false;
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          const n = getTile(world, x + dx, y + dy);
          if (
            n &&
            (n.kind === "hut" ||
              n.kind === "barn" ||
              n.kind === "workshop" ||
              n.kind === "bakery" ||
              n.kind === "farm" ||
              n.kind === "well" ||
              n.kind === "graveyard")
          ) {
            nearBuilding = true;
          }
        }
      }
      if (nearBuilding) continue;

      const score = d + (tile.kind === "grass" ? 1 : tile.kind === "dirt" ? 2 : 0);
      if (!best || score > best.score) best = { x, y, score };
    }
  }

  return best ? { x: best.x, y: best.y } : null;
}

export function ensureGraveyard(world: World): boolean {
  if (hasGraveyard(world)) return true;

  const site = findGraveyardSite(world);
  if (!site) return false;

  placeGraveyard(world, site.x, site.y);
  world.graveyardX = site.x;
  world.graveyardY = site.y;
  recordGraveyardFounded(world, `у (${site.x}, ${site.y})`);
  return true;
}

function bodyReadyForBurial(world: World, body: Agent): boolean {
  if (body.alive || body.burialCarrierId != null) return false;
  const deathDay = body.deathDay ?? world.stats.day;
  return world.stats.day - deathDay >= BURIAL_WAIT_DAYS;
}

function canVillageBury(world: World): boolean {
  return barnStock(world) >= 15;
}

function pickBurialCarrier(world: World): Agent | null {
  if (!canVillageBury(world)) return null;

  const candidates = world.agents.filter((a) => {
    if (!a.alive) return false;
    if (a.profession === "child") return false;
    if (world.activeBurialCarrierId === a.id) return false;
    if (a.hunger > 72 || a.energy < 18) return false;
    if (a.task === "build" && a.state === "build") return false;
    return true;
  });

  const elders = candidates.filter((a) => a.profession === "elder" || a.age >= 65);
  return elders.sort((a, b) => b.age - a.age)[0] ?? null;
}

function clearActiveBurial(world: World): void {
  world.activeBurialBodyId = null;
  world.activeBurialCarrierId = null;
}

function oldestUnburiedBody(world: World): Agent | null {
  const ready = unburiedBodies(world).filter((b) => bodyReadyForBurial(world, b));
  if (ready.length === 0) return null;
  return ready.sort((a, b) => (a.deathDay ?? 0) - (b.deathDay ?? 0))[0] ?? null;
}

export function tickDailyBurials(world: World): void {
  if (unburiedBodies(world).length > 0) {
    ensureGraveyard(world);
  }

  const bodyId = world.activeBurialBodyId;
  const carrierId = world.activeBurialCarrierId;
  if (bodyId != null) {
    const body = world.agents.find((a) => a.id === bodyId);
    const carrier = carrierId != null ? world.agents.find((a) => a.id === carrierId) : null;
    if (!body || body.alive || !carrier?.alive) {
      if (body && !body.alive) body.burialCarrierId = null;
      clearActiveBurial(world);
    }
  }

  if (world.activeBurialBodyId != null || !hasGraveyard(world)) return;

  const body = oldestUnburiedBody(world);
  if (!body) return;

  const carrier = pickBurialCarrier(world);
  if (!carrier) return;

  world.activeBurialBodyId = body.id;
  world.activeBurialCarrierId = carrier.id;
  carrier.task = "bury";
  carrier.state = "seekBurial";
  carrier.targetX = body.x;
  carrier.targetY = body.y;
}

export function isActiveBurialCarrier(world: World, agent: Agent): boolean {
  return world.activeBurialCarrierId === agent.id;
}

function getBurialBody(world: World): Agent | null {
  if (world.activeBurialBodyId == null) return null;
  const body = world.agents.find((a) => a.id === world.activeBurialBodyId);
  if (!body || body.alive) return null;
  return body;
}

function completeBurial(world: World, body: Agent, carrier: Agent): void {
  recordBurial(world, fullName(body), carrier.profession === "elder" ? "старец" : "батрак");
  world.burialCount += 1;
  world.agents = world.agents.filter((a) => a.id !== body.id);
  clearActiveBurial(world);
  carrier.task = "idle";
  carrier.state = "idle";
  carrier.targetX = null;
  carrier.targetY = null;
}

export function tickBurialCarrier(world: World, agent: Agent): void {
  const body = getBurialBody(world);
  const gy = graveyardPos(world);
  if (!body || !gy) {
    clearActiveBurial(world);
    agent.task = "idle";
    agent.state = "idle";
    return;
  }

  if (body.burialCarrierId == null) {
    const reached = moveToward(world, agent, body.x, body.y, MOVE_SPEED);
    if (reached || dist(agent.x, agent.y, body.x, body.y) < 0.45) {
      body.burialCarrierId = agent.id;
      agent.x = gy.x;
      agent.y = gy.y;
      syncCarriedBody(body, agent);
      completeBurial(world, body, agent);
    }
    return;
  }

  // Тело уже подхвачено — завершить обряд (на случай рассинхрона сейва)
  agent.x = gy.x;
  agent.y = gy.y;
  completeBurial(world, body, agent);
}

export function syncCarriedBodies(world: World): void {
  for (const body of world.agents) {
    if (body.alive || body.burialCarrierId == null) continue;
    const carrier = world.agents.find((a) => a.id === body.burialCarrierId && a.alive);
    if (carrier) syncCarriedBody(body, carrier);
  }
}

function syncCarriedBody(body: Agent, carrier: Agent): void {
  body.x = carrier.x - 0.35;
  body.y = carrier.y + 0.15;
}

/** Миграция старых сейвов: проставить deathDay у трупов без даты */
export function migrateUnburiedDeathDays(world: World): void {
  for (const agent of world.agents) {
    if (!agent.alive && agent.deathDay == null) {
      agent.deathDay = Math.max(1, world.stats.day - BURIAL_WAIT_DAYS);
    }
  }
}
