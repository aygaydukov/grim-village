/**
 * Прогон модуляции → docs/status.json для GitHub Pages.
 * Накапливает lifetime (число прогонов и суммарные дни).
 */
import { execSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildVillageChronicle, currentSeasonLabel } from "../src/sim/chronicle.ts";
import { formatStabilityReport, runModulation } from "../src/sim/modulate.ts";
import { countByProfession } from "../src/sim/jobs.ts";
import { barnStock } from "../src/sim/map.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const docsDir = join(root, "docs");
const statusPath = join(docsDir, "status.json");

const days = Number(process.argv[2] ?? 10);
const seed = Number(process.argv[3] ?? Date.now() % 1_000_000);

interface Lifetime {
  runs: number;
  daysSimulated: number;
  firstSeenAt: string;
}

interface ChangelogEntry {
  hash: string;
  date: string;
  subject: string;
}

interface VillageStatus {
  updatedAt: string;
  project: {
    name: string;
    tagline: string;
    repo: string;
    playHint: string;
  };
  lifetime: Lifetime;
  modulation: {
    seed: number;
    days: number;
    stable: boolean;
    finalAlive: number;
    initialAlive: number;
    dead: number;
    births: number;
    barnFood: number;
    avgHunger: number;
    avgEnergy: number;
    issues: string[];
    reportText: string;
  };
  village: {
    day: number;
    season: string;
    alive: number;
    dead: number;
    births: number;
    barnFood: number;
    professions: Record<string, number>;
  };
  chronicle: string[];
  changelog: ChangelogEntry[];
}

function loadPrevLifetime(): Lifetime | null {
  if (!existsSync(statusPath)) return null;
  try {
    const prev = JSON.parse(readFileSync(statusPath, "utf8")) as VillageStatus;
    return prev.lifetime ?? null;
  } catch {
    return null;
  }
}

function recentChangelog(limit = 12): ChangelogEntry[] {
  try {
    const out = execSync(`git log -${limit} --format=%h%x09%as%x09%s`, {
      cwd: root,
      encoding: "utf8",
    });
    return out
      .trim()
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        const [hash, date, ...rest] = line.split("\t");
        return { hash: hash ?? "", date: date ?? "", subject: rest.join("\t") };
      });
  } catch {
    return [];
  }
}

const prevLife = loadPrevLifetime();
const now = new Date().toISOString();
const { world, report } = runModulation(days, seed);
console.log(formatStabilityReport(report));

const lifetime: Lifetime = {
  runs: (prevLife?.runs ?? 0) + 1,
  daysSimulated: (prevLife?.daysSimulated ?? 0) + days,
  firstSeenAt: prevLife?.firstSeenAt ?? now,
};

const alive = world.agents.filter((a) => a.alive).length;

const status: VillageStatus = {
  updatedAt: now,
  project: {
    name: "Мрачная деревня",
    tagline: "Автономный средневековый мир: агент каждый день чинит и усложняет общество",
    repo: "https://github.com/aygaydukov/grim-village",
    playHint: "Игра деплоится отдельно; здесь — пульс общества и летопись прогонов",
  },
  lifetime,
  modulation: {
    seed: report.seed,
    days: report.days,
    stable: report.stable,
    finalAlive: report.finalAlive,
    initialAlive: report.initialAlive,
    dead: report.dead,
    births: report.births,
    barnFood: report.barnFood,
    avgHunger: report.avgHunger,
    avgEnergy: report.avgEnergy,
    issues: report.issues,
    reportText: formatStabilityReport(report),
  },
  village: {
    day: world.stats.day,
    season: currentSeasonLabel(world),
    alive,
    dead: world.stats.dead,
    births: world.stats.births,
    barnFood: barnStock(world),
    professions: countByProfession(world),
  },
  chronicle: buildVillageChronicle(world, 14),
  changelog: recentChangelog(14),
};

mkdirSync(docsDir, { recursive: true });
writeFileSync(statusPath, `${JSON.stringify(status, null, 2)}\n`, "utf8");
console.log(`Wrote ${statusPath}`);
console.log(
  `Lifetime: runs=${lifetime.runs}, daysSimulated=${lifetime.daysSimulated}`,
);

if (!report.stable) {
  process.exitCode = 1;
}
