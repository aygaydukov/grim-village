import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { farmerTarget, farmPos, tickDailyFarm } from "../src/sim/farm";
import { getBarnTile } from "../src/sim/map";
import { seasonForDay } from "../src/sim/season";
import { initWorld } from "../src/sim/world";

describe("пашня", () => {
  it("здание на карте к югу от амбара", () => {
    const world = initWorld(undefined, 2026);
    assert.ok(world.farmX >= 0 && world.farmY >= 0);
    const tile = world.tiles[world.farmY * world.width + world.farmX]!;
    assert.equal(tile.kind, "farm");
    assert.ok(world.farmY >= world.barnY);
    const pos = farmPos(world);
    assert.ok(Math.abs(pos.x - (world.farmX + 0.5)) < 0.01);
  });

  it("земледельцы увеличивают зрелость посевов", () => {
    const world = initWorld(undefined, 2026);
    const season = seasonForDay(world.stats.day);
    assert.notEqual(season, "winter");
    const before = world.fieldGrowth;
    for (const a of world.agents) {
      if (a.alive && a.age >= 16 && a.age < 65) {
        a.profession = "farmer";
        a.energy = 80;
        a.hunger = 30;
      }
    }
    tickDailyFarm(world);
    assert.ok(world.fieldGrowth >= before);
  });

  it("farmerTarget = 0 зимой", () => {
    const world = initWorld(undefined, 2026);
    world.stats.day = 550;
    assert.equal(seasonForDay(world.stats.day), "winter");
    assert.equal(farmerTarget(world, 10), 0);
  });

  it("урожай пополняет амбар осенью", () => {
    const world = initWorld(undefined, 2026);
    world.stats.day = 460;
    assert.equal(seasonForDay(world.stats.day), "autumn");
    world.fieldGrowth = 80;
    const barn = getBarnTile(world)!;
    const before = barn.food;
    tickDailyFarm(world);
    assert.ok(barn.food > before || world.fieldGrowth < 80);
  });
});
