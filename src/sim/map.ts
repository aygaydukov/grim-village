import type { Tile, TileKind, World } from "./types";
import { chance, createRng } from "./util";

function idx(world: Pick<World, "width">, x: number, y: number): number {
  return y * world.width + x;
}

export function getTile(world: World, x: number, y: number): Tile | null {
  if (x < 0 || y < 0 || x >= world.width || y >= world.height) return null;
  return world.tiles[idx(world, x, y)]!;
}

export function setTileKind(world: World, x: number, y: number, kind: TileKind): void {
  const tile = getTile(world, x, y);
  if (!tile) return;
  tile.kind = kind;
  if (kind === "forest") {
    tile.maxFood = 8;
    tile.food = 4 + Math.floor(world.rng() * 5);
  } else if (kind === "grass") {
    tile.maxFood = 2;
    tile.food = world.rng() < 0.15 ? 1 : 0;
  } else if (kind === "barn") {
    tile.maxFood = 220;
    tile.food = Math.min(tile.food, tile.maxFood);
  } else {
    tile.maxFood = 0;
    tile.food = 0;
  }
}

function noise2(x: number, y: number, seed: number): number {
  const n = Math.sin(x * 12.9898 + y * 78.233 + seed * 43.758) * 43758.5453;
  return n - Math.floor(n);
}

export function generateMap(
  width: number,
  height: number,
  seed: number,
): {
  tiles: Tile[];
  hutSpots: { x: number; y: number }[];
  barn: { x: number; y: number };
} {
  const rng = createRng(seed);
  const tiles: Tile[] = [];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const n = noise2(x * 0.08, y * 0.08, seed);
      const n2 = noise2(x * 0.2, y * 0.2, seed + 99);
      let kind: TileKind = "grass";

      if (n < 0.22) kind = "water";
      else if (n > 0.72 || n2 > 0.85) kind = "forest";
      else if (n2 < 0.18) kind = "dirt";

      const maxFood = kind === "forest" ? 8 : kind === "grass" ? 2 : 0;
      const food =
        kind === "forest"
          ? 3 + Math.floor(rng() * 6)
          : kind === "grass" && chance(rng, 0.18)
            ? 1
            : 0;

      tiles.push({ kind, food, maxFood });
    }
  }

  const cx = Math.floor(width / 2);
  const cy = Math.floor(height / 2);
  const hutSpots: { x: number; y: number }[] = [];

  for (let dy = -6; dy <= 6; dy++) {
    for (let dx = -8; dx <= 8; dx++) {
      const x = cx + dx;
      const y = cy + dy;
      if (x < 1 || y < 1 || x >= width - 1 || y >= height - 1) continue;
      const t = tiles[y * width + x]!;
      if (t.kind === "water") continue;
      const d = Math.hypot(dx, dy);
      if (d < 7) {
        t.kind = "dirt";
        t.food = 0;
        t.maxFood = 0;
      }
    }
  }

  // Амбар в центре площади
  const barn = { x: cx, y: cy };
  {
    const t = tiles[barn.y * width + barn.x]!;
    t.kind = "barn";
    t.maxFood = 220;
    t.food = 55;
  }

  const hutOffsets = [
    [-4, -3],
    [-1, -4],
    [3, -3],
    [-5, 1],
    [4, 1],
    [-3, 4],
    [2, 4],
    [5, -1],
    [-6, -1],
  ];

  for (const [ox, oy] of hutOffsets) {
    const x = cx + ox!;
    const y = cy + oy!;
    const t = tiles[y * width + x];
    if (!t || t.kind === "water" || t.kind === "barn") continue;
    t.kind = "hut";
    t.food = 0;
    t.maxFood = 0;
    hutSpots.push({ x, y });
    for (const [ax, ay] of [
      [0, 1],
      [1, 0],
      [-1, 0],
      [0, -1],
    ]) {
      const nx = x + ax!;
      const ny = y + ay!;
      const n = tiles[ny * width + nx];
      if (n && n.kind !== "water" && n.kind !== "hut" && n.kind !== "barn") {
        n.kind = "dirt";
        n.food = 0;
        n.maxFood = 0;
      }
    }
  }

  return { tiles, hutSpots, barn };
}

export function regenerateFood(world: World): void {
  for (const tile of world.tiles) {
    if (tile.kind === "barn") continue;
    if (tile.maxFood <= 0) continue;
    if (tile.food >= tile.maxFood) continue;
    const dayFactor = world.stats.timeOfDay > 0.25 && world.stats.timeOfDay < 0.75 ? 1 : 0.12;
    // Лес кормит лучше травы
    const kindFactor = tile.kind === "forest" ? 1.35 : 1;
    if (world.rng() < 0.0055 * dayFactor * kindFactor) {
      tile.food = Math.min(tile.maxFood, tile.food + 1);
    }
  }
}

/** Дикая еда (не амбар) */
export function findNearestWildFood(
  world: World,
  fromX: number,
  fromY: number,
  maxDist: number,
): { x: number; y: number } | null {
  let best: { x: number; y: number; d: number } | null = null;
  const r = Math.ceil(maxDist);
  const fx = Math.floor(fromX);
  const fy = Math.floor(fromY);

  for (let y = fy - r; y <= fy + r; y++) {
    for (let x = fx - r; x <= fx + r; x++) {
      const tile = getTile(world, x, y);
      if (!tile || tile.food <= 0) continue;
      if (tile.kind === "barn" || tile.kind === "hut") continue;
      const d = Math.hypot(x + 0.5 - fromX, y + 0.5 - fromY);
      if (d > maxDist) continue;
      if (!best || d < best.d) best = { x, y, d };
    }
  }

  return best ? { x: best.x + 0.5, y: best.y + 0.5 } : null;
}

export function getBarnTile(world: World): Tile | null {
  return getTile(world, world.barnX, world.barnY);
}

export function barnStock(world: World): number {
  return getBarnTile(world)?.food ?? 0;
}

export function syncBarnStat(world: World): void {
  world.stats.barnFood = barnStock(world);
}

export function isWalkable(world: World, x: number, y: number): boolean {
  const tile = getTile(world, Math.floor(x), Math.floor(y));
  return !!tile && tile.kind !== "water";
}

export function findNearestHut(
  world: World,
  fromX: number,
  fromY: number,
): { x: number; y: number } | null {
  let best: { x: number; y: number; d: number } | null = null;
  for (let y = 0; y < world.height; y++) {
    for (let x = 0; x < world.width; x++) {
      const tile = world.tiles[y * world.width + x]!;
      if (tile.kind !== "hut") continue;
      const d = Math.hypot(x + 0.5 - fromX, y + 0.5 - fromY);
      if (!best || d < best.d) best = { x: x + 0.5, y: y + 0.5, d };
    }
  }
  return best ? { x: best.x, y: best.y } : null;
}

export function barnPos(world: World): { x: number; y: number } {
  return { x: world.barnX + 0.5, y: world.barnY + 0.5 };
}
