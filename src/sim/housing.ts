import { recordConstruction } from "./events";
import { barnCostForBuild, minBarnToBuild } from "./government";
import { barnStock, getBarnTile, getTile, placeHut } from "./map";
import type { Agent, World } from "./types";

const RESIDENTS_PER_HUT = 2.6;
const BUILD_FOOD_COST = 6;
const BUILD_COOLDOWN_DAYS = 3;
const BUILD_PROGRESS_PER_TICK = 1;

export function countHuts(world: World): number {
  let n = 0;
  for (const tile of world.tiles) {
    if (tile.kind === "hut") n += 1;
  }
  return n;
}

export function needsMoreHousing(world: World): boolean {
  const huts = countHuts(world);
  if (huts === 0) return false;
  const alive = world.agents.filter((a) => a.alive).length;
  return alive > huts * RESIDENTS_PER_HUT;
}

function canAffordBuild(world: World): boolean {
  if (world.buildProject) return false;
  if (world.lastHutBuiltDay > 0 && world.stats.day - world.lastHutBuiltDay < BUILD_COOLDOWN_DAYS) {
    return false;
  }
  return barnStock(world) >= minBarnToBuild(world);
}

/** Подходящая клетка для новой хижины — рядом с деревней, не вода */
function findBuildSite(world: World): { x: number; y: number } | null {
  const cx = world.barnX;
  const cy = world.barnY;
  let best: { x: number; y: number; score: number } | null = null;

  for (let y = 1; y < world.height - 1; y++) {
    for (let x = 1; x < world.width - 1; x++) {
      const tile = getTile(world, x, y);
      if (!tile) continue;
      if (tile.kind === "water" || tile.kind === "hut" || tile.kind === "barn") continue;

      const d = Math.hypot(x - cx, y - cy);
      if (d < 4 || d > 13) continue;

      // Не строить вплотную к другой хижине
      let nearHut = false;
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          const n = getTile(world, x + dx, y + dy);
          if (n?.kind === "hut") nearHut = true;
        }
      }
      if (nearHut) continue;

      const score = -d + (tile.kind === "dirt" ? 2 : tile.kind === "grass" ? 1 : 0);
      if (!best || score > best.score) best = { x, y, score };
    }
  }

  return best ? { x: best.x, y: best.y } : null;
}

/** Ежедневная проверка: начать стройку при перенаселении */
export function maybeStartHutBuild(world: World): void {
  if (!needsMoreHousing(world) || !canAffordBuild(world)) return;

  const site = findBuildSite(world);
  if (!site) return;

  const barn = getBarnTile(world);
  const barnPay = barnCostForBuild(world, BUILD_FOOD_COST);
  if (!barn || barn.food < barnPay) return;
  barn.food -= barnPay;

  world.buildProject = {
    x: site.x,
    y: site.y,
    progress: 0,
    required: Math.floor(world.dayLength * 0.55),
    builderId: null,
  };
}

export function assignBuilder(world: World, agent: Agent): boolean {
  const project = world.buildProject;
  if (!project || project.builderId != null) return false;
  if (agent.profession !== "laborer" || !agent.alive) return false;
  project.builderId = agent.id;
  return true;
}

export function tickBuildProject(world: World, agent: Agent): boolean {
  const project = world.buildProject;
  if (!project || project.builderId !== agent.id) return false;

  project.progress += BUILD_PROGRESS_PER_TICK;
  agent.energy = Math.max(0, agent.energy - 0.04);

  if (project.progress < project.required) return true;

  completeHutBuild(world);
  return false;
}

function completeHutBuild(world: World): void {
  const project = world.buildProject;
  if (!project) return;

  placeHut(world, project.x, project.y);
  assignHomeToOvercrowded(world, project.x + 0.5, project.y + 0.5);
  world.lastHutBuiltDay = world.stats.day;
  world.buildProject = null;
  recordConstruction(world, `новая хижина у (${project.x}, ${project.y})`);
}

/** Переселить самую перенаселённую семью в новый дом */
function assignHomeToOvercrowded(world: World, homeX: number, homeY: number): void {
  const counts = new Map<string, { count: number; agents: Agent[] }>();

  for (const agent of world.agents) {
    if (!agent.alive) continue;
    const key = `${Math.floor(agent.homeX)},${Math.floor(agent.homeY)}`;
    const entry = counts.get(key) ?? { count: 0, agents: [] };
    entry.count += 1;
    entry.agents.push(agent);
    counts.set(key, entry);
  }

  let worst: { key: string; agents: Agent[] } | null = null;
  for (const [key, entry] of counts) {
    if (!worst || entry.count > worst.agents.length) {
      worst = { key, agents: entry.agents };
    }
  }
  if (!worst || worst.agents.length < 3) return;

  // Молодая пара или одинокий взрослый с этой хижины
  const candidates = worst.agents
    .filter((a) => a.age >= 16)
    .sort((a, b) => a.age - b.age);
  const primary = candidates[0];
  if (!primary) return;

  const toMove = new Set<number>([primary.id]);
  if (primary.spouseId != null) toMove.add(primary.spouseId);
  for (const agent of worst.agents) {
    if (agent.motherId === primary.id || agent.fatherId === primary.id) {
      toMove.add(agent.id);
    }
    if (primary.motherId === agent.id || primary.fatherId === agent.id) {
      toMove.add(agent.id);
    }
  }

  for (const agent of world.agents) {
    if (!toMove.has(agent.id)) continue;
    agent.homeX = homeX;
    agent.homeY = homeY;
  }
}

export function buildSitePos(world: World): { x: number; y: number } | null {
  const project = world.buildProject;
  if (!project) return null;
  return { x: project.x + 0.5, y: project.y + 0.5 };
}

export function isActiveBuilder(world: World, agent: Agent): boolean {
  const project = world.buildProject;
  return !!project && project.builderId === agent.id;
}

export function shouldLaborerBuild(world: World, agent: Agent): boolean {
  const project = world.buildProject;
  if (!project) return false;
  if (project.builderId != null && project.builderId !== agent.id) return false;
  return agent.profession === "laborer" && agent.energy > 30 && agent.hunger < 60;
}
