#!/usr/bin/env tsx
import { copyFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { GAME_VERSION } from "../src/version.ts";
import { startNewSettlement, defaultDataDir, loadRegistry } from "./settlement-store.ts";

const cmd = process.argv[2] ?? "new";
const dir = defaultDataDir();

if (cmd === "new") {
  const { meta } = startNewSettlement(dir, Date.now() % 1_000_000, GAME_VERSION, "manual_new");
  const docsDir = join(process.cwd(), "docs", "settlements", `v${meta.version}`);
  mkdirSync(docsDir, { recursive: true });
  if (meta.snapshotPath) {
    const from = join(dir, meta.snapshotPath);
    if (existsSync(from)) {
      copyFileSync(from, join(docsDir, "snapshot.svg"));
      console.log(`docs snapshot -> ${docsDir}/snapshot.svg`);
    }
  }
  console.log(JSON.stringify(meta, null, 2));
  console.log("registry versions:", loadRegistry(dir).settlements.length);
  process.exit(0);
}

console.error("Usage: settlement-cli.ts new");
process.exit(1);
