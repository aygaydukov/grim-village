import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { deserializeWorld, serializeWorld } from "../src/sim/persist.ts";
import {
  runModulation,
  LONG_THRESHOLDS,
  EXTRA_LONG_THRESHOLDS,
  ULTRA_LONG_THRESHOLDS,
  MEGA_LONG_THRESHOLDS,
  SUPER_LONG_THRESHOLDS,
  HYPER_LONG_THRESHOLDS,
  OMEGA_LONG_THRESHOLDS,
  GIGA_LONG_THRESHOLDS,
  TERA_LONG_THRESHOLDS,
  PETA_LONG_THRESHOLDS,
  EXA_LONG_THRESHOLDS,
  ZETTA_LONG_THRESHOLDS,
  YOTTA_LONG_THRESHOLDS,
  ROMA_LONG_THRESHOLDS,
  NOVA_LONG_THRESHOLDS,
  LUNA_LONG_THRESHOLDS,
  SOL_LONG_THRESHOLDS,
  SOLA_LONG_THRESHOLDS,
  ASTRA_LONG_THRESHOLDS,
  BORA_LONG_THRESHOLDS,
} from "../src/sim/modulate.ts";
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
    assert.equal(loaded.saltStock, original.saltStock);
    assert.equal(loaded.ironStock, original.ironStock);
    assert.equal(loaded.lastCaravanDay, original.lastCaravanDay);
    assert.equal(loaded.lastEpidemicDay, original.lastEpidemicDay);
    assert.equal(loaded.sickHutX, original.sickHutX);
    assert.equal(loaded.sickHutY, original.sickHutY);
    assert.equal(loaded.sickHut2X, original.sickHut2X);
    assert.equal(loaded.sickHut2Y, original.sickHut2Y);
    assert.equal(loaded.settlementVersion, original.settlementVersion);
    assert.equal(loaded.settlementId, original.settlementId);
    assert.equal(loaded.workshopX, original.workshopX);
    assert.equal(loaded.workshopY, original.workshopY);
    assert.equal(loaded.ciMode, false);
    for (const a of loaded.agents) {
      assert.equal(a.stuckTicks ?? 0, original.agents.find((o) => o.id === a.id)?.stuckTicks ?? 0);
    }

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

  it("100 дней CI-режим, seed=2026 — демография и стабильность", () => {
    const { report } = runModulation(100, 2026, undefined, { ciMode: true });
    assert.equal(
      report.stable,
      true,
      `CI 100d: ${report.issues.join("; ")} | alive=${report.finalAlive} births=${report.births} dead=${report.dead}`,
    );
    assert.ok(report.births >= 1, "ожидалось хотя бы одно рождение в CI-режиме");
  });

  it("720 дней, seed=2026 — рождения и долгий баланс", () => {
    const { report } = runModulation(720, 2026, undefined, { thresholds: LONG_THRESHOLDS });
    assert.equal(
      report.stable,
      true,
      `720d: ${report.issues.join("; ")} | alive=${report.finalAlive} births=${report.births} dead=${report.dead}`,
    );
    assert.ok(report.births >= 1, "ожидалось хотя бы одно рождение за ~1 год симуляции");
  });

  it("1440 дней, seed=2026 — два года, эпидемии и демография", () => {
    const { report } = runModulation(1440, 2026, undefined, { thresholds: EXTRA_LONG_THRESHOLDS });
    assert.equal(
      report.stable,
      true,
      `1440d: ${report.issues.join("; ")} | alive=${report.finalAlive} births=${report.births} dead=${report.dead}`,
    );
    assert.ok(report.births >= 2, "ожидалось ≥2 рождений за ~2 года симуляции");
  });

  it("2160 дней, seed=2026 — три года, карантин и лекари", () => {
    const { report } = runModulation(2160, 2026, undefined, { thresholds: ULTRA_LONG_THRESHOLDS });
    assert.equal(
      report.stable,
      true,
      `2160d: ${report.issues.join("; ")} | alive=${report.finalAlive} births=${report.births} dead=${report.dead}`,
    );
    assert.ok(report.births >= 3, "ожидалось ≥3 рождений за ~3 года симуляции");
  });

  it("2880 дней, seed=2026 — четыре года, караваны и миграция", () => {
    const { report } = runModulation(2880, 2026, undefined, { thresholds: MEGA_LONG_THRESHOLDS });
    assert.equal(
      report.stable,
      true,
      `2880d: ${report.issues.join("; ")} | alive=${report.finalAlive} births=${report.births} dead=${report.dead}`,
    );
    assert.ok(report.births >= 4, "ожидалось ≥4 рождений за ~4 года симуляции");
  });

  it("3600 дней, seed=2026 — пять лет, изоляция хижин и демография", () => {
    const { report } = runModulation(3600, 2026, undefined, { thresholds: SUPER_LONG_THRESHOLDS });
    assert.equal(
      report.stable,
      true,
      `3600d: ${report.issues.join("; ")} | alive=${report.finalAlive} births=${report.births} dead=${report.dead}`,
    );
    assert.ok(report.births >= 5, "ожидалось ≥5 рождений за ~5 лет симуляции");
  });

  it("4320 дней, seed=2026 — шесть лет, сглаженные маршруты и демография", () => {
    const { report } = runModulation(4320, 2026, undefined, { thresholds: HYPER_LONG_THRESHOLDS });
    assert.equal(
      report.stable,
      true,
      `4320d: ${report.issues.join("; ")} | alive=${report.finalAlive} births=${report.births} dead=${report.dead}`,
    );
    assert.ok(report.births >= 6, "ожидалось ≥6 рождений за ~6 лет симуляции");
  });

  it("5040 дней, seed=2026 — семь лет, больная изба и демография", () => {
    const { report } = runModulation(5040, 2026, undefined, { thresholds: OMEGA_LONG_THRESHOLDS });
    assert.equal(
      report.stable,
      true,
      `5040d: ${report.issues.join("; ")} | alive=${report.finalAlive} births=${report.births} dead=${report.dead}`,
    );
    assert.ok(report.births >= 7, "ожидалось ≥7 рождений за ~7 лет симуляции");
  });

  it("5760 дней, seed=2026 — восемь лет, семейный карантин и демография", () => {
    const { report } = runModulation(5760, 2026, undefined, { thresholds: GIGA_LONG_THRESHOLDS });
    assert.equal(
      report.stable,
      true,
      `5760d: ${report.issues.join("; ")} | alive=${report.finalAlive} births=${report.births} dead=${report.dead}`,
    );
    assert.ok(report.births >= 8, "ожидалось ≥8 рождений за ~8 лет симуляции");
  });

  it("6480 дней, seed=2026 — девять лет, вторая больная изба и демография", () => {
    const { report } = runModulation(6480, 2026, undefined, { thresholds: TERA_LONG_THRESHOLDS });
    assert.equal(
      report.stable,
      true,
      `6480d: ${report.issues.join("; ")} | alive=${report.finalAlive} births=${report.births} dead=${report.dead}`,
    );
    assert.ok(report.births >= 9, "ожидалось ≥9 рождений за ~9 лет симуляции");
  });

  it("7200 дней, seed=2026 — десять лет, динамическая вторая изба и демография", () => {
    const { report } = runModulation(7200, 2026, undefined, { thresholds: PETA_LONG_THRESHOLDS });
    assert.equal(
      report.stable,
      true,
      `7200d: ${report.issues.join("; ")} | alive=${report.finalAlive} births=${report.births} dead=${report.dead}`,
    );
    assert.ok(report.births >= 10, "ожидалось ≥10 рождений за ~10 лет симуляции");
  });

  it("7920 дней, seed=2026 — одиннадцать лет, долгий цикл эпидемий и демография", () => {
    const { report } = runModulation(7920, 2026, undefined, { thresholds: EXA_LONG_THRESHOLDS });
    assert.equal(
      report.stable,
      true,
      `7920d: ${report.issues.join("; ")} | alive=${report.finalAlive} births=${report.births} dead=${report.dead}`,
    );
    assert.ok(report.births >= 11, "ожидалось ≥11 рождений за ~11 лет симуляции");
  });

  it("8640 дней, seed=2026 — двенадцать лет, миграция и демография", () => {
    const { report } = runModulation(8640, 2026, undefined, { thresholds: ZETTA_LONG_THRESHOLDS });
    assert.equal(
      report.stable,
      true,
      `8640d: ${report.issues.join("; ")} | alive=${report.finalAlive} births=${report.births} dead=${report.dead}`,
    );
    assert.ok(report.births >= 12, "ожидалось ≥12 рождений за ~12 лет симуляции");
  });

  it("9360 дней, seed=2026 — тринадцать лет, эпидемии и демография", () => {
    const { report } = runModulation(9360, 2026, undefined, { thresholds: YOTTA_LONG_THRESHOLDS });
    assert.equal(
      report.stable,
      true,
      `9360d: ${report.issues.join("; ")} | alive=${report.finalAlive} births=${report.births} dead=${report.dead}`,
    );
    assert.ok(report.births >= 13, "ожидалось ≥13 рождений за ~13 лет симуляции");
  });

  it("10080 дней, seed=2026 — четырнадцать лет, миграция и демография", () => {
    const { report } = runModulation(10080, 2026, undefined, { thresholds: ROMA_LONG_THRESHOLDS });
    assert.equal(
      report.stable,
      true,
      `10080d: ${report.issues.join("; ")} | alive=${report.finalAlive} births=${report.births} dead=${report.dead}`,
    );
    assert.ok(report.births >= 14, "ожидалось ≥14 рождений за ~14 лет симуляции");
  });

  it("10800 дней, seed=2026 — пятнадцать лет, исход семей и демография", () => {
    const { report } = runModulation(10800, 2026, undefined, { thresholds: NOVA_LONG_THRESHOLDS });
    assert.equal(
      report.stable,
      true,
      `10800d: ${report.issues.join("; ")} | alive=${report.finalAlive} births=${report.births} dead=${report.dead}`,
    );
    assert.ok(report.births >= 15, "ожидалось ≥15 рождений за ~15 лет симуляции");
  });

  it("11520 дней, seed=2026 — шестнадцать лет, демографический цикл", () => {
    const { report } = runModulation(11520, 2026, undefined, { thresholds: LUNA_LONG_THRESHOLDS });
    assert.equal(
      report.stable,
      true,
      `11520d: ${report.issues.join("; ")} | alive=${report.finalAlive} births=${report.births} dead=${report.dead}`,
    );
    assert.ok(report.births >= 16, "ожидалось ≥16 рождений за ~16 лет симуляции");
  });

  it("12240 дней, seed=2026 — семнадцать лет, цикл запасов амбара", () => {
    const { report } = runModulation(12240, 2026, undefined, { thresholds: SOL_LONG_THRESHOLDS });
    assert.equal(
      report.stable,
      true,
      `12240d: ${report.issues.join("; ")} | alive=${report.finalAlive} births=${report.births} dead=${report.dead}`,
    );
    assert.ok(report.births >= 16, "ожидалось ≥16 рождений за ~17 лет симуляции");
  });

  it("12960 дней, seed=2026 — восемнадцать лет, долгий демографический цикл", () => {
    const { report } = runModulation(12960, 2026, undefined, { thresholds: SOLA_LONG_THRESHOLDS });
    assert.equal(
      report.stable,
      true,
      `12960d: ${report.issues.join("; ")} | alive=${report.finalAlive} births=${report.births} dead=${report.dead}`,
    );
    assert.ok(report.births >= 17, "ожидалось ≥17 рождений за ~18 лет симуляции");
  });

  it("13680 дней, seed=2026 — девятнадцать лет, долгий цикл маршрутов", () => {
    const { report } = runModulation(13680, 2026, undefined, { thresholds: ASTRA_LONG_THRESHOLDS });
    assert.equal(
      report.stable,
      true,
      `13680d: ${report.issues.join("; ")} | alive=${report.finalAlive} births=${report.births} dead=${report.dead}`,
    );
    assert.ok(report.births >= 18, "ожидалось ≥18 рождений за ~19 лет симуляции");
  });

  it("14400 дней, seed=2026 — двадцать лет, долгий демографический цикл", () => {
    const { report } = runModulation(14400, 2026, undefined, { thresholds: BORA_LONG_THRESHOLDS });
    assert.equal(
      report.stable,
      true,
      `14400d: ${report.issues.join("; ")} | alive=${report.finalAlive} births=${report.births} dead=${report.dead}`,
    );
    assert.ok(report.births >= 19, "ожидалось ≥19 рождений за ~20 лет симуляции");
  });
});
