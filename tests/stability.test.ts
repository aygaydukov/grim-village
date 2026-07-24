import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { runModulation } from "../src/sim/modulate.ts";

describe("стабильность деревни", () => {
  const seeds = [1337, 2026, 4242, 777, 9001];

  for (const seed of seeds) {
    it(`10 дней, seed=${seed}`, () => {
      const { report } = runModulation(10, seed);
      assert.equal(
        report.stable,
        true,
        `seed ${seed}: ${report.issues.join("; ")} | alive=${report.finalAlive} barn=${report.barnFood} hunger=${report.avgHunger.toFixed(1)}`,
      );
    });
  }
});
