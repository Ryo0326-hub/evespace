import { readFile } from "node:fs/promises";
import { describe, it } from "node:test";
import assert from "node:assert/strict";

describe("sticker store interactions", () => {
  it("does not add stickers from tap or keyboard activation in the store", async () => {
    const storeSource = await readFile("components/board/StickerStorePanel.tsx", "utf8");

    assert.doesNotMatch(
      storeSource,
      /onAddSticker/,
      "sticker store should not expose a tap/click add callback",
    );
    assert.doesNotMatch(
      storeSource,
      /onKeyDown[\s\S]*addSticker|onKeyDown[\s\S]*onAddSticker/,
      "sticker tiles should not add stickers from Enter or Space",
    );
    assert.doesNotMatch(
      storeSource,
      /className="touch-none rounded-\[1rem\]/,
      "sticker tiles should not disable touch scrolling across the whole tile",
    );
  });

  it("only drops stickers after a real drag gesture", async () => {
    const boardSource = await readFile("components/board/InteractiveMemoryBoard.tsx", "utf8");

    assert.match(
      boardSource,
      /function finishDrag\(\) \{[\s\S]*if \(!didMove\) \{[\s\S]*return;[\s\S]*\}[\s\S]*addSticker\(stickerId,/,
      "tapping a sticker without moving should finish the drag without posting it",
    );
    assert.match(
      boardSource,
      /requireDropTarget:\s*true/,
      "dragged stickers should only add when released over a memory card",
    );
  });

  it("keeps the sticker store content scrollable on small screens", async () => {
    const storeSource = await readFile("components/board/StickerStorePanel.tsx", "utf8");
    const cssSource = await readFile("app/globals.css", "utf8");

    assert.match(
      storeSource,
      /max-h-\[calc\(100dvh-10\.5rem\)\]/,
      "mobile sticker store should use available viewport height instead of a tiny fixed fraction",
    );
    assert.match(
      storeSource,
      /memory-board-sticker-store-scroll flex-1 min-h-0 overflow-y-auto/,
      "sticker store should give the scrolling region a stable min-height and overflow container",
    );
    assert.match(
      cssSource,
      /\.memory-board-sticker-store-scroll\s*\{[\s\S]*-webkit-overflow-scrolling:\s*touch;[\s\S]*overscroll-behavior:\s*contain;[\s\S]*touch-action:\s*pan-y;/,
      "sticker store scroll area should support momentum touch scrolling without leaking page scroll",
    );
  });
});
