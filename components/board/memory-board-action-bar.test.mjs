import { access, readFile } from "node:fs/promises";
import { constants } from "node:fs";
import { describe, it } from "node:test";
import assert from "node:assert/strict";

const actionIconPaths = [
  "public/memory-board-actions/create-v2.png",
  "public/memory-board-actions/edit-v2.png",
  "public/memory-board-actions/stickers-v2.png",
  "public/memory-board-actions/back-v2.png",
];

const boardRoutePaths = [
  "app/boards/[boardId]/page.tsx",
  "app/events/[eventSlug]/board/page.tsx",
  "app/official-events/[id]/board/page.tsx",
];

describe("memory board action bar integration", () => {
  it("serves the four supplied action icons from public assets", async () => {
    for (const iconPath of actionIconPaths) {
      await assert.doesNotReject(
        access(iconPath, constants.R_OK),
        `${iconPath} should be readable`,
      );
    }
  });

  it("uses one cohesive square button icon set", async () => {
    const iconSizes = await Promise.all(
      actionIconPaths.map(async (iconPath) => ({
        iconPath,
        ...readPngSize(await readFile(iconPath)),
      })),
    );

    for (const { iconPath, width, height } of iconSizes) {
      assert.equal(width, height, `${iconPath} should be square`);
      assert.ok(width >= 100, `${iconPath} should use the supplied cohesive artwork`);
    }

    assert.equal(
      new Set(iconSizes.map(({ width, height }) => `${width}x${height}`)).size,
      1,
      "all action icons should share the same dimensions",
    );
  });

  it("uses the shared action bar instead of the old top action nav on board pages", async () => {
    for (const routePath of boardRoutePaths) {
      const source = await readFile(routePath, "utf8");

      assert.match(
        source,
        /MemoryBoardActionBar/,
        `${routePath} should render the shared action bar`,
      );
      assert.doesNotMatch(
        source,
        /id="memory-board-actions"/,
        `${routePath} should not render the old top action group`,
      );
      assert.doesNotMatch(
        source,
        /StickerStoreButton/,
        `${routePath} should not import the old sticker store button`,
      );
      assert.doesNotMatch(
        source,
        /md:grid-cols-\[6\.25rem_minmax\(0,1fr\)\]|md:grid/,
        `${routePath} should not reserve a desktop rail column for the action bar`,
      );
      assert.match(
        source,
        /<div className="min-w-0 w-full">/,
        `${routePath} should let the memory board content use the full board width`,
      );
      assert.doesNotMatch(
        source,
        /md:pb-6/,
        `${routePath} should keep bottom padding for the fixed action bar on desktop too`,
      );
    }
  });

  it("keeps responsive positioning and button alignment on the component itself", async () => {
    const source = await readFile("components/board/MemoryBoardActionBar.tsx", "utf8");

    for (const iconPath of actionIconPaths) {
      assert.match(
        source,
        new RegExp(iconPath.replace(/^public/, "").replaceAll("/", "\\/")),
        `action bar should reference ${iconPath}`,
      );
    }

    assert.match(
      source,
      /fixed[^"]*bottom-0[^"]*justify-center/,
      "the action shell should stay fixed to the bottom and centered at every viewport size",
    );
    assert.doesNotMatch(
      source,
      /md:sticky|md:top-6|md:bottom-auto|md:w-\[6rem\]|md:flex-col/,
      "the action bar should not switch into a desktop side rail",
    );
    assert.match(
      source,
      /flex-col[^"]*items-center[^"]*justify-center/,
      "action buttons should center icons and labels in a vertical stack",
    );
    assert.match(
      source,
      /shrink-0[^"]*items-center[^"]*justify-center/,
      "icon frames should keep each icon centered in a stable box",
    );

    const globalsSource = await readFile("app/globals.css", "utf8");
    assert.doesNotMatch(
      globalsSource,
      /@media \(min-width: 768px\)[\s\S]*\.memory-board-action-shell[\s\S]*position:\s*sticky;/,
      "global CSS should not restyle the action shell as a desktop sticky rail",
    );
  });
});

function readPngSize(buffer) {
  assert.equal(buffer.toString("ascii", 1, 4), "PNG", "expected a PNG image");

  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}
