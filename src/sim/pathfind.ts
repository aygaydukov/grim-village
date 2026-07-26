import { getTile } from "./map";
import type { World } from "./types";

const SQRT2 = Math.SQRT2;

/** 8 направлений: кардинальные + диагонали */
const NEIGHBORS = [
  { dx: 0, dy: -1, cost: 1 },
  { dx: 1, dy: 0, cost: 1 },
  { dx: 0, dy: 1, cost: 1 },
  { dx: -1, dy: 0, cost: 1 },
  { dx: 1, dy: -1, cost: SQRT2 },
  { dx: 1, dy: 1, cost: SQRT2 },
  { dx: -1, dy: 1, cost: SQRT2 },
  { dx: -1, dy: -1, cost: SQRT2 },
] as const;

interface PathCache {
  targetKey: string;
  /** Центры клеток пути (x+0.5, y+0.5) */
  waypoints: { x: number; y: number }[];
  index: number;
}

const agentPaths = new Map<number, PathCache>();

function targetKey(tx: number, ty: number): string {
  return `${Math.floor(tx)},${Math.floor(ty)}`;
}

function isWalkable(world: World, x: number, y: number): boolean {
  const tile = getTile(world, x, y);
  return !!tile && tile.kind !== "water";
}

/** Ближайшая проходимая клетка к цели (если цель в воде) */
function nearestWalkable(
  world: World,
  gx: number,
  gy: number,
  maxRadius = 6,
): { x: number; y: number } | null {
  if (isWalkable(world, gx, gy)) return { x: gx, y: gy };

  for (let r = 1; r <= maxRadius; r++) {
    let ringBest: { x: number; y: number; d: number } | null = null;
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue;
        const x = gx + dx;
        const y = gy + dy;
        if (!isWalkable(world, x, y)) continue;
        const dist = Math.hypot(dx, dy);
        if (!ringBest || dist < ringBest.d) ringBest = { x, y, d: dist };
      }
    }
    if (ringBest) return { x: ringBest.x, y: ringBest.y };
  }
  return null;
}

function heuristic(ax: number, ay: number, bx: number, by: number): number {
  const dx = Math.abs(ax - bx);
  const dy = Math.abs(ay - by);
  // Octile distance — точнее для 8-связности
  return dx + dy + (SQRT2 - 2) * Math.min(dx, dy);
}

/**
 * A* по сетке карты. Возвращает центры клеток пути (без стартовой).
 * null — путь не найден.
 */
export function findPath(
  world: World,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
): { x: number; y: number }[] | null {
  const sx = Math.floor(fromX);
  const sy = Math.floor(fromY);
  let ex = Math.floor(toX);
  let ey = Math.floor(toY);

  const goal = nearestWalkable(world, ex, ey);
  if (!goal) return null;
  ex = goal.x;
  ey = goal.y;

  if (sx === ex && sy === ey) return [];

  if (!isWalkable(world, sx, sy)) {
    const start = nearestWalkable(world, sx, sy, 4);
    if (!start) return null;
    return findPath(world, start.x + 0.5, start.y + 0.5, toX, toY);
  }

  const w = world.width;
  const h = world.height;
  const startIdx = sy * w + sx;
  const goalIdx = ey * w + ex;

  const gScore = new Float32Array(w * h);
  gScore.fill(Infinity);
  gScore[startIdx] = 0;

  const cameFrom = new Int32Array(w * h);
  cameFrom.fill(-1);

  const fScore = new Float32Array(w * h);
  fScore.fill(Infinity);
  fScore[startIdx] = heuristic(sx, sy, ex, ey);

  const open: number[] = [startIdx];
  const inOpen = new Set<number>([startIdx]);
  const closed = new Set<number>();

  while (open.length > 0) {
    // Минимальный fScore в open (для 64×48 достаточно линейного поиска)
    let bestI = 0;
    let bestF = fScore[open[0]!]!;
    for (let i = 1; i < open.length; i++) {
      const idx = open[i]!;
      const f = fScore[idx]!;
      if (f < bestF) {
        bestF = f;
        bestI = i;
      }
    }
    const current = open[bestI]!;
    open.splice(bestI, 1);
    inOpen.delete(current);

    if (current === goalIdx) {
      const path: { x: number; y: number }[] = [];
      let cur = current;
      while (cameFrom[cur] !== -1) {
        const cx = cur % w;
        const cy = Math.floor(cur / w);
        path.push({ x: cx + 0.5, y: cy + 0.5 });
        cur = cameFrom[cur]!;
      }
      path.reverse();
      return path;
    }

    closed.add(current);
    const cx = current % w;
    const cy = Math.floor(current / w);

    for (const { dx, dy, cost } of NEIGHBORS) {
      const nx = cx + dx;
      const ny = cy + dy;
      if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
      if (!isWalkable(world, nx, ny)) continue;

      // Диагональ — обе соседние клетки должны быть проходимы
      if (dx !== 0 && dy !== 0) {
        if (!isWalkable(world, cx + dx, cy) || !isWalkable(world, cx, cy + dy)) continue;
      }

      const neighbor = ny * w + nx;
      if (closed.has(neighbor)) continue;

      const tentative = gScore[current]! + cost;
      if (tentative >= gScore[neighbor]!) continue;

      cameFrom[neighbor] = current;
      gScore[neighbor] = tentative;
      fScore[neighbor] = tentative + heuristic(nx, ny, ex, ey);

      if (!inOpen.has(neighbor)) {
        open.push(neighbor);
        inOpen.add(neighbor);
      }
    }
  }

  return null;
}

export function clearAgentPath(agentId: number): void {
  agentPaths.delete(agentId);
}

function getOrComputePath(
  world: World,
  agentId: number,
  fromX: number,
  fromY: number,
  tx: number,
  ty: number,
): PathCache | null {
  const key = targetKey(tx, ty);
  const cached = agentPaths.get(agentId);
  if (cached && cached.targetKey === key) return cached;

  const waypoints = findPath(world, fromX, fromY, tx, ty);
  if (waypoints === null) return null;

  const entry: PathCache = { targetKey: key, waypoints, index: 0 };
  agentPaths.set(agentId, entry);
  return entry;
}

/** Шаг к цели с обходом воды через A*. Возвращает true при прибытии. */
export function stepAlongPath(
  world: World,
  agentId: number,
  x: number,
  y: number,
  tx: number,
  ty: number,
  speed: number,
): { x: number; y: number; arrived: boolean } {
  const d = Math.hypot(tx - x, ty - y);
  if (d < 0.15) return { x: tx, y: ty, arrived: true };

  const path = getOrComputePath(world, agentId, x, y, tx, ty);
  if (!path || path.waypoints.length === 0) {
    // Прямой шаг
    const step = Math.min(speed, d);
    return {
      x: x + ((tx - x) / d) * step,
      y: y + ((ty - y) / d) * step,
      arrived: false,
    };
  }

  // Продвигаем индекс, если текущий waypoint достигнут
  while (path.index < path.waypoints.length) {
    const wp = path.waypoints[path.index]!;
    if (Math.hypot(wp.x - x, wp.y - y) < 0.2) {
      path.index += 1;
    } else {
      break;
    }
  }

  const goal =
    path.index < path.waypoints.length
      ? path.waypoints[path.index]!
      : { x: tx, y: ty };

  const gdx = goal.x - x;
  const gdy = goal.y - y;
  const gd = Math.hypot(gdx, gdy);
  if (gd < 0.01) return { x, y, arrived: false };

  const step = Math.min(speed, gd);
  const nx = x + (gdx / gd) * step;
  const ny = y + (gdy / gd) * step;

  // Проверка проходимости — если в воду, сбросить кэш и пересчитать
  const tile = getTile(world, Math.floor(nx), Math.floor(ny));
  if (!tile || tile.kind === "water") {
    agentPaths.delete(agentId);
    return { x, y, arrived: false };
  }

  return {
    x: nx,
    y: ny,
    arrived: Math.hypot(tx - nx, ty - ny) < 0.15,
  };
}
