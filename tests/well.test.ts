import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { deserializeWorld, serializeWorld, SAVE_VERSION } from "../src/sim/persist.ts";
import { hasWellTile } from "../src/sim/map.ts";
import { hasWell, countAtWell, wellPos } from "../src/sim/well.ts";
import { initWorld } from "../src/sim/world.ts";

describe("колодец", () => {
  it("появляется при генерации мира у воды", () => {
    const world = initWorld(undefined, 2026);
    assert.ok(hasWell(world), "колодец должен быть на карте");
    assert.ok(hasWellTile(world));
    const wp = wellPos(world);
    assert.ok(wp);
    const tile = world.tiles[world.wellY! * world.width + world.wellX!]!;
    assert.equal(tile.kind, "well");
  });

  it("сохраняется в сейве SAVE_VERSION=18", () => {
    const world = initWorld(undefined, 4242);
    const saved = serializeWorld(world);
    assert.equal(saved.version, SAVE_VERSION);
    assert.ok(saved.wellX != null && saved.wellY != null);

    const loaded = deserializeWorld(saved);
    assert.equal(loaded.wellX, world.wellX);
    assert.equal(loaded.wellY, world.wellY);
    assert.ok(hasWell(loaded));
  });

  it("очередь у колодца не превышает 3", () => {
    const world = initWorld(undefined, 777);
    const wp = wellPos(world)!;
    for (let i = 0; i < 5; i++) {
      world.agents.push({
        id: 900 + i,
        name: "Test",
        surname: "Well",
        sex: "male",
        x: wp.x + (i % 2) * 0.3,
        y: wp.y,
        age: 30,
        hunger: 20,
        energy: 80,
        profession: "gatherer",
        task: "idle",
        state: "idle",
        targetX: null,
        targetY: null,
        mateId: null,
        spouseId: null,
        motherId: null,
        fatherId: null,
        pregnant: 0,
        carriedFood: 0,
        homeX: wp.x,
        homeY: wp.y,
        alive: true,
        deathCause: null,
        deathDay: null,
        burialCarrierId: null,
        cooldown: 0,
        stuckTicks: 0,
      });
    }
    assert.ok(countAtWell(world) >= 3);
  });
});
