import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { killAgent } from "../src/sim/agent.ts";
import {
  BURIAL_WAIT_DAYS,
  countUnburiedBodies,
  ensureGraveyard,
  hasGraveyard,
  tickDailyBurials,
} from "../src/sim/burial.ts";
import { stepWorld } from "../src/sim/world.ts";
import { initWorld } from "../src/sim/world.ts";

describe("похороны", () => {
  it("кладбище появляется при первой смерти и тело убирается после ожидания", () => {
    const world = initWorld(undefined, 9091);
    const victim = world.agents[0]!;
    const elder = world.agents.find((a) => a.alive && a.id !== victim.id)!;
    elder.age = 66;
    elder.profession = "elder";
    killAgent(world, victim, "тест");
    assert.equal(countUnburiedBodies(world), 1);
    ensureGraveyard(world);
    assert.equal(hasGraveyard(world), true);

    world.stats.day += BURIAL_WAIT_DAYS;
    tickDailyBurials(world);

    const carrierId = world.activeBurialCarrierId;
    assert.ok(carrierId != null, "должен назначиться носильщик");

    for (let i = 0; i < world.dayLength * 800; i++) {
      stepWorld(world, 1);
      if (!world.agents.some((a) => a.id === victim.id)) break;
    }

    assert.ok(!world.agents.some((a) => a.id === victim.id), "тело должно быть похоронено");
    assert.ok(world.burialCount >= 1);
  });

  it("могильщик получает приоритет над старцем при похоронах", () => {
    const world = initWorld(undefined, 9092);
    const victim = world.agents[0]!;
    const digger = world.agents.find((a) => a.alive && a.id !== victim.id)!;
    digger.profession = "gravedigger";
    digger.age = 40;
    digger.energy = 90;
    digger.hunger = 20;
    const elder = world.agents.find((a) => a.alive && a.id !== victim.id && a.id !== digger.id)!;
    elder.age = 70;
    elder.profession = "elder";
    elder.energy = 90;
    elder.hunger = 20;

    killAgent(world, victim, "тест");
    ensureGraveyard(world);
    world.stats.day += BURIAL_WAIT_DAYS;
    tickDailyBurials(world);

    assert.equal(world.activeBurialCarrierId, digger.id, "носильщик — могильщик");
  });
});
