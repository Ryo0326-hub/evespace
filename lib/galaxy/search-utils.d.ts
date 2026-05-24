import type { Event } from "@/types/evespace";

export function getGalaxySearchSuggestions(
  boards: Event[],
  query: string,
  limit?: number,
): Event[];
