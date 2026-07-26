import { fullName } from "./names";
import { recordMigration } from "./events";
import { countHuts } from "./housing";
import { barnStock } from "./map";
import type { Agent, World } from "./types";
import { chance } from "./util";

/** Жителей на хижину — критический порог для исхода */
const RESIDENTS_PER_HUT_CRITICAL = 3.3;
const RESIDENTS_PER_HUT_DESPERATE = 3.9;
const MIGRATION_COOLDOWN_DAYS = 6;
const MIN_BARN_FOR_STAY = 22;
const HUNGER_CRISIS = 64;

export function tickDailyMigration(world: World): void {
  if (
    world.lastMigrationDay > 0 &&
    world.stats.day - world.lastMigrationDay < MIGRATION_COOLDOWN_DAYS
  ) {
    return;
  }

  const huts = countHuts(world);
  if (huts === 0) return;

  const alive = world.agents.filter((a) => a.alive);
  const ratio = alive.length / huts;

  let hungerSum = 0;
  for (const a of alive) hungerSum += a.hunger;
  const avgHunger = hungerSum / Math.max(1, alive.length);
  const barn = barnStock(world);

  const overcrowded = ratio >= RESIDENTS_PER_HUT_CRITICAL;
  const desperate = ratio >= RESIDENTS_PER_HUT_DESPERATE;
  const crisis = avgHunger > HUNGER_CRISIS && barn < MIN_BARN_FOR_STAY;

  if (!overcrowded || (!crisis && !desperate)) return;

  const rollChance = desperate ? 0.38 : crisis ? 0.2 : 0.12;
  if (!chance(world.rng, rollChance)) return;

  const family = pickEmigrantFamily(world);
  if (!family || family.length === 0) return;

  emigrateFamily(world, family);
  world.lastMigrationDay = world.stats.day;
}

/** Семья из самой перенаселённой хижины — молодая пара или одинокий взрослый */
function pickEmigrantFamily(world: World): Agent[] | null {
  const counts = new Map<string, Agent[]>();

  for (const agent of world.agents) {
    if (!agent.alive) continue;
    const key = `${Math.floor(agent.homeX)},${Math.floor(agent.homeY)}`;
    const list = counts.get(key) ?? [];
    list.push(agent);
    counts.set(key, list);
  }

  let worst: Agent[] | null = null;
  for (const agents of counts.values()) {
    if (!worst || agents.length > worst.length) worst = agents;
  }
  if (!worst || worst.length < 4) return null;

  const adults = worst
    .filter((a) => a.age >= 16 && a.id !== world.starostaId)
    .sort((a, b) => a.age - b.age);

  const primary = adults.find(
    (a) =>
      a.profession !== "keeper" &&
      a.profession !== "elder" &&
      a.pregnant <= 0 &&
      a.hunger > 45,
  );
  if (!primary) return null;

  const family = collectFamilyUnit(world, primary);
  if (family.length === 0) return null;

  // Не выводить последнего сторожа
  const keepersLeft = world.agents.filter(
    (a) => a.alive && a.profession === "keeper" && !family.some((f) => f.id === a.id),
  );
  if (keepersLeft.length === 0 && family.some((a) => a.profession === "keeper")) {
    return null;
  }

  return family;
}

function collectFamilyUnit(world: World, primary: Agent): Agent[] {
  const unit = new Set<number>([primary.id]);
  if (primary.spouseId != null) unit.add(primary.spouseId);

  for (const agent of world.agents) {
    if (!agent.alive) continue;
    if (agent.motherId === primary.id || agent.fatherId === primary.id) {
      if (agent.age < 14) unit.add(agent.id);
    }
    if (primary.motherId === agent.id || primary.fatherId === agent.id) {
      unit.add(agent.id);
    }
  }

  return world.agents.filter((a) => unit.has(a.id) && a.alive);
}

function emigrateFamily(world: World, family: Agent[]): void {
  const names = family.map((a) => fullName(a)).join(", ");
  const ids = new Set(family.map((a) => a.id));

  for (const agent of world.agents) {
    if (ids.has(agent.id)) continue;
    if (agent.spouseId != null && ids.has(agent.spouseId)) agent.spouseId = null;
    if (agent.mateId != null && ids.has(agent.mateId)) agent.mateId = null;
    if (agent.motherId != null && ids.has(agent.motherId)) agent.motherId = null;
    if (agent.fatherId != null && ids.has(agent.fatherId)) agent.fatherId = null;
  }

  if (world.buildProject?.builderId != null && ids.has(world.buildProject.builderId)) {
    world.buildProject.builderId = null;
  }
  if (world.starostaId != null && ids.has(world.starostaId)) {
    world.starostaId = null;
  }

  world.agents = world.agents.filter((a) => !ids.has(a.id));
  world.stats.alive = world.agents.filter((a) => a.alive).length;
  recordMigration(world, names, family.length);
}
