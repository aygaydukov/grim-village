export const TILE_SIZE = 16;

export type TileKind = "grass" | "dirt" | "forest" | "water" | "hut" | "barn" | "workshop";

export type AgentSex = "male" | "female";

/** Роль в деревне — определяет зону и дневную работу */
export type Profession =
  | "child"
  | "gatherer"
  | "laborer"
  | "keeper"
  | "artisan"
  | "elder";

/** Высокоуровневая задача (что сейчас должен делать) */
export type TaskKind =
  | "idle"
  | "patrol"
  | "returnHome"
  | "gather"
  | "deposit"
  | "eat"
  | "rest"
  | "social"
  | "play"
  | "build"
  | "craft";

export type AgentState =
  | "wander"
  | "seekFood"
  | "eat"
  | "seekRest"
  | "sleep"
  | "seekMate"
  | "court"
  | "seekGather"
  | "gather"
  | "deposit"
  | "returnHome"
  | "patrol"
  | "idle"
  | "seekBuild"
  | "build"
  | "craft";

export interface Tile {
  kind: TileKind;
  food: number;
  maxFood: number;
}

export type Season = "spring" | "summer" | "autumn" | "winter";

/** Политика старосты: налог, приоритет стройки vs амбара */
export type StarostaPolicy = "balanced" | "build" | "store" | "relief";

/** Активный сезонный шок (неурожай, эпидемия) */
export type ActiveShock =
  | {
      kind: "crop_failure";
      daysLeft: number;
      /** Множитель регена дикой еды (0.5–0.6 при неурожае) */
      regenFactor: number;
    }
  | {
      kind: "epidemic";
      daysLeft: number;
      /** Базовый дневный шанс смерти от болезни (0.02–0.04) */
      mortalityRate: number;
    };

/** Именованное событие игрового дня для летописи */
export type DayEventKind =
  | "birth"
  | "death"
  | "profession"
  | "shock"
  | "construction"
  | "government"
  | "migration"
  | "immigration"
  | "craft"
  | "trade"
  | "caravan";

export interface BuildProject {
  x: number;
  y: number;
  progress: number;
  required: number;
  builderId: number | null;
}

export interface DayEvent {
  kind: DayEventKind;
  name: string;
  detail?: string;
}

export interface DaySnapshot {
  day: number;
  alive: number;
  dead: number;
  births: number;
  /** Смерти за прошедший игровой день (дельта к предыдущему снимку) */
  deathsToday: number;
  /** Рождения за прошедший игровой день */
  birthsToday: number;
  /** Жители с голодом > 70 */
  highHunger: number;
  /** Жители с stuckTicks ≥ 60 (застряли у воды или за участком) */
  stuckAgents: number;
  season: Season;
  barnFood: number;
  wildFood: number;
  avgHunger: number;
  avgEnergy: number;
  professions: Record<Profession, number>;
  /** Именованные события дня (рождения, смерти, смена профессий) */
  events?: DayEvent[];
}

export interface Agent {
  id: number;
  name: string;
  surname: string;
  sex: AgentSex;
  x: number;
  y: number;
  age: number;
  hunger: number;
  energy: number;
  profession: Profession;
  task: TaskKind;
  state: AgentState;
  targetX: number | null;
  targetY: number | null;
  mateId: number | null;
  spouseId: number | null;
  motherId: number | null;
  fatherId: number | null;
  pregnant: number;
  carriedFood: number;
  homeX: number;
  homeY: number;
  alive: boolean;
  deathCause: string | null;
  cooldown: number;
  /** Тики без движения при поиске еды/дома — для диагностики застревания */
  stuckTicks: number;
}

export interface WorldConfig {
  width: number;
  height: number;
  initialPopulation: number;
  /** Укороченная беременность для CI smoke (100 дней) */
  ciMode?: boolean;
}

export interface WorldStats {
  alive: number;
  dead: number;
  day: number;
  timeOfDay: number;
  births: number;
  barnFood: number;
}

export interface World {
  width: number;
  height: number;
  tiles: Tile[];
  agents: Agent[];
  nextId: number;
  tick: number;
  dayLength: number;
  barnX: number;
  barnY: number;
  workshopX: number;
  workshopY: number;
  stats: WorldStats;
  dayHistory: DaySnapshot[];
  /** Seed генерации карты и начального PRNG */
  seed: number;
  /** Буфер событий текущего игрового дня (сбрасывается в снимке) */
  pendingDayEvents: DayEvent[];
  /** Сезонный шок, влияющий на реген еды */
  activeShock: ActiveShock | null;
  /** Текущая стройка хижины (батрак) */
  buildProject: BuildProject | null;
  /** День завершения последней хижины (кулдаун) */
  lastHutBuiltDay: number;
  /** Казна старосты (десятина и резерв) */
  treasury: number;
  /** id жителя-старосты */
  starostaId: number | null;
  /** Текущая политика старосты */
  starostaPolicy: StarostaPolicy;
  /** День последнего исхода семьи */
  lastMigrationDay: number;
  /** День последнего прихода беженцев */
  lastImmigrationDay: number;
  /** Склад ремесленных изделий (ткань, посуда) */
  craftStock: number;
  /** Склад соли (консервация, ночной холод) */
  saltStock: number;
  /** Склад железа (стройка, инструменты) */
  ironStock: number;
  /** День последнего визита каравана */
  lastCaravanDay: number;
  /** День последней эпидемии (кулдаун между вспышками) */
  lastEpidemicDay: number;
  /** Координаты «больной избы» при эпидемии (центр клетки хижины) */
  sickHutX: number | null;
  sickHutY: number | null;
  /** Вторая больная изба при переполнении первой (≥5 семей в карантине) */
  sickHut2X: number | null;
  sickHut2Y: number | null;
  /** Номер итерации поселения (перезапуск после фатала) */
  settlementVersion: number;
  /** Идентификатор текущего поселения */
  settlementId: string;
  /** CI-режим: укороченная демография (не сохраняется в сейв) */
  ciMode: boolean;
  rng: () => number;
}
