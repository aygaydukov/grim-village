import { isChild } from "./agent";
import { recordGovernment } from "./events";
import { needsMoreHousing } from "./housing";
import { barnStock, getBarnTile } from "./map";
import type { Agent, StarostaPolicy, World } from "./types";

/** Базовая десятина при сбалансированной политике */
export const TITHE_RATE = 0.1;

const TREASURY_CAP = 90;
const BARN_SCARCITY = 28;
const BUILD_SUBSIDY = 4;

const POLICY_TITHE: Record<StarostaPolicy, number> = {
  balanced: 0.1,
  build: 0.08,
  store: 0.15,
  relief: 0.05,
};

const POLICY_LABEL: Record<StarostaPolicy, string> = {
  balanced: "сбалансированная",
  build: "стройка",
  store: "запасы",
  relief: "поддержка",
};

/** Имя старосты для UI */
export function starostaName(world: World): string | null {
  if (world.starostaId == null) return null;
  const agent = world.agents.find((a) => a.id === world.starostaId);
  if (!agent?.alive) return null;
  return `${agent.name} ${agent.surname}`.trim();
}

export function policyLabel(policy: StarostaPolicy): string {
  return POLICY_LABEL[policy];
}

/** Действующая ставка десятины по политике старосты */
export function effectiveTitheRate(world: World): number {
  return POLICY_TITHE[world.starostaPolicy];
}

/** Минимум в амбаре, чтобы начать стройку хижины */
export function minBarnToBuild(world: World): number {
  switch (world.starostaPolicy) {
    case "build":
      return 42;
    case "store":
      return 62;
    case "relief":
      return 999;
    default:
      return 52;
  }
}

/** Порог амбара для раздачи из казны */
function barnAidThreshold(world: World): number {
  switch (world.starostaPolicy) {
    case "relief":
      return 32;
    case "store":
      return 14;
    default:
      return 18;
  }
}

/** Субсидия стройки из казны */
function buildSubsidyAmount(world: World): number {
  switch (world.starostaPolicy) {
    case "build":
      return 6;
    case "store":
      return 2;
    default:
      return BUILD_SUBSIDY;
  }
}

/** Приоритет доступа к амбару при нехватке: дети и старцы впереди */
export function mayTakeFromBarn(world: World, agent: Agent): boolean {
  const stock = barnStock(world);
  if (stock <= 0) return false;
  if (stock >= BARN_SCARCITY) return true;
  if (isChild(agent) || agent.profession === "elder") return true;
  if (agent.pregnant > 0) return stock >= 6;
  // В режиме поддержки взрослые получают еду раньше
  if (world.starostaPolicy === "relief") {
    return agent.hunger > 65 || stock >= 10;
  }
  return agent.hunger > 78 || stock >= 12;
}

/** Отделить десятину при сдаче урожая; вернуть сумму, попавшую в амбар */
export function applyDepositTithe(world: World, deposited: number): number {
  if (deposited <= 0) return 0;
  const rate = effectiveTitheRate(world);
  const tithe = Math.max(0, Math.floor(deposited * rate));
  const toBarn = deposited - tithe;
  if (tithe > 0) {
    world.treasury = Math.min(TREASURY_CAP, world.treasury + tithe);
  }
  return toBarn;
}

/** Субсидия стройки из казны (возвращает сколько списать с амбара) */
export function barnCostForBuild(world: World, baseCost: number): number {
  const subsidy = buildSubsidyAmount(world);
  if (world.treasury < subsidy) return baseCost;
  world.treasury -= subsidy;
  recordGovernment(world, "казна", `субсидия стройки (−${subsidy} мер)`);
  return Math.max(0, baseCost - subsidy);
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

function avgHunger(world: World): number {
  const alive = world.agents.filter((a) => a.alive);
  if (alive.length === 0) return 0;
  let sum = 0;
  for (const a of alive) sum += a.hunger;
  return sum / alive.length;
}

/** Староста выбирает политику по состоянию деревни */
export function assessStarostaPolicy(world: World): StarostaPolicy {
  const barn = barnStock(world);
  const hunger = avgHunger(world);
  const housing = needsMoreHousing(world);

  if (hunger > 58 && barn < 30) return "relief";
  if (housing && barn >= 38 && hunger < 55) return "build";
  if (barn >= 55 && world.treasury < 35 && !housing) return "store";
  return "balanced";
}

/** Ежедневное управление: староста, политика, раздача из казны */
export function tickDailyGovernment(world: World): void {
  const prevStarosta = world.starostaId;
  const prevPolicy = world.starostaPolicy;

  world.starostaId = pickStarosta(world);
  world.starostaPolicy = assessStarostaPolicy(world);

  const barn = getBarnTile(world);
  if (!barn) return;

  const stock = barn.food;
  const aidThreshold = barnAidThreshold(world);
  const aidBudget = world.starostaPolicy === "relief" ? 16 : 12;

  if (stock < aidThreshold && world.treasury >= 10) {
    const aid = Math.min(aidBudget, world.treasury, BARN_SCARCITY - stock);
    if (aid > 0) {
      world.treasury -= aid;
      barn.food += aid;
      recordGovernment(world, "казна", `подпитка амбара (+${aid} мер)`);
    }
  }

  if (prevStarosta !== world.starostaId && world.starostaId != null) {
    const name = starostaName(world);
    if (name) recordGovernment(world, "староста", `назначен ${name}`);
  }

  if (prevPolicy !== world.starostaPolicy) {
    const rate = Math.round(effectiveTitheRate(world) * 100);
    recordGovernment(
      world,
      "политика",
      `${policyLabel(world.starostaPolicy)} (десятина ${rate}%)`,
    );
  }
}
