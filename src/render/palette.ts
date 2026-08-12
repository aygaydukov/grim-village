import type { TileKind } from "../sim/types";

/** Мрачная палитра — грязь, пепел, гниль */
export const TILE_COLORS: Record<TileKind, string> = {
  grass: "#2a3324",
  dirt: "#3a3024",
  forest: "#1a2418",
  water: "#1a2430",
  hut: "#4a3428",
  barn: "#5a4028",
  workshop: "#4a3848",
};

export const TILE_EDGE: Record<TileKind, string> = {
  grass: "#323c2c",
  dirt: "#4a3c2e",
  forest: "#243028",
  water: "#243448",
  hut: "#5c4030",
  barn: "#6e5030",
  workshop: "#5a4860",
};

export const FOOD_DOT = "#6a5030";
export const BARN_FILL = "#8a6a38";

export const AGENT_MALE = "#8a6a48";
export const AGENT_FEMALE = "#7a5858";
export const AGENT_CHILD = "#9a8870";
export const AGENT_DEAD = "#3a3030";
export const AGENT_SLEEP = "#4a5a68";
export const AGENT_HUNGRY = "#8a3030";
export const AGENT_ARTISAN = "#6a5878";
export const SELECT_RING = "#c4a878";
export const CARRY_DOT = "#c4a050";

export const NIGHT_OVERLAY = "rgba(8, 10, 18, 0.45)";
export const DUSK_OVERLAY = "rgba(40, 24, 16, 0.2)";

/** Эпидемия — лёгкий фиолетовый туман и обводка хижин */
export const EPIDEMIC_OVERLAY = "rgba(48, 24, 56, 0.22)";
export const QUARANTINE_HUT = "rgba(120, 72, 140, 0.38)";
export const QUARANTINE_RING = "#9a68a8";
/** Больная изба — центральный карантин при эпидемии */
export const SICK_HUT_FILL = "rgba(140, 48, 72, 0.5)";
export const SICK_HUT_RING = "#c06078";
/** Вторая больная изба — чуть иная обводка */
export const SICK_HUT2_FILL = "rgba(160, 88, 48, 0.48)";
export const SICK_HUT2_RING = "#d08050";
export const ELDER_HEAL_RING = "#68a878";

/** Стройплощадка хижины */
export const BUILD_SITE_FILL = "rgba(90, 72, 48, 0.55)";
export const BUILD_SITE_FRAME = "rgba(196, 168, 120, 0.75)";
export const BUILD_SITE_PROGRESS = "#8a6a38";
