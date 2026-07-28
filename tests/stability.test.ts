import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { deserializeWorld, serializeWorld } from "../src/sim/persist.ts";
import { runModulation } from "../src/sim/modulate.ts";
import { stepWorld } from "../src/sim/world.ts";

describe("сохранение мира", () => {
  it("roundtrip serialize/deserialize сохраняет состояние", () => {
    const { world: original } = runModulation(3, 4242);
    const saved = serializeWorld(original);
    const loaded = deserializeWorld(saved);

    assert.equal(loaded.seed, original.seed);
    assert.equal(loaded.tick, original.tick);
    assert.equal(loaded.stats.day, original.stats.day);
    assert.equal(loaded.stats.alive, original.stats.alive);
    assert.equal(loaded.agents.length, original.agents.length);
    assert.equal(loaded.dayHistory.length, original.dayHistory.length);
    assert.equal(loaded.buildProject?.progress ?? null, original.buildProject?.progress ?? null);
    assert.equal(loaded.lastHutBuiltDay, original.lastHutBuiltDay);
    assert.equal(loaded.treasury, original.treasury);
    assert.equal(loaded.starostaId, original.starostaId);
    assert.equal(loaded.starostaPolicy, original.starostaPolicy);
    assert.equal(loaded.lastMigrationDay, original.lastMigrationDay);
    assert.equal(loaded.lastImmigrationDay, original.lastImmigrationDay);
    assert.equal(loaded.craftStock, original.craftStock);

    stepWorld(loaded, loaded.dayLength);
    stepWorld(original, original.dayLength);
    assert.equal(loaded.stats.alive, original.stats.alive);
    assert.equal(loaded.stats.day, original.stats.day);
  });
});

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
