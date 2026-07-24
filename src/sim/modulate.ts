import { DEFAULT_CONFIG, initWorld, stepWorld } from "./world";
import type { World, WorldConfig } from "./types";

export interface StabilityReport {
  seed: number;
  days: number;
  initialAlive: number;
  finalAlive: number;
  dead: number;
  births: number;
  barnFood: number;
  avgHunger: number;
  avgEnergy: number;
  stable: boolean;
  issues: string[];
}

export interface StabilityThresholds {
  minAliveRatio: number;
  maxDeathRatio: number;
  minBarnFood: number;
  maxAvgHunger: number;
}

export const DEFAULT_THRESHOLDS: StabilityThresholds = {
  minAliveRatio: 0.5,
  maxDeathRatio: 0.4,
  minBarnFood: 8,
  maxAvgHunger: 78,
};

export function evaluateStability(
  world: World,
  initialAlive: number,
  thresholds: StabilityThresholds = DEFAULT_THRESHOLDS,
): StabilityReport {
  const alive = world.agents.filter((a) => a.alive);
  let hungerSum = 0;
  let energySum = 0;
  for (const a of alive) {
    hungerSum += a.hunger;
    energySum += a.energy;
  }
  const n = Math.max(1, alive.length);
  const issues: string[] = [];

  if (alive.length === 0) issues.push("население вымерло");
  if (alive.length < initialAlive * thresholds.minAliveRatio) {
    issues.push(
      `мало живых: ${alive.length} < ${Math.ceil(initialAlive * thresholds.minAliveRatio)}`,
    );
  }
  if (world.stats.dead > initialAlive * thresholds.maxDeathRatio) {
    issues.push(
      `много смертей: ${world.stats.dead} > ${Math.ceil(initialAlive * thresholds.maxDeathRatio)}`,
    );
  }
  if (world.stats.barnFood < thresholds.minBarnFood) {
    issues.push(`амбар пуст: ${world.stats.barnFood} < ${thresholds.minBarnFood}`);
  }
  const avgHunger = hungerSum / n;
  if (avgHunger > thresholds.maxAvgHunger) {
    issues.push(`высокий голод: ${avgHunger.toFixed(1)} > ${thresholds.maxAvgHunger}`);
  }

  return {
    seed: 0,
    days: world.stats.day - 1,
    initialAlive,
    finalAlive: alive.length,
    dead: world.stats.dead,
    births: world.stats.births,
    barnFood: world.stats.barnFood,
    avgHunger,
    avgEnergy: energySum / n,
    stable: issues.length === 0,
    issues,
  };
}

export function runModulation(
  days: number,
  seed = 1337,
  config: WorldConfig = DEFAULT_CONFIG,
): { world: World; report: StabilityReport } {
  const world = initWorld(config, seed);
  const initialAlive = world.stats.alive;
  stepWorld(world, days * world.dayLength);
  const report = evaluateStability(world, initialAlive);
  report.seed = seed;
  report.days = days;
  return { world, report };
}

export function formatStabilityReport(report: StabilityReport): string {
  const status = report.stable ? "СТАБИЛЬНО" : "НЕСТАБИЛЬНО";
  const lines = [
    `[${status}] seed=${report.seed} days=${report.days}`,
    `  живые: ${report.finalAlive} (старт ${report.initialAlive})`,
    `  смерти: ${report.dead}, рождения: ${report.births}`,
    `  амбар: ${report.barnFood}, голод ср.: ${report.avgHunger.toFixed(1)}, силы ср.: ${report.avgEnergy.toFixed(1)}`,
  ];
  if (report.issues.length > 0) {
    lines.push(`  проблемы: ${report.issues.join("; ")}`);
  }
  return lines.join("\n");
}
