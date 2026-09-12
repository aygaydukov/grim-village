import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { gravediggerTarget } from "../src/sim/gravedigger.ts";
import { initWorld } from "../src/sim/world.ts";
import { ensureGraveyard } from "../src/sim/burial.ts";

describe("могильщик", () => {
  it("квота 0 без кладбища", () => {
    const world = initWorld(undefined, 42);
    assert.equal(gravediggerTarget(world, 10), 0);
  });

  it("квота 1 после появления кладбища", () => {
    const world = initWorld(undefined, 42);
    ensureGraveyard(world);
    assert.equal(gravediggerTarget(world, 10), 1);
  });
});
