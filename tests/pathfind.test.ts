import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { initWorld } from "../src/sim/world.ts";
import { findPath, hasLineOfSight, smoothPath } from "../src/sim/pathfind.ts";

describe("pathfind", () => {
  it("hasLineOfSight блокирует воду", () => {
    const world = initWorld(undefined, 42);
    let waterX = -1;
    let waterY = -1;
    for (let y = 0; y < world.height; y++) {
      for (let x = 0; x < world.width; x++) {
        const tile = world.tiles[y * world.width + x]!;
        if (tile.kind === "water") {
          waterX = x;
          waterY = y;
          break;
        }
      }
      if (waterX >= 0) break;
    }
    assert.ok(waterX >= 0, "на карте должна быть вода");
    assert.equal(hasLineOfSight(world, waterX + 0.5, waterY + 0.5, waterX + 0.5, waterY + 0.5), false);
  });

  it("smoothPath сокращает зигзаги A*", () => {
    const world = initWorld(undefined, 2026);
    const path = findPath(world, 10.5, 10.5, 30.5, 20.5);
    assert.ok(path && path.length > 0, "путь должен существовать");
    const smoothed = smoothPath(world, path);
    assert.ok(smoothed.length <= path.length, "сглаживание не удлиняет путь");
    assert.ok(smoothed.length >= 1);
    const last = smoothed[smoothed.length - 1]!;
    assert.ok(Math.hypot(last.x - 30.5, last.y - 20.5) < 1.5, "конечная точка сохранена");
  });
});
