export type PlanetLevel = {
  level: number;
  name: string;
  threshold: number;
};

export type PlanetLevelInfo = {
  level: number;
  name: string;
  nextLevelName: string | null;
  nextLevelTarget: number | null;
  progress: number;
};

export const PLANET_LEVELS: PlanetLevel[];

export function getPlanetLevelInfo(eventCount: number): PlanetLevelInfo;

export function getPlanetLevelUp(
  previousEventCount: number,
  nextEventCount: number,
): PlanetLevel | null;
