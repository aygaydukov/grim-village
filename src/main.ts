import { cameraVelocity, createInput } from "./input/controls";
import {
  clampCamera,
  createCamera,
  moveCamera,
  screenToWorld,
  zoomCamera,
} from "./render/camera";
import { pickAgentAt, renderWorld, resizeCanvas } from "./render/renderer";
import { deserializeWorld } from "./sim/persist";
import { initWorld, stepWorld } from "./sim/world";
import {
  bindHudControls,
  isVillageClick,
  refreshInspectorLive,
  selectionKey,
  type Selection,
  updateHud,
  updateInspector,
} from "./ui/hud";

const canvas = document.getElementById("game") as HTMLCanvasElement;
const ctx = canvas.getContext("2d");
if (!ctx) throw new Error("Canvas 2D недоступен");

const DEFAULT_SEED = 2026;

function createFreshWorld(seed = DEFAULT_SEED) {
  return initWorld({ width: 64, height: 48, initialPopulation: 22 }, seed);
}

let world = createFreshWorld();
const input = createInput(canvas);

let viewW = 0;
let viewH = 0;
let cam = createCamera(800, 600, world.width, world.height);
let paused = false;
let speed = 1;
let selection: Selection = { kind: "village" };
let lastSelKey = "";
let liveAcc = 0;
let acc = 0;
const TICK_MS = 1000 / 30; // = TICKS_PER_REAL_SECOND из sim/time.ts
const LIVE_MS = 250;

async function loadPreferredWorld() {
  try {
    const res = await fetch("/data/current.json", { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      world = deserializeWorld(data);
      cam = createCamera(800, 600, world.width, world.height);
      onResize();
      applySelection({ kind: "village" });
      updateHud(world, paused, speed, selection);
      return "server";
    }
  } catch {
    /* offline / no daemon mirror */
  }
  world = createFreshWorld();
  return "fresh";
}

function applySelection(next: Selection): void {
  selection = next;
  const key = selectionKey(selection);
  if (key !== lastSelKey) {
    lastSelKey = key;
    updateInspector(selection, world);
  } else {
    refreshInspectorLive(selection, world);
  }
}

function selectAgent(id: number): void {
  applySelection({ kind: "agent", id });
}

function selectVillage(): void {
  applySelection({ kind: "village" });
}

function selectChangelog(): void {
  applySelection({ kind: "changelog" });
}

function onResize(): void {
  resizeCanvas(canvas);
  viewW = canvas.clientWidth;
  viewH = canvas.clientHeight;
  clampCamera(cam, viewW, viewH, world.width, world.height);
}

window.addEventListener("resize", onResize);
onResize();
cam = createCamera(viewW, viewH, world.width, world.height);
clampCamera(cam, viewW, viewH, world.width, world.height);

canvas.addEventListener(
  "wheel",
  (e) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    zoomCamera(cam, e.deltaY, e.clientX - rect.left, e.clientY - rect.top);
    clampCamera(cam, viewW, viewH, world.width, world.height);
  },
  { passive: false },
);

canvas.addEventListener("click", (e) => {
  const rect = canvas.getBoundingClientRect();
  const { x, y } = screenToWorld(cam, e.clientX - rect.left, e.clientY - rect.top);
  const agent = pickAgentAt(world, x, y);
  if (agent) {
    applySelection({ kind: "agent", id: agent.id });
  } else if (isVillageClick(world, x, y)) {
    applySelection({ kind: "village" });
  } else {
    applySelection({ kind: "none" });
  }
});

bindHudControls({
  onPause: () => {
    paused = !paused;
  },
  onSpeed: (s) => {
    speed = s;
    paused = false;
  },
  onVillage: selectVillage,
  onChangelog: selectChangelog,
  onSelectAgent: selectAgent,
});

window.addEventListener("keydown", (e) => {
  if (e.code === "Space") {
    e.preventDefault();
    paused = !paused;
  }
  if (e.code === "Digit1") speed = 1;
  if (e.code === "Digit2") speed = 2;
  if (e.code === "Digit4") speed = 4;
  if (e.code === "KeyV") selectVillage();
  if (e.code === "KeyH") selectChangelog();
  if (e.code === "Escape") applySelection({ kind: "none" });
});

let last = performance.now();

function frame(now: number): void {
  const dt = Math.min(100, now - last);
  last = now;

  const { dx, dy } = cameraVelocity(input.keys, 280 * (dt / 1000));
  if (dx !== 0 || dy !== 0) {
    moveCamera(cam, dx, dy);
    clampCamera(cam, viewW, viewH, world.width, world.height);
  }

  if (!paused) {
    acc += dt * speed;
    while (acc >= TICK_MS) {
      stepWorld(world, 1);
      acc -= TICK_MS;
    }
  }

  if (selection.kind === "agent") {
    const agentId = selection.id;
    const still = world.agents.some((a) => a.id === agentId);
    if (!still) applySelection({ kind: "none" });
  }

  liveAcc += dt;
  if (liveAcc >= LIVE_MS) {
    liveAcc = 0;
    if (selection.kind !== "none") refreshInspectorLive(selection, world);
  }

  const selectedId = selection.kind === "agent" ? selection.id : null;
  const villageSelected = selection.kind === "village";

  renderWorld(ctx!, world, cam, viewW, viewH, selectedId, villageSelected);
  updateHud(world, paused, speed, selection);

  requestAnimationFrame(frame);
}

lastSelKey = selectionKey(selection);
updateHud(world, paused, speed, selection);
updateInspector(selection, world);
void loadPreferredWorld().then((src) => {
  console.info(`[grim-village] world source: ${src}`);
  updateHud(world, paused, speed, selection);
  updateInspector(selection, world);
});
requestAnimationFrame(frame);
