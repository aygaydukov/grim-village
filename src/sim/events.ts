import { fullName } from "./names";
import { professionLabel } from "./jobs";
import type { Agent, DayEvent, Profession, World } from "./types";

const MAX_EVENTS_PER_DAY = 24;

/** Записать рождение в буфер текущего дня */
export function recordBirth(world: World, agent: Agent): void {
  pushEvent(world, { kind: "birth", name: fullName(agent) });
}

/** Записать смерть с причиной */
export function recordDeath(world: World, agent: Agent, cause: string): void {
  pushEvent(world, { kind: "death", name: fullName(agent), detail: cause });
}

/** Записать сезонный шок (неурожай и т.п.) */
export function recordShock(world: World, name: string, detail: string): void {
  pushEvent(world, { kind: "shock", name, detail });
}

/** Записать завершение стройки */
export function recordConstruction(world: World, detail: string): void {
  pushEvent(world, { kind: "construction", name: "хижина", detail });
}

/** Записать событие управления (казна, староста) */
export function recordGovernment(world: World, name: string, detail: string): void {
  pushEvent(world, { kind: "government", name, detail });
}

/** Записать исход семьи из деревни */
export function recordMigration(world: World, names: string, count: number): void {
  const detail = count > 1 ? `${count} душ` : "один";
  pushEvent(world, { kind: "migration", name: names, detail });
}

/** Записать смену профессии (только если реально изменилась) */
export function recordProfessionChange(
  world: World,
  agent: Agent,
  from: Profession,
  to: Profession,
): void {
  if (from === to) return;
  pushEvent(world, {
    kind: "profession",
    name: fullName(agent),
    detail: `${professionLabel(from)} → ${professionLabel(to)}`,
  });
}

/** Снять и очистить буфер событий дня */
export function takeDayEvents(world: World): DayEvent[] {
  const events = world.pendingDayEvents.slice();
  world.pendingDayEvents = [];
  return events;
}

function pushEvent(world: World, event: DayEvent): void {
  if (world.pendingDayEvents.length >= MAX_EVENTS_PER_DAY) return;
  world.pendingDayEvents.push(event);
}
