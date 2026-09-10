import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { bakeryPos, bakerTarget, tickDailyBakery } from "../src/sim/bakery";
import { getBarnTile } from "../src/sim/map";
import { initWorld } from "../src/sim/world";

describe("пекарня", () => {
  it("здание на карте у амбара", () => {
    const world = initWorld(undefined, 2026);
    assert.ok(world.bakeryX >= 0 && world.bakeryY >= 0);
    const tile = world.tiles[world.bakeryY * world.width + world.bakeryX]!;
    assert.equal(tile.kind, "bakery");
    const pos = bakeryPos(world);
    assert.ok(Math.abs(pos.x - (world.bakeryX + 0.5)) < 0.01);
  });

  it("сушит излишки при полном амбаре", () => {
    const world = initWorld(undefined, 2026);
    const barn = getBarnTile(world)!;
    barn.food = 120;
    for (const a of world.agents) {
      if (a.alive && a.age >= 16 && a.age < 65) {
        a.profession = "baker";
        a.energy = 80;
        a.hunger = 30;
      }
    }
    tickDailyBakery(world);
    assert.ok(world.driedStock > 0 || barn.food < 120);
  });

  it("bakerTarget = 0 при низком амбаре", () => {
    const world = initWorld(undefined, 2026);
    const barn = getBarnTile(world)!;
    barn.food = 40;
    assert.equal(bakerTarget(world, 10), 0);
  });
});
