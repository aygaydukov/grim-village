import { isChild } from "./agent";
import { recordGovernment } from "./events";
import { barnStock, getBarnTile } from "./map";
import type { Agent, World } from "./types";

/** Доля урожая, уходящая в казну старосты при сдаче в амбар */
export const TITHE_RATE = 0.1;

const TREASURY_CAP = 90;
const BARN_SCARCITY = 28;
const BARN_AID_THRESHOLD = 18;
const BUILD_SUBSIDY = 4;

/** Имя старосты для UI */
export function starostaName(world: World): string | null {
  if (world.starostaId == null) return null;
  const agent = world.agents.find((a) => a.id === world.starostaId);
  if (!agent?.alive) return null;
  return `${agent.name} ${agent.surname}`.trim();
}

/** Приоритет доступа к амбару при нехватке: дети и старцы впереди */
export function mayTakeFromBarn(world: World, agent: Agent): boolean {
  const stock = barnStock(world);
  if (stock <= 0) return false;
  if (stock >= BARN_SCARCITY) return true;
  if (isChild(agent) || agent.profession === "elder") return true;
  if (agent.pregnant > 0) return stock >= 6;
  // Взрослые ждут, пока запас не подрастёт или голод критичен
  return agent.hunger > 78 || stock >= 12;
}

/** Отделить десятину при сдаче урожая; вернуть сумму, попавшую в амбар */
export function applyDepositTithe(world: World, deposited: number): number {
  if (deposited <= 0) return 0;
  const tithe = Math.max(0, Math.floor(deposited * TITHE_RATE));
  const toBarn = deposited - tithe;
  if (tithe > 0) {
    world.treasury = Math.min(TREASURY_CAP, world.treasury + tithe);
  }
  return toBarn;
}

/** Субсидия стройки из казны (возвращает сколько списать с амбара) */
export function barnCostForBuild(world: World, baseCost: number): number {
  if (world.treasury < BUILD_SUBSIDY) return baseCost;
  world.treasury -= BUILD_SUBSIDY;
  recordGovernment(world, "казна", `субсидия стройки (−${BUILD_SUBSIDY} мер)`);
  return Math.max(0, baseCost - BUILD_SUBSIDY);
}

function pickStarosta(world: World): number | null {
  const elders = world.agents
    .filter((a) => a.alive && a.profession === "elder")
    .sort((a, b) => b.age - a.age);
  if (elders.length > 0) return elders[0]!.id;

  const adults = world.agents
    .filter((a) => a.alive && a.age >= 30 && a.age < 65)
    .sort((a, b) => b.age - a.age);
  return adults[0]?.id ?? null;
}

/** Ежедневное управление: староста, раздача из казны при голоде */
export function tickDailyGovernment(world: World): void {
  const prev = world.starostaId;
  world.starostaId = pickStarosta(world);

  const barn = getBarnTile(world);
  if (!barn) return;

  const stock = barn.food;
  if (stock < BARN_AID_THRESHOLD && world.treasury >= 10) {
    const aid = Math.min(12, world.treasury, BARN_SCARCITY - stock);
    if (aid > 0) {
      world.treasury -= aid;
      barn.food += aid;
      recordGovernment(world, "казна", `подпитка амбара (+${aid} мер)`);
    }
  }

  if (prev !== world.starostaId && world.starostaId != null) {
    const name = starostaName(world);
    if (name) recordGovernment(world, "староста", `назначен ${name}`);
  }
}
