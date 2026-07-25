import { buildVillageChronicle, currentSeasonLabel } from "../sim/chronicle";
import { ageLabel, agentNameById, childrenOf } from "../sim/agent";
import {
  agentChronicle,
  collectVillageReport,
  formatClock,
  healthLabel,
  timeOfDayNote,
  timePhase,
  type VillageReport,
} from "../sim/dossier";
import { professionLabel, taskLabel } from "../sim/jobs";
import { fullName, SEX_LABELS, STATE_LABELS } from "../sim/names";
import { seasonNote, seasonForDay } from "../sim/season";
import type { Agent, World } from "../sim/types";

export type Selection =
  | { kind: "none" }
  | { kind: "agent"; id: number }
  | { kind: "village" };

function el<T extends HTMLElement>(id: string): T {
  const node = document.getElementById(id);
  if (!node) throw new Error(`#${id} not found`);
  return node as T;
}

let onSelectAgentCb: ((id: number) => void) | null = null;

export function updateHud(world: World, paused: boolean, speed: number, selection: Selection): void {
  el<HTMLElement>("stat-alive").textContent = String(world.stats.alive);
  el<HTMLElement>("stat-dead").textContent = String(world.stats.dead);
  el<HTMLElement>("stat-day").textContent = String(world.stats.day);
  el<HTMLElement>("stat-barn").textContent = String(world.stats.barnFood);

  const season = seasonForDay(world.stats.day);
  el<HTMLElement>("stat-season").textContent = currentSeasonLabel(world);
  el<HTMLElement>("stat-season-note").textContent = seasonNote(season);

  const phase = timePhase(world);
  const tod = world.stats.timeOfDay;
  const pct = Math.round(tod * 100);
  el<HTMLElement>("stat-time").textContent = phase;
  el<HTMLElement>("stat-clock").textContent = formatClock(tod);
  el<HTMLElement>("stat-tod-note").textContent = timeOfDayNote(world);
  el<HTMLElement>("stat-tod-bar").style.width = `${pct}%`;
  el<HTMLElement>("stat-tod-marker").style.left = `${pct}%`;

  const todBox = el<HTMLElement>("time-of-day");
  todBox.dataset.phase = phase;

  const pauseBtn = el<HTMLButtonElement>("btn-pause");
  pauseBtn.textContent = paused ? "Продолжить" : "Пауза";
  pauseBtn.classList.toggle("active", paused);

  for (const s of [1, 2, 4]) {
    el<HTMLButtonElement>(`btn-speed-${s}`).classList.toggle("active", speed === s && !paused);
  }

  el<HTMLButtonElement>("btn-village").classList.toggle("active", selection.kind === "village");
}

export function resolveSelectedAgent(selection: Selection, world: World): Agent | null {
  if (selection.kind !== "agent") return null;
  return world.agents.find((a) => a.id === selection.id) ?? null;
}

export function selectionKey(selection: Selection): string {
  if (selection.kind === "agent") return `agent:${selection.id}`;
  return selection.kind;
}

/** Полная перерисовка карточки (при смене выбора) */
export function updateInspector(selection: Selection, world: World): void {
  const empty = el<HTMLElement>("inspector-empty");
  const body = el<HTMLElement>("inspector-body");
  const title = el<HTMLElement>("inspector-title");

  if (selection.kind === "none") {
    title.textContent = "Инспектор";
    empty.hidden = false;
    empty.textContent =
      "Кликни по жителю — карточка. По амбару / площади или «Деревня» (V) — сводка поселения.";
    body.hidden = true;
    body.innerHTML = "";
    return;
  }

  empty.hidden = true;
  body.hidden = false;

  if (selection.kind === "village") {
    title.textContent = "Деревня";
    body.innerHTML = renderVillage(collectVillageReport(world), world);
    return;
  }

  const agent = resolveSelectedAgent(selection, world);
  title.textContent = "Житель";
  if (!agent) {
    body.innerHTML = `<p class="muted">Житель исчез из памяти деревни.</p>`;
    return;
  }
  body.innerHTML = renderAgent(agent, world);
}

/** Лёгкое обновление цифр без сброса скролла списка */
export function refreshInspectorLive(selection: Selection, world: World): void {
  if (selection.kind === "none") return;

  if (selection.kind === "agent") {
    const agent = resolveSelectedAgent(selection, world);
    if (!agent) {
      updateInspector(selection, world);
      return;
    }
    const chronicle = elOptional("live-chronicle");
    const health = elOptional("live-health");
    const state = elOptional("live-state");
    const hungerBar = elOptional("live-hunger-bar");
    const energyBar = elOptional("live-energy-bar");
    const hungerLabel = elOptional("live-hunger-label");
    const energyLabel = elOptional("live-energy-label");
    const carry = elOptional("live-carry");
    if (!chronicle || !hungerBar) {
      updateInspector(selection, world);
      return;
    }
    chronicle.textContent = agentChronicle(agent, world);
    if (health) health.textContent = healthLabel(agent.hunger, agent.energy);
    if (state) state.textContent = STATE_LABELS[agent.state] ?? agent.state;
    const prof = elOptional("live-profession");
    const task = elOptional("live-task");
    if (prof) prof.textContent = professionLabel(agent.profession);
    if (task) task.textContent = taskLabel(agent.task);
    const h = Math.round(agent.hunger);
    const e = Math.round(agent.energy);
    if (hungerLabel) hungerLabel.textContent = `Голод ${h}`;
    if (energyLabel) energyLabel.textContent = `Силы ${e}`;
    hungerBar.style.width = `${h}%`;
    if (energyBar) energyBar.style.width = `${e}%`;
    if (carry) {
      carry.hidden = agent.carriedFood <= 0;
      const val = carry.querySelector(".val");
      if (val) val.textContent = `${agent.carriedFood} ед. еды`;
    }
    return;
  }

  // village live
  const r = collectVillageReport(world);
  setText("live-v-chronicle", r.chronicle);
  setText("live-v-outlook", r.outlook);
  setText("live-v-alive", String(r.alive));
  setText("live-v-dead", String(r.dead));
  setText("live-v-births", String(r.births));
  setText("live-v-mw", `${r.men} / ${r.women}`);
  setText("live-v-ages", `${r.children} / ${r.adults} / ${r.elders}`);
  setText("live-v-couples", String(r.couples));
  setText("live-v-preg", String(r.pregnant));
  setText("live-v-activity", `${r.hungry} / ${r.sleeping} / ${r.working}`);
  setText("live-v-gath", String(r.professions.gatherer));
  setText("live-v-lab", String(r.professions.laborer));
  setText("live-v-keep", String(r.professions.keeper));
  setText("live-v-eld", String(r.professions.elder));
  setText("live-v-ch", String(r.professions.child));
  setText("live-v-day", `${r.day} · ${r.phase}`);
  setText("live-v-barn-label", `Амбар ${r.barnFood} / ${r.barnCapacity}`);
  setText("live-v-wild", String(r.wildFood));
  setText("live-v-carry", String(r.carriedFood));
  const barnPct = Math.round((r.barnFood / Math.max(1, r.barnCapacity)) * 100);
  const hungerPct = Math.round(r.avgHunger);
  const energyPct = Math.round(r.avgEnergy);
  setWidth("live-v-barn-bar", barnPct);
  setText("live-v-hunger-label", `Средний голод ${hungerPct}`);
  setText("live-v-energy-label", `Средние силы ${energyPct}`);
  setWidth("live-v-hunger-bar", hungerPct);
  setWidth("live-v-energy-bar", energyPct);

  const chronicleList = elOptional("live-v-chronicle-list");
  if (chronicleList) {
    const dayKey = String(world.stats.day);
    if (chronicleList.dataset.day !== dayKey) {
      chronicleList.dataset.day = dayKey;
      chronicleList.innerHTML = renderChronicleList(world);
    }
  }

  // список жителей — только если состав изменился
  const list = elOptional("live-resident-list");
  if (list) {
    const ids = world.agents
      .filter((a) => a.alive)
      .map((a) => a.id)
      .sort((a, b) => a - b)
      .join(",");
    if (list.dataset.ids !== ids) {
      list.dataset.ids = ids;
      list.innerHTML = renderResidentList(world);
    } else {
      // обновить мета-строки
      for (const a of world.agents.filter((x) => x.alive)) {
        const meta = list.querySelector(`[data-agent-id="${a.id}"] .res-meta`);
        if (meta) meta.textContent = `${professionLabel(a.profession)} · ${taskLabel(a.task)}`;
      }
    }
  }
}

function elOptional(id: string): HTMLElement | null {
  return document.getElementById(id);
}

function setText(id: string, text: string): void {
  const n = elOptional(id);
  if (n) n.textContent = text;
}

function setWidth(id: string, pct: number): void {
  const n = elOptional(id);
  if (n) n.style.width = `${pct}%`;
}

function renderAgent(agent: Agent, world: World): string {
  const hungerPct = Math.round(agent.hunger);
  const energyPct = Math.round(agent.energy);
  const kids = childrenOf(world, agent.id);
  const kidsLabel =
    kids.length === 0
      ? "—"
      : kids
          .slice(0, 6)
          .map((k) => (k.alive ? fullName(k) : `${fullName(k)} †`))
          .join(", ") + (kids.length > 6 ? ` (+${kids.length - 6})` : "");

  return `
    <div class="name">${escapeHtml(fullName(agent))}</div>
    <p class="chronicle" id="live-chronicle">${escapeHtml(agentChronicle(agent, world))}</p>
    <div class="section-title">Показатели</div>
    <div class="row"><span>Состояние</span><span id="live-health">${escapeHtml(healthLabel(agent.hunger, agent.energy))}</span></div>
    <div class="row"><span>Профессия</span><span id="live-profession">${escapeHtml(professionLabel(agent.profession))}</span></div>
    <div class="row"><span>Задача</span><span id="live-task">${escapeHtml(taskLabel(agent.task))}</span></div>
    <div class="row"><span>Пол</span><span>${SEX_LABELS[agent.sex]}</span></div>
    <div class="row"><span>Возраст</span><span>${agent.age.toFixed(1)} · ${ageLabel(agent.age)}</span></div>
    <div class="row"><span>Действие</span><span id="live-state">${STATE_LABELS[agent.state] ?? agent.state}</span></div>
    <div id="live-hunger-label">Голод ${hungerPct}</div>
    <div class="bar hunger"><i id="live-hunger-bar" style="width:${hungerPct}%"></i></div>
    <div id="live-energy-label">Силы ${energyPct}</div>
    <div class="bar energy"><i id="live-energy-bar" style="width:${energyPct}%"></i></div>
    <div class="section-title">Семья</div>
    <div class="row"><span>Супруг(а)</span><span>${escapeHtml(agentNameById(world, agent.spouseId))}</span></div>
    <div class="row"><span>Мать</span><span>${escapeHtml(agentNameById(world, agent.motherId))}</span></div>
    <div class="row"><span>Отец</span><span>${escapeHtml(agentNameById(world, agent.fatherId))}</span></div>
    <div class="row"><span>Дети</span><span>${escapeHtml(kidsLabel)}</span></div>
    <div class="row" id="live-carry" ${agent.carriedFood > 0 ? "" : "hidden"}>
      <span>Несёт</span><span class="val">${agent.carriedFood} ед. еды</span>
    </div>
    ${agent.pregnant > 0 ? `<div class="row"><span>Беременность</span><span>${agent.pregnant} тиков</span></div>` : ""}
    ${!agent.alive ? `<p class="dead">Мёртв · ${escapeHtml(agent.deathCause ?? "неизвестно")}</p>` : ""}
  `;
}

function renderResidentList(world: World): string {
  const residents = world.agents
    .filter((a) => a.alive)
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name, "ru"));
  if (residents.length === 0) return `<p class="muted">Никого не осталось.</p>`;
  return residents
    .map(
      (a) =>
        `<button type="button" class="resident-btn" data-agent-id="${a.id}">` +
        `<span>${escapeHtml(fullName(a))}</span>` +
        `<span class="res-meta">${escapeHtml(professionLabel(a.profession))} · ${taskLabel(a.task)}</span>` +
        `</button>`,
    )
    .join("");
}

function renderChronicleList(world: World): string {
  const lines = buildVillageChronicle(world, 10);
  if (lines.length === 0) return `<p class="muted">Летопись пуста.</p>`;
  return lines
    .slice()
    .reverse()
    .map((line) => `<p class="chronicle-entry">${escapeHtml(line)}</p>`)
    .join("");
}

function renderVillage(r: VillageReport, world: World): string {
  const barnPct = Math.round((r.barnFood / Math.max(1, r.barnCapacity)) * 100);
  const hungerPct = Math.round(r.avgHunger);
  const energyPct = Math.round(r.avgEnergy);
  const listHtml = renderResidentList(world);
  const ids = world.agents
    .filter((a) => a.alive)
    .map((a) => a.id)
    .sort((a, b) => a - b)
    .join(",");

  return `
    <div class="name">${escapeHtml(r.name)}</div>
    <p class="chronicle" id="live-v-chronicle">${escapeHtml(r.chronicle)}</p>
    <p class="outlook" id="live-v-outlook">${escapeHtml(r.outlook)}</p>

    <div class="section-title">Население</div>
    <div class="row"><span>Живы</span><span id="live-v-alive">${r.alive}</span></div>
    <div class="row"><span>Умерло</span><span id="live-v-dead">${r.dead}</span></div>
    <div class="row"><span>Рождений</span><span id="live-v-births">${r.births}</span></div>
    <div class="row"><span>Муж / Жен</span><span id="live-v-mw">${r.men} / ${r.women}</span></div>
    <div class="row"><span>Дети / Взр. / Старцы</span><span id="live-v-ages">${r.children} / ${r.adults} / ${r.elders}</span></div>
    <div class="row"><span>Пары</span><span id="live-v-couples">${r.couples}</span></div>
    <div class="row"><span>Беременны</span><span id="live-v-preg">${r.pregnant}</span></div>
    <div class="row"><span>Голодны / Спят / На сборе</span><span id="live-v-activity">${r.hungry} / ${r.sleeping} / ${r.working}</span></div>

    <div class="section-title">Профессии</div>
    <div class="row"><span>Сборщики</span><span id="live-v-gath">${r.professions.gatherer}</span></div>
    <div class="row"><span>Батраки</span><span id="live-v-lab">${r.professions.laborer}</span></div>
    <div class="row"><span>Сторожа</span><span id="live-v-keep">${r.professions.keeper}</span></div>
    <div class="row"><span>Старцы</span><span id="live-v-eld">${r.professions.elder}</span></div>
    <div class="row"><span>Дети</span><span id="live-v-ch">${r.professions.child}</span></div>

    <div class="section-title">Ресурсы</div>
    <div class="row"><span>День · время</span><span id="live-v-day">${r.day} · ${r.phase}</span></div>
    <div class="row"><span>Хижины</span><span>${r.hutCount}</span></div>
    <div class="row"><span>Лесных клеток</span><span>${r.forestTiles}</span></div>
    <div id="live-v-barn-label">Амбар ${r.barnFood} / ${r.barnCapacity}</div>
    <div class="bar barn"><i id="live-v-barn-bar" style="width:${barnPct}%"></i></div>
    <div class="row"><span>Дикая еда</span><span id="live-v-wild">${r.wildFood}</span></div>
    <div class="row"><span>Несут сейчас</span><span id="live-v-carry">${r.carriedFood}</span></div>
    <div id="live-v-hunger-label">Средний голод ${hungerPct}</div>
    <div class="bar hunger"><i id="live-v-hunger-bar" style="width:${hungerPct}%"></i></div>
    <div id="live-v-energy-label">Средние силы ${energyPct}</div>
    <div class="bar energy"><i id="live-v-energy-bar" style="width:${energyPct}%"></i></div>

    <div class="section-title">Летопись</div>
    <div class="chronicle-list" id="live-v-chronicle-list" data-day="${r.day}">${renderChronicleList(world)}</div>

    <div class="section-title">Жители</div>
    <div class="resident-list" id="live-resident-list" data-ids="${ids}">${listHtml}</div>
  `;
}

function escapeHtml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function bindHudControls(opts: {
  onPause: () => void;
  onSpeed: (speed: number) => void;
  onVillage: () => void;
  onSelectAgent: (id: number) => void;
}): void {
  onSelectAgentCb = opts.onSelectAgent;
  el<HTMLButtonElement>("btn-pause").addEventListener("click", opts.onPause);
  el<HTMLButtonElement>("btn-village").addEventListener("click", opts.onVillage);
  for (const s of [1, 2, 4]) {
    el<HTMLButtonElement>(`btn-speed-${s}`).addEventListener("click", () => opts.onSpeed(s));
  }

  el<HTMLElement>("inspector-body").addEventListener("click", (e) => {
    const target = (e.target as HTMLElement).closest<HTMLElement>(".resident-btn");
    if (!target || !onSelectAgentCb) return;
    const id = Number(target.dataset.agentId);
    if (Number.isFinite(id)) onSelectAgentCb(id);
  });
}

export function isVillageClick(world: World, wx: number, wy: number): boolean {
  const tx = Math.floor(wx);
  const ty = Math.floor(wy);
  if (tx < 0 || ty < 0 || tx >= world.width || ty >= world.height) return false;
  const tile = world.tiles[ty * world.width + tx]!;
  if (tile.kind === "barn") return true;
  if (tile.kind === "hut" || tile.kind === "dirt") {
    const d = Math.hypot(tx - world.barnX, ty - world.barnY);
    return d <= 9;
  }
  return false;
}
