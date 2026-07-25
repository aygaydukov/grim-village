import { SEASON_LABELS, seasonForDay } from "./season";
import type { DaySnapshot, World } from "./types";

export function formatDayEntry(snap: DaySnapshot, prev?: DaySnapshot): string {
  const season = SEASON_LABELS[snap.season];
  const parts: string[] = [
    `День ${snap.day} (${season}): живы ${snap.alive}, амбар ${snap.barnFood}, дикая еда ${snap.wildFood}.`,
  ];

  const birthsToday = snap.birthsToday ?? (prev ? snap.births - prev.births : 0);
  const deathsToday = snap.deathsToday ?? (prev ? snap.dead - prev.dead : 0);

  if (birthsToday > 0) {
    parts.push(birthWord(birthsToday));
  }
  if (deathsToday > 0) {
    parts.push(deathWord(deathsToday));
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
  if (prev && gatherers > prev.professions.gatherer + 1) {
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
