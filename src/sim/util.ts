/** Mulberry32 — простой детерминированный PRNG с сохраняемым состоянием */
export interface Rng {
  (): number;
  readonly state: number;
}

export function createRng(seed: number, state?: number): Rng {
  let t = (state ?? seed) >>> 0;
  const rng = (() => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  }) as Rng;
  Object.defineProperty(rng, "state", { get: () => t >>> 0 });
  return rng;
}

export function pick<T>(rng: () => number, items: readonly T[]): T {
  return items[Math.floor(rng() * items.length)]!;
}

export function chance(rng: () => number, p: number): boolean {
  return rng() < p;
}

export function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

export function dist(ax: number, ay: number, bx: number, by: number): number {
  const dx = ax - bx;
  const dy = ay - by;
  return Math.hypot(dx, dy);
}
