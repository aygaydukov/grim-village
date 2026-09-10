import { foodRegenShockFactor } from "./shocks";
import { seasonFoodFactor } from "./season";
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
  } else if (kind === "workshop") {
    tile.maxFood = 0;
    tile.food = 0;
  } else if (kind === "bakery") {
    tile.maxFood = 0;
    tile.food = 0;
  } else if (kind === "graveyard") {
    tile.maxFood = 0;
    tile.food = 0;
  } else if (kind === "well") {
    tile.maxFood = 0;
    tile.food = 0;
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
  workshop: { x: number; y: number };
  bakery: { x: number; y: number };
  well: { x: number; y: number } | null;
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

  // Мастерская к востоку от амбара — ремесленники привязаны к зданию, не к складу
  const workshop = { x: cx + 2, y: cy + 1 };
  {
    const t = tiles[workshop.y * width + workshop.x]!;
    t.kind = "workshop";
    t.food = 0;
    t.maxFood = 0;
    carvePath(tiles, width, workshop.x, workshop.y, barn.x, barn.y);
    for (const [ax, ay] of [
      [0, 1],
      [1, 0],
      [-1, 0],
      [0, -1],
    ]) {
      const nx = workshop.x + ax!;
      const ny = workshop.y + ay!;
      const n = tiles[ny * width + nx];
      if (n && n.kind !== "water" && n.kind !== "hut" && n.kind !== "barn" && n.kind !== "workshop" && n.kind !== "bakery") {
        n.kind = "dirt";
        n.food = 0;
        n.maxFood = 0;
      }
    }
  }

  // Пекарня к западу от амбара — сушка излишков амбара
  const bakery = { x: cx - 2, y: cy + 1 };
  {
    const t = tiles[bakery.y * width + bakery.x]!;
    t.kind = "bakery";
    t.food = 0;
    t.maxFood = 0;
    carvePath(tiles, width, bakery.x, bakery.y, barn.x, barn.y);
    for (const [ax, ay] of [
      [0, 1],
      [1, 0],
      [-1, 0],
      [0, -1],
    ]) {
      const nx = bakery.x + ax!;
      const ny = bakery.y + ay!;
      const n = tiles[ny * width + nx];
      if (
        n &&
        n.kind !== "water" &&
        n.kind !== "hut" &&
        n.kind !== "barn" &&
        n.kind !== "workshop" &&
        n.kind !== "bakery"
      ) {
        n.kind = "dirt";
        n.food = 0;
        n.maxFood = 0;
      }
    }
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
    carvePath(tiles, width, x, y, barn.x, barn.y);
    for (const [ax, ay] of [
      [0, 1],
      [1, 0],
      [-1, 0],
      [0, -1],
    ]) {
      const nx = x + ax!;
      const ny = y + ay!;
      const n = tiles[ny * width + nx];
      if (n && n.kind !== "water" && n.kind !== "hut" && n.kind !== "barn" && n.kind !== "workshop" && n.kind !== "bakery") {
        n.kind = "dirt";
        n.food = 0;
        n.maxFood = 0;
      }
    }
  }

  const well = findWellSite(tiles, width, height, barn.x, barn.y, rng);
  if (well) {
    placeWellOnTiles(tiles, width, well.x, well.y, barn.x, barn.y);
  }

  return { tiles, hutSpots, barn, workshop, bakery, well };
}

/** Найти место для колодца — соседняя с водой клетка, ближе всего к амбару */
function findWellSite(
  tiles: Tile[],
  width: number,
  height: number,
  barnX: number,
  barnY: number,
  rng: () => number,
): { x: number; y: number } | null {
  const candidates: { x: number; y: number; d: number }[] = [];

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const tile = tiles[y * width + x]!;
      if (tile.kind === "water" || tile.kind === "barn" || tile.kind === "hut") continue;

      let touchesWater = false;
      for (const [dx, dy] of [
        [0, 1],
        [1, 0],
        [-1, 0],
        [0, -1],
      ]) {
        const n = tiles[(y + dy!) * width + (x + dx!)]!;
        if (n.kind === "water") {
          touchesWater = true;
          break;
        }
      }
      if (!touchesWater) continue;

      const d = Math.hypot(x - barnX, y - barnY);
      if (d > 22) continue;
      candidates.push({ x, y, d });
    }
  }

  if (candidates.length === 0) return null;
  candidates.sort((a, b) => a.d - b.d);
  const bestDist = candidates[0]!.d;
  const near = candidates.filter((c) => c.d <= bestDist + 2);
  return near[Math.floor(rng() * near.length)]!;
}

function placeWellOnTiles(
  tiles: Tile[],
  width: number,
  x: number,
  y: number,
  barnX: number,
  barnY: number,
): void {
  const tile = tiles[y * width + x]!;
  tile.kind = "well";
  tile.food = 0;
  tile.maxFood = 0;
  carvePath(tiles, width, x, y, barnX, barnY);

  for (const [ax, ay] of [
    [0, 1],
    [1, 0],
    [-1, 0],
    [0, -1],
  ]) {
    const nx = x + ax!;
    const ny = y + ay!;
    const n = tiles[ny * width + nx];
    if (
      n &&
      n.kind !== "water" &&
      n.kind !== "hut" &&
      n.kind !== "barn" &&
      n.kind !== "workshop" &&
      n.kind !== "bakery" &&
      n.kind !== "graveyard" &&
      n.kind !== "well"
    ) {
      n.kind = "dirt";
      n.food = 0;
      n.maxFood = 0;
    }
  }
}

/** Поставить кладбище и протянуть тропу к амбару */
export function placeGraveyard(world: World, x: number, y: number): void {
  const tile = getTile(world, x, y);
  if (
    !tile ||
    tile.kind === "water" ||
    tile.kind === "barn" ||
    tile.kind === "hut" ||
    tile.kind === "workshop" ||
    tile.kind === "bakery" ||
    tile.kind === "well"
  ) {
    return;
  }

  tile.kind = "graveyard";
  tile.food = 0;
  tile.maxFood = 0;
  // Тропа к амбару не нужна — похороны редки, а carvePath съедает лес у сборщиков

  for (const [ax, ay] of [
    [0, 1],
    [1, 0],
    [-1, 0],
    [0, -1],
  ]) {
    const nx = x + ax!;
    const ny = y + ay!;
    const n = getTile(world, nx, ny);
    if (
      n &&
      n.kind !== "water" &&
      n.kind !== "hut" &&
      n.kind !== "barn" &&
      n.kind !== "workshop" &&
      n.kind !== "bakery" &&
      n.kind !== "graveyard" &&
      n.kind !== "well"
    ) {
      n.kind = "dirt";
      n.food = 0;
      n.maxFood = 0;
    }
  }
}

/** Поставить хижину и протянуть тропу к амбару */
export function placeHut(world: World, x: number, y: number): void {
  const tile = getTile(world, x, y);
  if (
    !tile ||
    tile.kind === "water" ||
    tile.kind === "barn" ||
    tile.kind === "hut" ||
    tile.kind === "workshop" ||
    tile.kind === "bakery" ||
    tile.kind === "graveyard" ||
    tile.kind === "well"
  )
    return;

  tile.kind = "hut";
  tile.food = 0;
  tile.maxFood = 0;
  carvePath(world.tiles, world.width, x, y, world.barnX, world.barnY);

  for (const [ax, ay] of [
    [0, 1],
    [1, 0],
    [-1, 0],
    [0, -1],
  ]) {
    const nx = x + ax!;
    const ny = y + ay!;
    const n = getTile(world, nx, ny);
    if (n && n.kind !== "water" && n.kind !== "hut" && n.kind !== "barn" && n.kind !== "workshop" && n.kind !== "bakery") {
      n.kind = "dirt";
      n.food = 0;
      n.maxFood = 0;
    }
  }
}

/** Грязная тропа от хижины к амбару — чтобы не тонуть в воде по дороге за едой */
function carvePath(
  tiles: Tile[],
  width: number,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
): void {
  let x = x0;
  let y = y0;
  const dx = Math.sign(x1 - x0);
  const dy = Math.sign(y1 - y0);

  while (x !== x1 || y !== y1) {
    const tile = tiles[y * width + x];
    if (tile && tile.kind !== "hut" && tile.kind !== "barn" && tile.kind !== "workshop" && tile.kind !== "bakery" && tile.kind !== "graveyard" && tile.kind !== "well") {
      tile.kind = "dirt";
      tile.food = 0;
      tile.maxFood = 0;
    }
    if (x !== x1) x += dx;
    else if (y !== y1) y += dy;
  }
}

export function regenerateFood(world: World): void {
  for (const tile of world.tiles) {
    if (tile.kind === "barn") continue;
    if (tile.maxFood <= 0) continue;
    if (tile.food >= tile.maxFood) continue;
    const dayFactor = world.stats.timeOfDay > 0.25 && world.stats.timeOfDay < 0.75 ? 1 : 0.12;
    // Лес кормит лучше травы; сезон — мягкий множитель (см. season.ts)
    const kindFactor = tile.kind === "forest" ? 1.35 : 1;
    const seasonFactor = seasonFoodFactor(world.stats.day);
    const shockFactor = foodRegenShockFactor(world);
    if (world.rng() < 0.0055 * dayFactor * kindFactor * seasonFactor * shockFactor) {
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
      if (tile.kind === "barn" || tile.kind === "hut" || tile.kind === "workshop" || tile.kind === "bakery" || tile.kind === "graveyard" || tile.kind === "well") continue;
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

export function workshopPos(world: World): { x: number; y: number } {
  return { x: world.workshopX + 0.5, y: world.workshopY + 0.5 };
}

export function bakeryPosFromWorld(world: World): { x: number; y: number } {
  return { x: world.bakeryX + 0.5, y: world.bakeryY + 0.5 };
}

export function wellPosFromWorld(world: World): { x: number; y: number } | null {
  if (world.wellX == null || world.wellY == null) return null;
  return { x: world.wellX + 0.5, y: world.wellY + 0.5 };
}

export function hasWellTile(world: World): boolean {
  return world.wellX != null && world.wellY != null;
}

/** Поставить колодец для старых сейвов без него */
export function ensureWell(world: World): void {
  if (hasWellTile(world)) {
    for (let y = 0; y < world.height; y++) {
      for (let x = 0; x < world.width; x++) {
        if (world.tiles[y * world.width + x]!.kind === "well") {
          world.wellX = x;
          world.wellY = y;
          return;
        }
      }
    }
  }

  const site = findWellSite(world.tiles, world.width, world.height, world.barnX, world.barnY, world.rng);
  if (!site) {
    world.wellX = null;
    world.wellY = null;
    return;
  }

  placeWellOnTiles(world.tiles, world.width, site.x, site.y, world.barnX, world.barnY);
  world.wellX = site.x;
  world.wellY = site.y;
}

export function ensureWorkshop(world: World): void {
  for (let y = 0; y < world.height; y++) {
    for (let x = 0; x < world.width; x++) {
      if (world.tiles[y * world.width + x]!.kind === "workshop") {
        world.workshopX = x;
        world.workshopY = y;
        return;
      }
    }
  }

  const offsets = [
    [2, 1],
    [2, 0],
    [1, 2],
    [-2, 1],
    [0, 2],
  ];
  for (const [ox, oy] of offsets) {
    const x = world.barnX + ox!;
    const y = world.barnY + oy!;
    const tile = getTile(world, x, y);
    if (!tile || tile.kind === "water" || tile.kind === "barn" || tile.kind === "hut") continue;
    setTileKind(world, x, y, "workshop");
    world.workshopX = x;
    world.workshopY = y;
    carvePath(world.tiles, world.width, x, y, world.barnX, world.barnY);
    return;
  }

  world.workshopX = world.barnX + 1;
  world.workshopY = world.barnY;
  setTileKind(world, world.workshopX, world.workshopY, "workshop");
}

export function ensureBakery(world: World): void {
  for (let y = 0; y < world.height; y++) {
    for (let x = 0; x < world.width; x++) {
      if (world.tiles[y * world.width + x]!.kind === "bakery") {
        world.bakeryX = x;
        world.bakeryY = y;
        return;
      }
    }
  }

  const offsets = [
    [-2, 1],
    [-2, 0],
    [-1, 2],
    [0, -2],
    [-3, 1],
  ];
  for (const [ox, oy] of offsets) {
    const x = world.barnX + ox!;
    const y = world.barnY + oy!;
    const tile = getTile(world, x, y);
    if (!tile || tile.kind === "water" || tile.kind === "barn" || tile.kind === "hut") continue;
    setTileKind(world, x, y, "bakery");
    world.bakeryX = x;
    world.bakeryY = y;
    carvePath(world.tiles, world.width, x, y, world.barnX, world.barnY);
    return;
  }

  world.bakeryX = world.barnX - 1;
  world.bakeryY = world.barnY;
  setTileKind(world, world.bakeryX, world.bakeryY, "bakery");
}
