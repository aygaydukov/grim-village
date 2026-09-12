import { countUnburiedBodies, hasGraveyard } from "./burial";
import type { World } from "./types";

/** Сколько могильщиков держать при живом кладбище */
export function gravediggerTarget(world: World, workingAdults: number): number {
  if (workingAdults < 6) return 0;
  const cemetery =
    hasGraveyard(world) || world.burialCount > 0 || countUnburiedBodies(world) > 0;
  if (!cemetery) return 0;
  const unburied = countUnburiedBodies(world);
  if (unburied >= 3) return Math.min(2, Math.max(1, Math.round(workingAdults * 0.06)));
  return 1;
}
