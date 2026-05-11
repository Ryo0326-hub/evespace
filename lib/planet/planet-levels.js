const PLANET_LEVELS = [
  {
    level: 1,
    name: "Seed Planet",
    threshold: 0,
  },
  {
    level: 2,
    name: "Living Planet",
    threshold: 2,
  },
  {
    level: 3,
    name: "Constellation Planet",
    threshold: 6,
  },
];

function getPlanetLevelInfo(eventCount) {
  const current = getPlanetLevel(eventCount);
  const next = PLANET_LEVELS.find((level) => level.threshold > eventCount) ?? null;

  return {
    level: current.level,
    name: current.name,
    nextLevelName: next?.name ?? null,
    nextLevelTarget: next?.threshold ?? null,
    progress: next ? Math.min(100, Math.round((eventCount / next.threshold) * 100)) : 100,
  };
}

function getPlanetLevelUp(previousEventCount, nextEventCount) {
  const previousLevel = getPlanetLevel(previousEventCount);
  const nextLevel = getPlanetLevel(nextEventCount);

  return nextLevel.level > previousLevel.level ? nextLevel : null;
}

function getPlanetLevel(eventCount) {
  return PLANET_LEVELS.reduce((current, level) => {
    return eventCount >= level.threshold ? level : current;
  }, PLANET_LEVELS[0]);
}

exports.PLANET_LEVELS = PLANET_LEVELS;
exports.getPlanetLevelInfo = getPlanetLevelInfo;
exports.getPlanetLevelUp = getPlanetLevelUp;
