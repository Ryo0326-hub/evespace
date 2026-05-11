import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getPlanetLevelInfo, getPlanetLevelUp } from "./planet-levels.js";

describe("planet levels", () => {
  it("uses the existing level thresholds for event counts", () => {
    assert.deepEqual(getPlanetLevelInfo(0), {
      level: 1,
      name: "Seed Planet",
      nextLevelName: "Living Planet",
      nextLevelTarget: 2,
      progress: 0,
    });

    assert.deepEqual(getPlanetLevelInfo(2), {
      level: 2,
      name: "Living Planet",
      nextLevelName: "Constellation Planet",
      nextLevelTarget: 6,
      progress: 33,
    });

    assert.deepEqual(getPlanetLevelInfo(6), {
      level: 3,
      name: "Constellation Planet",
      nextLevelName: null,
      nextLevelTarget: null,
      progress: 100,
    });
  });

  it("returns the new level only when crossing a threshold", () => {
    assert.equal(getPlanetLevelUp(1, 2)?.level, 2);
    assert.equal(getPlanetLevelUp(5, 6)?.level, 3);
    assert.equal(getPlanetLevelUp(2, 3), null);
    assert.equal(getPlanetLevelUp(6, 7), null);
  });
});
