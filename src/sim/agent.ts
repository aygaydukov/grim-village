import { pickProfessionForNew } from "./jobs";
import { fullName, randomName, randomSurname } from "./names";
import type { Agent, AgentSex, Profession, World } from "./types";
import { chance, clamp } from "./util";

const ADULT_AGE = 16;
const MAX_AGE = 72;
const CHILD_AGE = 12;
export const MAX_CARRY = 3;

export function createAgent(
  world: World,
  opts: {
    x: number;
    y: number;
    sex?: AgentSex;
    age?: number;
    homeX?: number;
    homeY?: number;
    motherId?: number | null;
    fatherId?: number | null;
    spouseId?: number | null;
    profession?: Profession;
    surname?: string;
  },
): Agent {
  const sex = opts.sex ?? (chance(world.rng, 0.5) ? "male" : "female");
  const age = opts.age ?? 18 + Math.floor(world.rng() * 25);
  const id = world.nextId++;
  const profession = opts.profession ?? pickProfessionForNew(world, age);
  return {
    id,
    name: randomName(sex, world.rng),
    surname: opts.surname ?? randomSurname(world.rng),
    sex,
    x: opts.x,
    y: opts.y,
    age,
    hunger: 15 + world.rng() * 25,
    energy: 55 + world.rng() * 35,
    profession,
    task: "idle",
    state: "idle",
    targetX: null,
    targetY: null,
    mateId: null,
    spouseId: opts.spouseId ?? null,
    motherId: opts.motherId ?? null,
    fatherId: opts.fatherId ?? null,
    pregnant: 0,
    carriedFood: 0,
    homeX: opts.homeX ?? opts.x,
    homeY: opts.homeY ?? opts.y,
    alive: true,
    deathCause: null,
    cooldown: 0,
  };
}

export function isAdult(agent: Agent): boolean {
  return agent.age >= ADULT_AGE;
}

export function isChild(agent: Agent): boolean {
  return agent.age < CHILD_AGE;
}

export function canMate(agent: Agent): boolean {
  return (
    agent.alive &&
    isAdult(agent) &&
    agent.age < 55 &&
    agent.hunger < 50 &&
    agent.energy > 45 &&
    agent.pregnant <= 0 &&
    agent.cooldown <= 0 &&
    agent.carriedFood === 0
  );
}

export function ageLabel(age: number): string {
  if (age < 3) return "младенец";
  if (age < CHILD_AGE) return "ребёнок";
  if (age < ADULT_AGE) return "подросток";
  if (age < 50) return "взрослый";
  if (age < 65) return "старший";
  return "старец";
}

export function killAgent(agent: Agent, cause: string): void {
  agent.alive = false;
  agent.deathCause = cause;
  agent.state = "idle";
  agent.task = "idle";
  agent.targetX = null;
  agent.targetY = null;
  agent.carriedFood = 0;
}

export function moveToward(
  world: World,
  agent: Agent,
  tx: number,
  ty: number,
  speed: number,
): boolean {
  const dx = tx - agent.x;
  const dy = ty - agent.y;
  const d = Math.hypot(dx, dy);
  if (d < 0.15) {
    agent.x = tx;
    agent.y = ty;
    return true;
  }

  const step = Math.min(speed, d);
  const ndx = dx / d;
  const ndy = dy / d;
  const candidates = [
    { x: agent.x + ndx * step, y: agent.y + ndy * step },
    { x: agent.x + ndx * step, y: agent.y },
    { x: agent.x, y: agent.y + ndy * step },
    { x: agent.x + Math.sign(dx) * step, y: agent.y },
    { x: agent.x, y: agent.y + Math.sign(dy) * step },
  ];

  for (const c of candidates) {
    const tileX = Math.floor(c.x);
    const tileY = Math.floor(c.y);
    const tile = world.tiles[tileY * world.width + tileX];
    if (!tile || tile.kind === "water") continue;
    agent.x = c.x;
    agent.y = c.y;
    return Math.hypot(tx - agent.x, ty - agent.y) < 0.15;
  }

  agent.targetX = null;
  agent.targetY = null;
  agent.state = "idle";
  agent.task = "idle";
  return false;
}

/** @deprecated используй setLocalTarget из jobs — оставлен для совместимости */
export function setWanderTarget(world: World, agent: Agent): void {
  for (let i = 0; i < 8; i++) {
    const angle = world.rng() * Math.PI * 2;
    const d = 1 + world.rng() * 3;
    const tx = agent.homeX + Math.cos(angle) * d;
    const ty = agent.homeY + Math.sin(angle) * d;
    if (tx < 1 || ty < 1 || tx >= world.width - 1 || ty >= world.height - 1) continue;
    const tile = world.tiles[Math.floor(ty) * world.width + Math.floor(tx)];
    if (tile && tile.kind !== "water") {
      agent.targetX = tx;
      agent.targetY = ty;
      return;
    }
  }
  agent.targetX = clamp(agent.homeX + (world.rng() - 0.5) * 2, 1, world.width - 2);
  agent.targetY = clamp(agent.homeY + (world.rng() - 0.5) * 2, 1, world.height - 2);
}

export function spawnInitialPopulation(
  world: World,
  hutSpots: { x: number; y: number }[],
  count: number,
): void {
  const spots = hutSpots.length > 0 ? hutSpots : [{ x: world.width / 2, y: world.height / 2 }];
  let spawned = 0;
  let spotIndex = 0;

  // Семьями: пара + иногда дети
  while (spawned < count) {
    const hut = spots[spotIndex % spots.length]!;
    spotIndex += 1;
    const homeX = hut.x + 0.5;
    const homeY = hut.y + 0.5;
    const surname = randomSurname(world.rng);

    const father = createAgent(world, {
      x: homeX + (world.rng() - 0.5),
      y: homeY + (world.rng() - 0.5),
      sex: "male",
      age: 22 + Math.floor(world.rng() * 28),
      homeX,
      homeY,
      surname,
    });
    const mother = createAgent(world, {
      x: homeX + (world.rng() - 0.5),
      y: homeY + (world.rng() - 0.5),
      sex: "female",
      age: 20 + Math.floor(world.rng() * 26),
      homeX,
      homeY,
      surname,
    });
    father.spouseId = mother.id;
    mother.spouseId = father.id;
    world.agents.push(father, mother);
    spawned += 2;

    const kids = Math.min(count - spawned, world.rng() < 0.55 ? 1 + (world.rng() < 0.35 ? 1 : 0) : 0);
    for (let k = 0; k < kids; k++) {
      const child = createAgent(world, {
        x: homeX + (world.rng() - 0.5) * 1.2,
        y: homeY + (world.rng() - 0.5) * 1.2,
        sex: chance(world.rng, 0.5) ? "male" : "female",
        age: 1 + Math.floor(world.rng() * 14),
        homeX,
        homeY,
        motherId: mother.id,
        fatherId: father.id,
        surname,
      });
      world.agents.push(child);
      spawned += 1;
    }
  }

  // Если перебор — обрежем хвост (редко)
  if (world.agents.length > count + 2) {
    world.agents = world.agents.slice(0, Math.max(count, 16));
  }

  for (const a of world.agents) {
    if (!a.alive) continue;
    if (a.age < CHILD_AGE) a.profession = "child";
    else if (a.age >= 65) a.profession = "elder";
  }

  const workers = world.agents.filter((a) => a.alive && a.age >= ADULT_AGE && a.age < 65);
  workers.forEach((a, i) => {
    const t = workers.length <= 1 ? 0.5 : i / (workers.length - 1);
    if (t < 0.22) a.profession = "keeper";
    else if (t < 0.62) a.profession = "gatherer";
    else a.profession = "laborer";
  });
}

/** Имя агента по id или «—» */
export function agentNameById(world: World, id: number | null): string {
  if (id == null) return "—";
  const a = world.agents.find((x) => x.id === id);
  if (!a) return "† неизвестно";
  return a.alive ? fullName(a) : `${fullName(a)} †`;
}

export function childrenOf(world: World, parentId: number): Agent[] {
  return world.agents.filter(
    (a) => a.motherId === parentId || a.fatherId === parentId,
  );
}

export { ADULT_AGE, MAX_AGE };
