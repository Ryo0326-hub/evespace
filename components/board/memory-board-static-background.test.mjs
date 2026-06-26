import { readFile } from "node:fs/promises";
import { describe, it } from "node:test";
import assert from "node:assert/strict";

const boardRoutePaths = [
  "app/boards/[boardId]/page.tsx",
  "app/events/[eventSlug]/board/page.tsx",
  "app/official-events/[id]/board/page.tsx",
];

describe("memory board static background scrolling", () => {
  it("makes every memory board page scroll its content instead of the background", async () => {
    for (const routePath of boardRoutePaths) {
      const source = await readFile(routePath, "utf8");

      assert.match(
        source,
        /memory-board-main[^"`]*h-\[calc\(100dvh-4rem\)\][^"`]*overflow-y-auto/,
        `${routePath} should keep the themed background on a fixed-height scrolling board viewport`,
      );
      assert.doesNotMatch(
        source,
        /memory-board-main[^"`]*overflow-y-visible/,
        `${routePath} should not let the full themed page scroll with the document`,
      );
      assert.match(
        source,
        /memory-board-content-stack[\s\S]*memory-board-title-card[\s\S]*<MemoryBoard/,
        `${routePath} should keep the title header and posts inside the scrollable board content`,
      );
    }
  });

  it("keeps the themed board background stationary without adding a pseudo-layer", async () => {
    const cssSource = await readFile("app/globals.css", "utf8");

    assert.match(
      cssSource,
      /\.memory-board-main\s*\{[\s\S]*background-attachment:\s*scroll;[\s\S]*overflow-y:\s*auto;[\s\S]*-webkit-overflow-scrolling:\s*touch;[\s\S]*overscroll-behavior-y:\s*contain;/,
      "the board viewport should scroll content while its own background remains static",
    );
    assert.doesNotMatch(
      cssSource,
      /\.memory-board-main::before|\.memory-board-main::after/,
      "static board backgrounds should not be implemented by adding extra CSS background layers",
    );
  });
});
