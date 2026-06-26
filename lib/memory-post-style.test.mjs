import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  isMemoryPenStyle,
  isMemoryPaperStyle,
  normalizeMemoryPostStyleSelection,
} from "./memory-post-style.mjs";

describe("memory post style selection", () => {
  it("accepts the scrapbook paper and pen styles used by the create form", () => {
    assert.equal(isMemoryPaperStyle("sky"), true);
    assert.equal(isMemoryPaperStyle("mint"), true);
    assert.equal(isMemoryPaperStyle("lavender"), true);
    assert.equal(isMemoryPenStyle("classic_pen"), true);
    assert.equal(isMemoryPenStyle("marker"), true);
    assert.equal(isMemoryPenStyle("fountain_pen"), true);
  });

  it("normalizes unknown values to the default scrapbook styles", () => {
    assert.deepEqual(
      normalizeMemoryPostStyleSelection({
        stickyNoteStyle: "glass",
        memoryPenStyle: "spray_paint",
      }),
      {
        stickyNoteStyle: "mint",
        memoryPenStyle: "classic_pen",
      },
    );
  });
});
