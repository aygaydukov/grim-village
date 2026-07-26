#!/usr/bin/env tsx
/**
 * settlement-cli.ts new
 * settlement-cli.ts snapshot-after-sim [days=10]
 *
 * snapshot-after-sim: load/create current settlement → run N days → SVG snapshot → docs/
 */
import { copyFileSync, mkdirSync, existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { GAME_VERSION } from "../src/version.ts";
import { stepWorld } from "../src/sim/world.ts";
import { formatStabilityReport, evaluateStability } from "../src/sim/modulate.ts";
import { renderSettlementSvg } from "./settlement-snapshot.ts";
import {
  startNewSettlement,
  defaultDataDir,
  loadRegistry,
  loadCurrentWorld,
  saveCurrentWorld,
  saveRegistry,
  writeSettlementPublicMirror,
} from "./settlement-store.ts";

const cmd = process.argv[2] ?? "help";
const dir = defaultDataDir();

function publishDocsSnapshot(version: number, fromAbs: string, label: string): string {
  const docsDir = join(process.cwd(), "docs", "settlements", `v${version}`);
  mkdirSync(docsDir, { recursive: true });
  const dest = join(docsDir, "snapshot.svg");
  copyFileSync(fromAbs, dest);
  const metaPath = join(docsDir, "meta.json");
  writeFileSync(
    metaPath,
    `${JSON.stringify(
      {
        version,
        label,
        gameVersion: GAME_VERSION,
        capturedAt: new Date().toISOString(),
        source: fromAbs,
      },
      null,
      2,
    )}\n`,
  );
  console.log(`docs snapshot -> ${dest} (${label})`);
  return dest;
}

if (cmd === "new") {
  const { meta } = startNewSettlement(dir, Date.now() % 1_000_000, GAME_VERSION, "manual_new");
  if (meta.snapshotPath) {
    const from = join(dir, meta.snapshotPath);
    if (existsSync(from)) publishDocsSnapshot(meta.version, from, "spawn");
  }
  console.log(JSON.stringify(meta, null, 2));
  process.exit(0);
}

if (cmd === "snapshot-after-sim") {
  const days = Number(process.argv[3] ?? 10);
  let registry = loadRegistry(dir);
  let world = loadCurrentWorld(dir);
  let version = registry.currentVersion;
  let settlementId = registry.settlements.find((s) => s.version === version)?.id;

  if (!world || version < 1) {
    const started = startNewSettlement(dir, Date.now() % 1_000_000, GAME_VERSION, "snapshot_boot");
    world = started.world;
    version = started.meta.version;
    settlementId = started.meta.id;
    registry = started.registry;
  }

  const initialAlive = world.agents.filter((a) => a.alive).length;
  console.log(
    `[snapshot-after-sim] settlement-v${version} day=${world.stats.day} → +${days} days`,
  );
  stepWorld(world, days * world.dayLength);
  const report = evaluateStability(world, initialAlive);
  report.seed = world.seed;
  report.days = days;
  console.log(formatStabilityReport(report));

  const snapRel = `settlements/v${version}/snapshot-after-${days}d.svg`;
  const snapAbs = join(dir, snapRel);
  mkdirSync(join(dir, "settlements", `v${version}`), { recursive: true });
  writeFileSync(snapAbs, renderSettlementSvg(world), "utf8");

  const meta = registry.settlements.find((s) => s.version === version);
  if (meta) {
    meta.snapshotPath = snapRel;
    meta.gameVersion = GAME_VERSION;
    meta.finalAlive = world.agents.filter((a) => a.alive).length;
    meta.finalDay = world.stats.day;
    saveRegistry(registry, dir);
  }

  saveCurrentWorld(
    world,
    { settlementVersion: version, settlementId: settlementId ?? `settlement-v${version}` },
    dir,
  );
  if (meta) writeSettlementPublicMirror(world, meta, registry, dir);

  publishDocsSnapshot(version, snapAbs, `after_${days}_days`);

  if (!report.stable) {
    console.warn("[snapshot-after-sim] unstable after sim — automation may drop settlement");
    process.exitCode = 1;
  }
  process.exit();
}

console.error("Usage:\n  settlement-cli.ts new\n  settlement-cli.ts snapshot-after-sim [days]");
process.exit(1);
