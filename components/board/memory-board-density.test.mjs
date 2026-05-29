import { readFile } from "node:fs/promises";
import { describe, it } from "node:test";
import assert from "node:assert/strict";

const boardRoutePaths = [
  "app/boards/[boardId]/page.tsx",
  "app/events/[eventSlug]/board/page.tsx",
  "app/official-events/[id]/board/page.tsx",
];

describe("memory board dense layout", () => {
  it("does not render a title-like author line on memory posts", async () => {
    const source = await readFile("components/board/MemoryCard.tsx", "utf8");

    assert.doesNotMatch(
      source,
      /post\.authorDisplayName\s*\|\|\s*"Anonymous"/,
      "memory cards should not show the old title-like post heading",
    );
  });

  it("keeps the board grid and memory cards tightly stacked", async () => {
    const boardSource = await readFile("components/board/MemoryBoard.tsx", "utf8");
    const cardSource = await readFile("components/board/MemoryCard.tsx", "utf8");
    const interactiveSource = await readFile(
      "components/board/InteractiveMemoryBoard.tsx",
      "utf8",
    );
    const globalsSource = await readFile("app/globals.css", "utf8");

    assert.match(boardSource, /grid min-w-0 max-w-full gap-2 overflow-x-clip/);
    assert.match(
      cardSource,
      /memory-post-card[^"]*border-2[^"]*border-dotted[^"]*border-slate-300/,
      "memory post cards should use a light dotted border",
    );
    assert.doesNotMatch(
      cardSource,
      /border-\[3px\][^"]*border-black/,
      "memory post cards should not use the old bold black border",
    );
    assert.doesNotMatch(interactiveSource, /pt-4 sm:pt-6/);
    assert.match(globalsSource, /\.memory-grid\s*\{[\s\S]*gap:\s*var\(--memory-board-mobile-gap,\s*1rem\);/);
    assert.match(
      globalsSource,
      /\.memory-board-main\s*\{[\s\S]*--memory-board-mobile-gap:\s*1rem;/,
      "mobile board spacing should use the larger post-to-post gap as the shared token",
    );
    assert.match(
      globalsSource,
      /@media \(max-width: 767px\)[\s\S]*\.memory-board-content-stack\s*\{[\s\S]*gap:\s*var\(--memory-board-mobile-gap\)/,
      "mobile content stack should use the shared spacing token between banner and posts",
    );
    assert.match(
      globalsSource,
      /\.memory-board-content-stack > \.memory-board-title-card\s*\{[\s\S]*margin-block-start:\s*var\(--memory-board-mobile-gap\) !important;/,
      "mobile banner should use the shared spacing token below the navbar",
    );
    assert.match(
      globalsSource,
      /\.memory-board-main\s*\{[\s\S]*padding-bottom:\s*calc\(var\(--memory-board-mobile-action-height\) \+ var\(--memory-board-mobile-gap\)\) !important;/,
      "mobile bottom padding should leave the shared spacing token above the action bar",
    );
    assert.match(
      globalsSource,
      /\.memory-post-card\[data-memory-card-id\]\s*\{[\s\S]*border-color:\s*#cbd5e1 !important;[\s\S]*border-style:\s*dotted !important;/,
      "theme overrides should preserve the lighter dotted memory post border",
    );
  });

  it("uses compact page-to-banner spacing on all memory board routes", async () => {
    for (const routePath of boardRoutePaths) {
      const source = await readFile(routePath, "utf8");

      assert.match(
        source,
        /memory-board-main[^"`]*min-h-dvh[^"`]*pt-0[^"`]*md:pt-3/,
        `${routePath} should use the same mobile spacing from navbar to banner as banner to posts`,
      );
      assert.match(
        source,
        /memory-board-title-card[^"`]*mt-0[^"`]*mb-0/,
        `${routePath} should avoid mobile margin collapse around the banner`,
      );
      assert.match(
        source,
        /memory-board-content-stack/,
        `${routePath} should use the mobile content stack gap`,
      );
    }
  });
});
