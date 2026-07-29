import type { World } from "../src/sim/types.ts";

const KIND_COLOR: Record<string, string> = {
  grass: "#2a3324",
  dirt: "#3a3024",
  forest: "#1a2418",
  water: "#1a2430",
  hut: "#4a3428",
  barn: "#5a4028",
  workshop: "#4a3848",
};

/** Lightweight map snapshot (SVG) for settlement archives — no browser needed. */
export function renderSettlementSvg(world: World, cell = 8): string {
  const w = world.width * cell;
  const h = world.height * cell;
  const tiles: string[] = [];
  for (let y = 0; y < world.height; y++) {
    for (let x = 0; x < world.width; x++) {
      const tile = world.tiles[y * world.width + x]!;
      const fill = KIND_COLOR[tile.kind] ?? "#222";
      tiles.push(
        `<rect x="${x * cell}" y="${y * cell}" width="${cell}" height="${cell}" fill="${fill}"/>`,
      );
    }
  }
  const agents = world.agents
    .filter((a) => a.alive)
    .map((a) => {
      const fill = a.sex === "female" ? "#7a5858" : a.age < 12 ? "#9a8870" : "#8a6a48";
      return `<circle cx="${(a.x + 0.5) * cell}" cy="${(a.y + 0.5) * cell}" r="${cell * 0.28}" fill="${fill}"/>`;
    });

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <title>Settlement day ${world.stats.day} · alive ${world.stats.alive}</title>
  ${tiles.join("\n  ")}
  ${agents.join("\n  ")}
</svg>
`;
}
