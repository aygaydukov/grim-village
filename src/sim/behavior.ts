import {
  canMate,
  createAgent,
  isChild,
  killAgent,
  MAX_AGE,
  MAX_CARRY,
  moveToward,
} from "./agent";
import {
  assignBuilder,
  buildSitePos,
  isActiveBuilder,
  maybeStartHutBuild,
  shouldLaborerBuild,
  tickBuildProject,
} from "./housing";
import { tickDailyCaravan } from "./caravan";
import { tickDailyCraft } from "./craft";
import { mayTakeFromBarn, applyDepositTithe, tickDailyGovernment } from "./government";
import { recordDaySnapshot } from "./history";
import { tickDailyShocks } from "./shocks";
import { tickDailyImmigration, tickDailyMigration } from "./migration";
import { recordBirth, recordDeath } from "./events";
import {
  anchorPoint,
  findWorkFood,
  isBeyondLeash,
  maybeReassignProfession,
  planWorkTask,
  rebalanceVillageLabor,
  setLocalTarget,
} from "./jobs";
import {
  barnPos,
  barnStock,
  findNearestHut,
  findNearestWildFood,
  getBarnTile,
  regenerateFood,
  syncBarnStat,
  workshopPos,
} from "./map";
import type { Agent, TaskKind, World } from "./types";
import {
  AGE_PER_GAME_DAY,
  BIRTH_COOLDOWN_GAME_DAYS,
  MATE_COOLDOWN_GAME_DAYS,
  PREGNANCY_GAME_DAYS,
} from "./time";
import { chance, clamp, dist } from "./util";

const HUNGER_RATE = 0.032;
const ENERGY_DRAIN = 0.024;
const ENERGY_SLEEP = 0.38;
const MOVE_SPEED = 0.055;
const NIGHT_COLD = 0.015;
const SOFT_POP_CAP = 36;

function courtPregnancyChance(world: World): number {
  const stock = barnStock(world);
  if (stock > 60) return 0.12;
  if (stock > 40) return 0.1;
  return 0.08;
}

function aliveAgents(world: World): Agent[] {
  return world.agents.filter((a) => a.alive);
}

function isNight(world: World): boolean {
  const t = world.stats.timeOfDay;
  return t < 0.22 || t > 0.78;
}

function setTask(agent: Agent, task: TaskKind, state: Agent["state"]): void {
  agent.task = task;
  agent.state = state;
  agent.targetX = null;
  agent.targetY = null;
}

function finishToWork(world: World, agent: Agent): void {
  applyWorkPlan(world, agent);
}

function applyWorkPlan(world: World, agent: Agent): void {
  const task = planWorkTask(world, agent);
  agent.task = task;
  switch (task) {
    case "gather":
      agent.state = "seekGather";
      break;
    case "deposit":
      agent.state = "deposit";
      break;
    case "rest":
      agent.state = "seekRest";
      break;
    case "play":
    case "patrol":
      agent.state = "patrol";
      setLocalTarget(world, agent, task === "play" ? 0.55 : 0.75);
      break;
    case "build":
      agent.state = "seekBuild";
      break;
    case "craft":
      agent.state = "craft";
      {
        const wp = workshopPos(world);
        agent.targetX = wp.x;
        agent.targetY = wp.y;
      }
      break;
    case "idle":
    default:
      agent.state = "idle";
      agent.targetX = null;
      agent.targetY = null;
      break;
  }
}

function hungryThreshold(agent: Agent): number {
  return agent.pregnant > 0 ? 55 : 68;
}

function decideState(world: World, agent: Agent): void {
  const eatAt = hungryThreshold(agent);

  if (agent.carriedFood > 0) {
    setTask(agent, "deposit", "deposit");
    return;
  }

  if (agent.hunger > eatAt) {
    setTask(agent, "eat", "seekFood");
    return;
  }

  // Сорвался с участка — домой/к амбару (только если голод ещё терпимый)
  if (isBeyondLeash(world, agent) && agent.hunger < eatAt - 8) {
    setTask(agent, "returnHome", "returnHome");
    return;
  }

  if (agent.energy < 25 || (isNight(world) && agent.energy < 55)) {
    setTask(agent, "rest", "seekRest");
    return;
  }

  // Социум — редко и только в зоне деревни
  const pop = world.stats.alive;
  const foodOk = barnStock(world) >= 8 || findNearestWildFood(world, agent.x, agent.y, 10);
  const mateChance = pop > SOFT_POP_CAP ? 0.003 : 0.01;
  if (
    canMate(agent) &&
    !isNight(world) &&
    agent.hunger < 38 &&
    agent.profession !== "child" &&
    foodOk &&
    chance(world.rng, mateChance)
  ) {
    setTask(agent, "social", "seekMate");
    return;
  }

  applyWorkPlan(world, agent);
}

function tickNeeds(world: World, agent: Agent): void {
  const night = isNight(world);
  agent.hunger = clamp(agent.hunger + HUNGER_RATE * (isChild(agent) ? 1.1 : 1), 0, 100);

  if (agent.state === "sleep") {
    agent.energy = clamp(agent.energy + ENERGY_SLEEP, 0, 100);
    if (night) agent.hunger = clamp(agent.hunger + HUNGER_RATE * 0.25, 0, 100);
  } else {
    const workExtra =
      agent.state === "seekGather" ||
      agent.state === "gather" ||
      agent.state === "deposit" ||
      agent.state === "craft"
        ? 0.01
        : 0;
    agent.energy = clamp(
      agent.energy - ENERGY_DRAIN - workExtra - (night ? NIGHT_COLD : 0),
      0,
      100,
    );
  }

  if (agent.cooldown > 0) agent.cooldown -= 1;

  if (world.tick % world.dayLength === 0) {
    agent.age += AGE_PER_GAME_DAY;
    maybeReassignProfession(world, agent);
  }

  if (agent.hunger >= 100) {
    killAgent(agent, "голод");
    world.stats.dead += 1;
    recordDeath(world, agent, "голод");
    return;
  }

  if (agent.energy <= 0 && night) {
    killAgent(agent, "холод и истощение");
    world.stats.dead += 1;
    recordDeath(world, agent, "холод и истощение");
    return;
  }

  if (agent.age >= MAX_AGE + world.rng() * 12) {
    killAgent(agent, "старость");
    world.stats.dead += 1;
    recordDeath(world, agent, "старость");
    return;
  }

  if (agent.pregnant > 0) {
    agent.pregnant -= 1;
    if (agent.pregnant === 0) {
      birth(world, agent);
    }
  }
}

function birth(world: World, mother: Agent): void {
  const sex = chance(world.rng, 0.5) ? "male" : "female";
  const fatherId = mother.spouseId;
  const father = fatherId != null ? world.agents.find((a) => a.id === fatherId) : null;
  const surname = father?.surname ?? mother.surname;
  const child = createAgent(world, {
    x: mother.x + (world.rng() - 0.5) * 0.4,
    y: mother.y + (world.rng() - 0.5) * 0.4,
    sex,
    age: 0,
    homeX: mother.homeX,
    homeY: mother.homeY,
    motherId: mother.id,
    fatherId,
    profession: "child",
    surname,
  });
  child.hunger = 12;
  child.energy = 70;
  child.state = "idle";
  child.task = "idle";
  world.agents.push(child);
  world.stats.births += 1;
  recordBirth(world, child);
  mother.cooldown = Math.floor(world.dayLength * BIRTH_COOLDOWN_GAME_DAYS);
  mother.energy = clamp(mother.energy - 22, 5, 100);
  mother.hunger = clamp(mother.hunger + 18, 0, 100);
}

function pickFoodTarget(world: World, agent: Agent): { x: number; y: number } | null {
  const barn = barnPos(world);
  const stock = barnStock(world);
  // Еда: сначала амбар, иначе дикое рядом с якорем
  const wild = findWorkFood(world, agent) ?? findNearestWildFood(world, agent.x, agent.y, 12);
  const dBarn = dist(agent.x, agent.y, barn.x, barn.y);

  if (stock > 0 && mayTakeFromBarn(world, agent)) {
    if (!wild) return barn;
    const dWild = dist(agent.x, agent.y, wild.x, wild.y);
    if (dBarn <= dWild + 3 || agent.hunger > 80) return barn;
  }
  return wild;
}

function actReturnHome(world: World, agent: Agent): void {
  const anchor = anchorPoint(world, agent);
  if (agent.targetX == null || agent.targetY == null) {
    agent.targetX = anchor.x;
    agent.targetY = anchor.y;
  }
  const arrived = moveToward(world, agent, agent.targetX, agent.targetY, MOVE_SPEED);
  if (arrived || dist(agent.x, agent.y, anchor.x, anchor.y) < leashSlack(agent)) {
    agent.targetX = null;
    agent.targetY = null;
    finishToWork(world, agent);
  }
}

function leashSlack(agent: Agent): number {
  return agent.profession === "gatherer" ? 4 : 2.5;
}

function actSeekFood(world: World, agent: Agent): void {
  if (agent.targetX == null || agent.targetY == null) {
    const food = pickFoodTarget(world, agent);
    if (!food) {
      finishToWork(world, agent);
      return;
    }
    agent.targetX = food.x;
    agent.targetY = food.y;
  }

  const arrived = moveToward(
    world,
    agent,
    agent.targetX,
    agent.targetY,
    MOVE_SPEED * (isChild(agent) ? 0.75 : 1),
  );
  if (!arrived) return;

  const tx = Math.floor(agent.x);
  const ty = Math.floor(agent.y);
  const tile = world.tiles[ty * world.width + tx];
  if (tile && tile.food > 0 && (tile.kind === "barn" || tile.kind === "forest" || tile.kind === "grass")) {
    agent.state = "eat";
    agent.task = "eat";
  } else {
    agent.targetX = null;
    agent.targetY = null;
    const again = pickFoodTarget(world, agent);
    if (again) {
      agent.targetX = again.x;
      agent.targetY = again.y;
    } else {
      finishToWork(world, agent);
    }
  }
}

function actEat(world: World, agent: Agent): void {
  const tx = Math.floor(agent.x);
  const ty = Math.floor(agent.y);
  const tile = world.tiles[ty * world.width + tx];
  if (!tile || tile.food <= 0) {
    setTask(agent, "eat", "seekFood");
    return;
  }

  tile.food -= 1;
  const fromBarn = tile.kind === "barn";
  agent.hunger = clamp(agent.hunger - (fromBarn ? 32 : 26), 0, 100);
  agent.energy = clamp(agent.energy + (fromBarn ? 6 : 4), 0, 100);

  if (agent.hunger < 32) {
    finishToWork(world, agent);
  }
}

function actSeekGather(world: World, agent: Agent): void {
  if (agent.hunger > 70) {
    setTask(agent, "eat", "seekFood");
    return;
  }

  if (isBeyondLeash(world, agent)) {
    if (agent.carriedFood > 0) setTask(agent, "deposit", "deposit");
    else setTask(agent, "returnHome", "returnHome");
    return;
  }

  if (agent.targetX == null || agent.targetY == null) {
    const food = findWorkFood(world, agent);
    if (!food) {
      finishToWork(world, agent);
      return;
    }
    agent.targetX = food.x;
    agent.targetY = food.y;
  }

  const arrived = moveToward(world, agent, agent.targetX, agent.targetY, MOVE_SPEED);
  if (!arrived) return;

  const tile = world.tiles[Math.floor(agent.y) * world.width + Math.floor(agent.x)];
  if (tile && tile.food > 0 && tile.kind !== "barn") {
    agent.state = "gather";
    agent.task = "gather";
  } else {
    agent.targetX = null;
    agent.targetY = null;
  }
}

function actGather(world: World, agent: Agent): void {
  const tile = world.tiles[Math.floor(agent.y) * world.width + Math.floor(agent.x)];
  if (!tile || tile.food <= 0 || tile.kind === "barn") {
    if (agent.carriedFood > 0) {
      setTask(agent, "deposit", "deposit");
    } else {
      setTask(agent, "gather", "seekGather");
    }
    return;
  }

  tile.food -= 1;
  agent.carriedFood = Math.min(MAX_CARRY, agent.carriedFood + 1);
  agent.energy = clamp(agent.energy - 2, 0, 100);

  if (agent.carriedFood >= MAX_CARRY || tile.food <= 0 || chance(world.rng, 0.4)) {
    setTask(agent, "deposit", "deposit");
  }
}

function actDeposit(world: World, agent: Agent): void {
  if (agent.carriedFood <= 0) {
    finishToWork(world, agent);
    return;
  }

  const barn = barnPos(world);
  if (agent.targetX == null || agent.targetY == null) {
    agent.targetX = barn.x;
    agent.targetY = barn.y;
  }

  const arrived = moveToward(world, agent, agent.targetX, agent.targetY, MOVE_SPEED);
  if (!arrived && dist(agent.x, agent.y, barn.x, barn.y) > 0.7) return;

  const barnTile = getBarnTile(world);
  if (!barnTile) {
    agent.carriedFood = 0;
    finishToWork(world, agent);
    return;
  }

  const space = barnTile.maxFood - barnTile.food;
  const put = Math.min(agent.carriedFood, space);
  const netPut = applyDepositTithe(world, put);
  barnTile.food += netPut;
  agent.carriedFood -= put;
  if (agent.carriedFood > 0) {
    agent.hunger = clamp(agent.hunger - agent.carriedFood * 8, 0, 100);
    agent.carriedFood = 0;
  }

  if (agent.hunger > 60) setTask(agent, "eat", "seekFood");
  else finishToWork(world, agent);
}

function actSeekRest(world: World, agent: Agent): void {
  if (agent.targetX == null || agent.targetY == null) {
    const homeTile = world.tiles[Math.floor(agent.homeY) * world.width + Math.floor(agent.homeX)];
    if (homeTile && homeTile.kind === "hut") {
      agent.targetX = agent.homeX;
      agent.targetY = agent.homeY;
    } else {
      const hut = findNearestHut(world, agent.x, agent.y);
      if (hut) {
        agent.targetX = hut.x;
        agent.targetY = hut.y;
      } else {
        agent.targetX = agent.homeX;
        agent.targetY = agent.homeY;
      }
    }
  }

  const arrived = moveToward(world, agent, agent.targetX!, agent.targetY!, MOVE_SPEED);
  if (arrived) {
    agent.state = "sleep";
    agent.task = "rest";
    agent.targetX = null;
    agent.targetY = null;
  }
}

function actSleep(world: World, agent: Agent): void {
  if (agent.energy >= 90 && !isNight(world)) {
    finishToWork(world, agent);
  } else if (agent.hunger > 78) {
    setTask(agent, "eat", "seekFood");
  }
}

function actBuild(world: World, agent: Agent): void {
  if (!isActiveBuilder(world, agent)) {
    finishToWork(world, agent);
    return;
  }
  const site = buildSitePos(world);
  if (!site) {
    finishToWork(world, agent);
    return;
  }

  if (dist(agent.x, agent.y, site.x, site.y) > 0.9) {
    agent.state = "seekBuild";
    agent.task = "build";
    return;
  }

  const stillBuilding = tickBuildProject(world, agent);
  if (!stillBuilding) {
    finishToWork(world, agent);
  }
}

function actSeekBuild(world: World, agent: Agent): void {
  if (!shouldLaborerBuild(world, agent) && !isActiveBuilder(world, agent)) {
    finishToWork(world, agent);
    return;
  }

  if (!isActiveBuilder(world, agent)) {
    assignBuilder(world, agent);
  }

  const site = buildSitePos(world);
  if (!site) {
    finishToWork(world, agent);
    return;
  }

  if (agent.targetX == null || agent.targetY == null) {
    agent.targetX = site.x;
    agent.targetY = site.y;
  }

  const arrived = moveToward(world, agent, agent.targetX, agent.targetY, MOVE_SPEED * 0.85);
  if (arrived || dist(agent.x, agent.y, site.x, site.y) < 0.9) {
    agent.state = "build";
    agent.task = "build";
    agent.targetX = null;
    agent.targetY = null;
  }
}

function actPatrol(world: World, agent: Agent): void {
  if (isBeyondLeash(world, agent)) {
    setTask(agent, "returnHome", "returnHome");
    return;
  }
  if (agent.targetX == null || agent.targetY == null) {
    setLocalTarget(world, agent, agent.task === "play" ? 0.5 : 0.7);
  }
  const arrived = moveToward(world, agent, agent.targetX!, agent.targetY!, MOVE_SPEED * 0.7);
  if (arrived) {
    agent.targetX = null;
    agent.targetY = null;
    if (chance(world.rng, 0.45)) {
      agent.state = "idle";
      agent.task = "idle";
    } else {
      setLocalTarget(world, agent, 0.65);
    }
  }
}

function actCraft(world: World, agent: Agent): void {
  if (isBeyondLeash(world, agent)) {
    setTask(agent, "returnHome", "returnHome");
    return;
  }
  const wp = workshopPos(world);
  if (agent.targetX == null || agent.targetY == null) {
    agent.targetX = wp.x;
    agent.targetY = wp.y;
  }
  const arrived = moveToward(world, agent, agent.targetX!, agent.targetY!, MOVE_SPEED * 0.55);
  if (arrived) {
    agent.targetX = wp.x + (world.rng() - 0.5) * 0.6;
    agent.targetY = wp.y + (world.rng() - 0.5) * 0.6;
  }
}

function actIdle(world: World, agent: Agent): void {
  if (isBeyondLeash(world, agent)) {
    setTask(agent, "returnHome", "returnHome");
    return;
  }
  // Периодически пересматриваем работу / короткий патруль
  if (chance(world.rng, 0.04)) {
    decideState(world, agent);
  } else if (chance(world.rng, 0.03)) {
    agent.task = agent.profession === "child" ? "play" : "patrol";
    agent.state = "patrol";
    setLocalTarget(world, agent, 0.5);
  }
}

function actSeekMate(world: World, agent: Agent): void {
  if (!canMate(agent)) {
    finishToWork(world, agent);
    agent.mateId = null;
    return;
  }

  let mate: Agent | null = null;
  if (agent.spouseId != null) {
    const spouse = world.agents.find((a) => a.id === agent.spouseId && a.alive) ?? null;
    if (spouse && canMate(spouse)) mate = spouse;
  }

  if (!mate && agent.mateId != null) {
    mate = world.agents.find((a) => a.id === agent.mateId && a.alive) ?? null;
    if (mate && !canMate(mate)) mate = null;
  }

  if (!mate) {
    const candidates = aliveAgents(world).filter(
      (o) =>
        o.id !== agent.id &&
        o.sex !== agent.sex &&
        canMate(o) &&
        (o.spouseId == null || o.spouseId === agent.id) &&
        (agent.spouseId == null || agent.spouseId === o.id) &&
        dist(agent.x, agent.y, o.x, o.y) < 12,
    );
    if (candidates.length === 0) {
      finishToWork(world, agent);
      return;
    }
    mate = candidates.reduce((best, cur) =>
      dist(agent.x, agent.y, cur.x, cur.y) < dist(agent.x, agent.y, best.x, best.y)
        ? cur
        : best,
    );
    agent.mateId = mate.id;
  }

  // Не убегать за пару слишком далеко от якоря
  if (dist(mate.x, mate.y, anchorPoint(world, agent).x, anchorPoint(world, agent).y) > leashSlack(agent) + 8) {
    finishToWork(world, agent);
    agent.mateId = null;
    return;
  }

  agent.targetX = mate.x;
  agent.targetY = mate.y;
  const arrived = moveToward(world, agent, mate.x, mate.y, MOVE_SPEED);

  if (dist(agent.x, agent.y, mate.x, mate.y) < 0.8 || arrived) {
    agent.state = "court";
    agent.task = "social";
    mate.state = "court";
    mate.task = "social";
    mate.mateId = agent.id;
  }
}

function actCourt(world: World, agent: Agent): void {
  const mate = world.agents.find((a) => a.id === agent.mateId && a.alive);
  if (!mate || !canMate(agent) || !canMate(mate)) {
    finishToWork(world, agent);
    agent.mateId = null;
    return;
  }

  if (dist(agent.x, agent.y, mate.x, mate.y) > 1.2) {
    moveToward(world, agent, mate.x, mate.y, MOVE_SPEED);
    return;
  }

  if (chance(world.rng, courtPregnancyChance(world))) {
    agent.spouseId = mate.id;
    mate.spouseId = agent.id;

    const mother = agent.sex === "female" ? agent : mate.sex === "female" ? mate : null;
    if (mother && mother.pregnant <= 0 && world.stats.alive < SOFT_POP_CAP + 8) {
      mother.pregnant = Math.floor(world.dayLength * PREGNANCY_GAME_DAYS);
      agent.cooldown = Math.floor(world.dayLength * MATE_COOLDOWN_GAME_DAYS);
      mate.cooldown = Math.floor(world.dayLength * MATE_COOLDOWN_GAME_DAYS);
      agent.energy = clamp(agent.energy - 10, 0, 100);
      mate.energy = clamp(mate.energy - 10, 0, 100);
    }
    agent.mateId = null;
    mate.mateId = null;
    finishToWork(world, agent);
    finishToWork(world, mate);
  }
}

function tickAgent(world: World, agent: Agent): void {
  if (!agent.alive) return;

  tickNeeds(world, agent);
  if (!agent.alive) return;

  const busy: Agent["state"][] = [
    "eat",
    "sleep",
    "court",
    "seekFood",
    "seekRest",
    "seekMate",
    "seekGather",
    "gather",
    "deposit",
    "returnHome",
    "patrol",
    "seekBuild",
    "build",
    "craft",
  ];

  if (!busy.includes(agent.state)) {
    decideState(world, agent);
  } else if (agent.hunger > hungryThreshold(agent) && agent.state !== "eat" && agent.state !== "seekFood") {
    if (agent.state === "gather" || agent.state === "deposit" || agent.state === "seekGather") {
      if (agent.carriedFood > 0 && agent.hunger > 92) {
        agent.hunger = clamp(agent.hunger - agent.carriedFood * 10, 0, 100);
        agent.carriedFood = 0;
      }
    }
    setTask(agent, "eat", "seekFood");
  } else if (
    isBeyondLeash(world, agent) &&
    agent.state !== "returnHome" &&
    agent.state !== "seekFood" &&
    agent.state !== "eat" &&
    agent.state !== "deposit" &&
    agent.state !== "seekRest" &&
    agent.state !== "sleep" &&
    agent.state !== "court" &&
    agent.state !== "seekMate" &&
    agent.hunger < hungryThreshold(agent) - 8
  ) {
    if (agent.carriedFood > 0) setTask(agent, "deposit", "deposit");
    else setTask(agent, "returnHome", "returnHome");
  }

  switch (agent.state) {
    case "seekFood":
      actSeekFood(world, agent);
      break;
    case "eat":
      actEat(world, agent);
      break;
    case "seekGather":
      actSeekGather(world, agent);
      break;
    case "gather":
      actGather(world, agent);
      break;
    case "deposit":
      actDeposit(world, agent);
      break;
    case "seekRest":
      actSeekRest(world, agent);
      break;
    case "sleep":
      actSleep(world, agent);
      break;
    case "returnHome":
      actReturnHome(world, agent);
      break;
    case "patrol":
    case "wander":
      actPatrol(world, agent);
      break;
    case "seekBuild":
      actSeekBuild(world, agent);
      break;
    case "build":
      actBuild(world, agent);
      break;
    case "craft":
      actCraft(world, agent);
      break;
    case "idle":
      actIdle(world, agent);
      break;
    case "seekMate":
      actSeekMate(world, agent);
      break;
    case "court":
      actCourt(world, agent);
      break;
  }
}

export function simulateTick(world: World): void {
  world.tick += 1;
  world.stats.timeOfDay = (world.tick % world.dayLength) / world.dayLength;
  if (world.tick % world.dayLength === 0) {
    world.stats.day += 1;
    tickDailyShocks(world);
    tickDailyGovernment(world);
    maybeStartHutBuild(world);
    tickDailyMigration(world);
    tickDailyImmigration(world);
    tickDailyCraft(world);
    tickDailyCaravan(world);
    rebalanceVillageLabor(world);
    recordDaySnapshot(world);
  }

  regenerateFood(world);

  for (const agent of world.agents) {
    tickAgent(world, agent);
  }

  if (world.agents.length > 220) {
    const bodies = world.agents.filter((a) => !a.alive);
    if (bodies.length > 40) {
      const remove = new Set(bodies.slice(0, bodies.length - 40).map((a) => a.id));
      world.agents = world.agents.filter((a) => !remove.has(a.id));
    }
  }

  world.stats.alive = world.agents.filter((a) => a.alive).length;
  syncBarnStat(world);
}
