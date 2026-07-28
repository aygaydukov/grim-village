import { isChild } from "../sim/agent";
import { TILE_SIZE, type Agent, type World } from "../sim/types";
import type { Camera } from "./camera";
import {
  AGENT_CHILD,
  AGENT_DEAD,
  AGENT_FEMALE,
  AGENT_HUNGRY,
  AGENT_ARTISAN,
  AGENT_MALE,
  AGENT_SLEEP,
  BARN_FILL,
  BUILD_SITE_FILL,
  BUILD_SITE_FRAME,
  BUILD_SITE_PROGRESS,
  CARRY_DOT,
  DUSK_OVERLAY,
  FOOD_DOT,
  NIGHT_OVERLAY,
  SELECT_RING,
  TILE_COLORS,
  TILE_EDGE,
} from "./palette";

export function resizeCanvas(canvas: HTMLCanvasElement): void {
  const parent = canvas.parentElement ?? document.body;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = Math.max(1, parent.clientWidth);
  const h = Math.max(1, parent.clientHeight);
  canvas.width = Math.floor(w * dpr);
  canvas.height = Math.floor(h * dpr);
  // Не задаём width/height через style в px — CSS absolute inset держит размер,
  // иначе canvas мог перекрывать соседние слои при композитинге.
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  const ctx = canvas.getContext("2d");
  if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

export function renderWorld(
  ctx: CanvasRenderingContext2D,
  world: World,
  cam: Camera,
  viewW: number,
  viewH: number,
  selectedId: number | null,
  villageSelected = false,
): void {
  ctx.save();
  ctx.fillStyle = "#0a0908";
  ctx.fillRect(0, 0, viewW, viewH);

  ctx.scale(cam.zoom, cam.zoom);
  ctx.translate(-cam.x, -cam.y);

  const startX = Math.max(0, Math.floor(cam.x / TILE_SIZE) - 1);
  const startY = Math.max(0, Math.floor(cam.y / TILE_SIZE) - 1);
  const endX = Math.min(world.width, Math.ceil((cam.x + viewW / cam.zoom) / TILE_SIZE) + 1);
  const endY = Math.min(world.height, Math.ceil((cam.y + viewH / cam.zoom) / TILE_SIZE) + 1);

  for (let y = startY; y < endY; y++) {
    for (let x = startX; x < endX; x++) {
      const tile = world.tiles[y * world.width + x]!;
      const px = x * TILE_SIZE;
      const py = y * TILE_SIZE;
      ctx.fillStyle = TILE_COLORS[tile.kind];
      ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

      if (tile.kind === "hut") {
        ctx.fillStyle = TILE_EDGE.hut;
        ctx.fillRect(px + 2, py + 3, TILE_SIZE - 4, TILE_SIZE - 5);
        ctx.fillStyle = "#2a2018";
        ctx.fillRect(px + 3, py + 1, TILE_SIZE - 6, 4);
        ctx.fillStyle = "#1a1410";
        ctx.fillRect(px + 6, py + 8, 4, 5);
      } else if (tile.kind === "barn") {
        ctx.fillStyle = TILE_EDGE.barn;
        ctx.fillRect(px + 1, py + 2, TILE_SIZE - 2, TILE_SIZE - 3);
        ctx.fillStyle = "#3a2818";
        ctx.fillRect(px + 2, py + 1, TILE_SIZE - 4, 5);
        const fillH = Math.max(1, Math.floor(((tile.food / tile.maxFood) * (TILE_SIZE - 8))));
        ctx.fillStyle = BARN_FILL;
        ctx.fillRect(px + 3, py + TILE_SIZE - 3 - fillH, TILE_SIZE - 6, fillH);
        ctx.fillStyle = "#1a120c";
        ctx.fillRect(px + 6, py + 8, 4, 5);
        if (world.craftStock > 0) {
          const craftDots = Math.min(4, Math.ceil(world.craftStock / 8));
          ctx.fillStyle = "#7a6890";
          for (let i = 0; i < craftDots; i++) {
            ctx.fillRect(px + TILE_SIZE - 5, py + 3 + i * 3, 2, 2);
          }
        }
      } else if (tile.kind === "forest") {
        ctx.fillStyle = "#141c12";
        ctx.beginPath();
        ctx.moveTo(px + 8, py + 2);
        ctx.lineTo(px + 13, py + 12);
        ctx.lineTo(px + 3, py + 12);
        ctx.closePath();
        ctx.fill();
      } else if (tile.kind === "water") {
        ctx.fillStyle = "rgba(40, 60, 80, 0.25)";
        ctx.fillRect(px, py + ((x + y) % 4), TILE_SIZE, 2);
      }

      if (tile.food > 0 && tile.kind !== "hut" && tile.kind !== "barn") {
        ctx.fillStyle = FOOD_DOT;
        const dots = Math.min(tile.food, 4);
        for (let i = 0; i < dots; i++) {
          ctx.fillRect(px + 3 + i * 3, py + TILE_SIZE - 5, 2, 2);
        }
      }
    }
  }

  // Стройплощадка хижины
  const build = world.buildProject;
  if (build) {
    const px = build.x * TILE_SIZE;
    const py = build.y * TILE_SIZE;
    const progress = build.progress / Math.max(1, build.required);

    ctx.fillStyle = BUILD_SITE_FILL;
    ctx.fillRect(px + 1, py + 1, TILE_SIZE - 2, TILE_SIZE - 2);

    ctx.strokeStyle = BUILD_SITE_FRAME;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 2]);
    ctx.strokeRect(px + 2, py + 2, TILE_SIZE - 4, TILE_SIZE - 4);
    ctx.setLineDash([]);

    const barW = TILE_SIZE - 6;
    const barH = 3;
    const barY = py + TILE_SIZE - 6;
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fillRect(px + 3, barY, barW, barH);
    ctx.fillStyle = BUILD_SITE_PROGRESS;
    ctx.fillRect(px + 3, barY, Math.max(1, barW * progress), barH);
  }

  if (villageSelected) {
    const bx = world.barnX * TILE_SIZE + TILE_SIZE / 2;
    const by = world.barnY * TILE_SIZE + TILE_SIZE / 2;
    ctx.strokeStyle = "rgba(196, 168, 120, 0.85)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(bx, by, TILE_SIZE * 3.2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = "rgba(196, 168, 120, 0.35)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(bx, by, TILE_SIZE * 7.5, 0, Math.PI * 2);
    ctx.stroke();
  }

  for (const agent of world.agents) {
    if (agent.alive) continue;
    drawAgent(ctx, agent, false);
  }
  for (const agent of world.agents) {
    if (!agent.alive) continue;
    drawAgent(ctx, agent, agent.id === selectedId);
  }

  ctx.restore();

  const t = world.stats.timeOfDay;
  if (t < 0.2 || t > 0.8) {
    ctx.fillStyle = NIGHT_OVERLAY;
    ctx.fillRect(0, 0, viewW, viewH);
  } else if (t < 0.28 || t > 0.72) {
    ctx.fillStyle = DUSK_OVERLAY;
    ctx.fillRect(0, 0, viewW, viewH);
  }
}

function drawAgent(ctx: CanvasRenderingContext2D, agent: Agent, selected: boolean): void {
  const px = agent.x * TILE_SIZE;
  const py = agent.y * TILE_SIZE;
  const r = isChild(agent) ? 3.2 : 4.4;

  if (!agent.alive) {
    ctx.fillStyle = AGENT_DEAD;
    ctx.beginPath();
    ctx.ellipse(px, py, r * 1.2, r * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();
    return;
  }

  let color = agent.sex === "male" ? AGENT_MALE : AGENT_FEMALE;
  if (isChild(agent)) color = AGENT_CHILD;
  if (agent.profession === "artisan") color = AGENT_ARTISAN;
  if (agent.state === "sleep") color = AGENT_SLEEP;
  if (agent.hunger > 75) color = AGENT_HUNGRY;

  if (selected) {
    ctx.strokeStyle = SELECT_RING;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(px, py, r + 3, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(px, py, r, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.beginPath();
  ctx.arc(px, py - r * 0.15, r * 0.45, 0, Math.PI * 2);
  ctx.fill();

  if (agent.pregnant > 0) {
    ctx.fillStyle = "#6a4850";
    ctx.beginPath();
    ctx.arc(px + r * 0.35, py + r * 0.2, r * 0.4, 0, Math.PI * 2);
    ctx.fill();
  }

  if (agent.carriedFood > 0) {
    ctx.fillStyle = CARRY_DOT;
    for (let i = 0; i < agent.carriedFood; i++) {
      ctx.fillRect(px + r + 1, py - r + i * 3, 2, 2);
    }
  }
}

export function pickAgentAt(world: World, worldX: number, worldY: number): Agent | null {
  let best: Agent | null = null;
  let bestD = 0.65;
  for (const agent of world.agents) {
    if (!agent.alive) continue;
    const d = Math.hypot(agent.x - worldX, agent.y - worldY);
    if (d < bestD) {
      bestD = d;
      best = agent;
    }
  }
  return best;
}
