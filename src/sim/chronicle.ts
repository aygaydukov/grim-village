import { SEASON_LABELS, seasonForDay } from "./season";
import type { DayEvent, DaySnapshot, World } from "./types";

export function formatDayEntry(snap: DaySnapshot, prev?: DaySnapshot): string {
  const season = SEASON_LABELS[snap.season];
  const parts: string[] = [
    `День ${snap.day} (${season}): живы ${snap.alive}, амбар ${snap.barnFood}, дикая еда ${snap.wildFood}.`,
  ];

  const birthsToday = snap.birthsToday ?? (prev ? snap.births - prev.births : 0);
  const deathsToday = snap.deathsToday ?? (prev ? snap.dead - prev.dead : 0);
  const events = snap.events ?? [];

  const namedBirths = events.filter((e) => e.kind === "birth");
  const namedDeaths = events.filter((e) => e.kind === "death");
  const namedProf = events.filter((e) => e.kind === "profession");
  const namedShocks = events.filter((e) => e.kind === "shock");
  const namedBuilds = events.filter((e) => e.kind === "construction");
  const namedGov = events.filter((e) => e.kind === "government");

  if (namedShocks.length > 0) {
    parts.push(formatShocks(namedShocks));
  }

  if (namedBuilds.length > 0) {
    parts.push(formatConstruction(namedBuilds));
  }

  if (namedGov.length > 0) {
    parts.push(formatGovernment(namedGov));
  }

  if (namedBirths.length > 0) {
    parts.push(formatNamedList("родился", namedBirths.map((e) => e.name)));
  } else if (birthsToday > 0) {
    parts.push(birthWord(birthsToday));
  }

  if (namedDeaths.length > 0) {
    parts.push(formatDeaths(namedDeaths));
  } else if (deathsToday > 0) {
    parts.push(deathWord(deathsToday));
  }

  if (namedProf.length > 0) {
    parts.push(formatProfessionChanges(namedProf));
  }

  if (snap.highHunger >= Math.max(3, Math.ceil(snap.alive * 0.45))) {
    parts.push(`голод давит — ${snap.highHunger} на грани.`);
  } else if (snap.avgHunger > 72) {
    parts.push(`средний голод ${snap.avgHunger.toFixed(0)} — тревожно.`);
  }

  const barnDelta = prev ? snap.barnFood - prev.barnFood : 0;
  if (barnDelta >= 12) parts.push("амбар полнел.");
  else if (barnDelta <= -10 && snap.barnFood < 20) parts.push("запасы тают.");

  const gatherers = snap.professions.gatherer;
  if (prev && gatherers > prev.professions.gatherer + 1 && namedProf.length === 0) {
    parts.push("на сбор ушло больше рук.");
  }

  return parts.join(" ");
}

export function buildVillageChronicle(world: World, maxEntries = 12): string[] {
  const history = world.dayHistory;
  if (history.length === 0) {
    return [`День ${world.stats.day}: летопись ещё пуста.`];
  }

  const start = Math.max(0, history.length - maxEntries);
  const lines: string[] = [];
  for (let i = start; i < history.length; i++) {
    const snap = history[i]!;
    const prev = i > 0 ? history[i - 1] : undefined;
    lines.push(formatDayEntry(snap, prev));
  }
  return lines;
}

export function currentSeasonLabel(world: World): string {
  return SEASON_LABELS[seasonForDay(world.stats.day)];
}

function formatNamedList(verb: string, names: string[]): string {
  if (names.length === 1) return `${verb} ${names[0]}.`;
  if (names.length <= 3) return `${verb} ${names.join(", ")}.`;
  return `${verb} ${names.slice(0, 2).join(", ")} и ещё ${names.length - 2}.`;
}

function formatDeaths(events: DayEvent[]): string {
  if (events.length === 1) {
    const e = events[0]!;
    return e.detail ? `умер ${e.name} (${e.detail}).` : `умер ${e.name}.`;
  }
  if (events.length <= 3) {
    return events.map((e) => (e.detail ? `${e.name} (${e.detail})` : e.name)).join(", ") + " — земля приняла.";
  }
  return `умерло ${events.length}: ${events
    .slice(0, 2)
    .map((e) => e.name)
    .join(", ")} и ещё ${events.length - 2}.`;
}

function formatGovernment(events: DayEvent[]): string {
  if (events.length === 1) {
    const e = events[0]!;
    return e.detail ? `${e.name}: ${e.detail}.` : `${e.name}.`;
  }
  return events.map((e) => (e.detail ? `${e.name} — ${e.detail}` : e.name)).join("; ") + ".";
}

function formatConstruction(events: DayEvent[]): string {
  if (events.length === 1) {
    const e = events[0]!;
    return e.detail ? `возведена ${e.name}: ${e.detail}.` : `возведена ${e.name}.`;
  }
  return `стройка: ${events.length} новых построек.`;
}

function formatShocks(events: DayEvent[]): string {
  if (events.length === 1) {
    const e = events[0]!;
    return e.detail ? `${e.name}: ${e.detail}.` : `${e.name}.`;
  }
  return events.map((e) => (e.detail ? `${e.name} — ${e.detail}` : e.name)).join("; ") + ".";
}

function formatProfessionChanges(events: DayEvent[]): string {
  if (events.length === 1) {
    const e = events[0]!;
    return e.detail ? `${e.name}: ${e.detail}.` : `${e.name} сменил занятие.`;
  }
  if (events.length <= 2) {
    return events.map((e) => (e.detail ? `${e.name} — ${e.detail}` : e.name)).join("; ") + ".";
  }
  return `перераспределение труда: ${events.length} человек.`;
}

function birthWord(n: number): string {
  if (n === 1) return "родился один.";
  if (n >= 2 && n <= 4) return `родилось ${n}.`;
  return `родилось ${n} душ.`;
}

function deathWord(n: number): string {
  if (n === 1) return "земля приняла одного.";
  if (n >= 2 && n <= 4) return `умерло ${n}.`;
  return `умерло ${n} душ.`;
}
