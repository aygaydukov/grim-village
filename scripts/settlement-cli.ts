#!/usr/bin/env tsx
import { mkdirSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { GAME_VERSION } from "../src/version.ts";
import { runModulation } from "../src/sim/modulate.ts";
import { renderSettlementSvg } from "./settlement-snapshot.ts";
import {
  startNewSettlement,
  defaultDataDir,
  loadRegistry,
  loadCurrentWorld,
  saveRegistry,
} from "./settlement-store.ts";

const cmd = process.argv[2] ?? "snapshot";
const dir = defaultDataDir();

function stamp(): string {
  return new Date().toISOString().replaceAll(":", "-").replace(/\.\d+Z$/, "Z");
}

function publishDocsSnapshot(version: number, svg: string, label: string): void {
  const docsDir = join(process.cwd(), "docs", "settlements", `v${version}`);
  mkdirSync(docsDir, { recursive: true });
  writeFileSync(join(docsDir, "snapshot.svg"), svg, "utf8");
  writeFileSync(join(docsDir, `snapshot-${label}.svg`), svg, "utf8");
  console.log(`docs snapshot -> docs/settlements/v${version}/snapshot.svg`);
  console.log(`docs archive  -> docs/settlements/v${version}/snapshot-${label}.svg`);
}

if (cmd === "new") {
  const { meta } = startNewSettlement(dir, Date.now() % 1_000_000, GAME_VERSION, "manual_new");
  if (meta.snapshotPath) {
    const from = join(dir, meta.snapshotPath);
    if (existsSync(from)) {
      publishDocsSnapshot(meta.version, readFileSync(from, "utf8"), stamp());
    }
  }
  console.log(JSON.stringify(meta, null, 2));
  process.exit(0);
}

if (cmd === "snapshot") {
  let world = loadCurrentWorld(dir);
  let registry = loadRegistry(dir);
  if (!world || registry.currentVersion < 1) {
    const started = startNewSettlement(dir, Date.now() % 1_000_000, GAME_VERSION, "snapshot_bootstrap");
    world = started.world;
    registry = started.registry;
  }

  if (world.stats.day <= 2) {
    world = runModulation(3, world.seed).world;
  }

  const version = Math.max(1, registry.currentVersion);
  const svg = renderSettlementSvg(world);
  const dataDir = join(dir, "settlements", `v${version}`);
  mkdirSync(dataDir, { recursive: true });
  writeFileSync(join(dataDir, "snapshot.svg"), svg, "utf8");

  const label = stamp();
  publishDocsSnapshot(version, svg, label);

  const meta = registry.settlements.find((s) => s.version === version);
  if (meta) {
    meta.snapshotPath = `settlements/v${version}/snapshot.svg`;
    meta.gameVersion = GAME_VERSION;
    saveRegistry(registry, dir);
  }

  console.log(
    JSON.stringify(
      {
        settlementVersion: version,
        gameVersion: GAME_VERSION,
        day: world.stats.day,
        alive: world.stats.alive,
        docs: `docs/settlements/v${version}/snapshot.svg`,
      },
      null,
      2,
    ),
  );
  process.exit(0);
}

console.error("Usage: settlement-cli.ts <snapshot|new>");
process.exit(1);
