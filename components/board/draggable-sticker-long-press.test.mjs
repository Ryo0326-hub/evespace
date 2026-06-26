import { readFile } from "node:fs/promises";
import { describe, it } from "node:test";
import assert from "node:assert/strict";

describe("placed sticker drag gesture", () => {
  it("requires an intentional press before a placed sticker can drag", async () => {
    const source = await readFile("components/board/DraggableSticker.tsx", "utf8");
    const delayMatch = source.match(/const stickerDragPressDelayMs = (\d+);/);

    assert.ok(delayMatch, "placed stickers should define a press delay before dragging");

    const delay = Number(delayMatch[1]);
    assert.ok(
      delay >= 180 && delay <= 320,
      "placed sticker drag should wait briefly without feeling like a full long press",
    );
    assert.match(
      source,
      /const pressTimerId = window\.setTimeout\(\(\) => \{[\s\S]*beginDrag\(\);[\s\S]*\}, stickerDragPressDelayMs\);/,
      "placed sticker dragging should begin from a press timer",
    );

    const handler = source.match(
      /function handlePointerDown\(event: React\.PointerEvent<HTMLDivElement>\) \{[\s\S]*?window\.addEventListener\("pointercancel", finishDrag\);\n  \}/,
    )?.[0];

    assert.ok(handler, "placed sticker pointer handler should be readable");

    const beforePressTimer = handler.slice(0, handler.indexOf("function beginDrag"));
    assert.doesNotMatch(
      beforePressTimer,
      /event\.preventDefault\(\)|setPointerCapture\(|setIsDragging\(true\)/,
      "placed stickers should not block scroll or capture the pointer before the press delay elapses",
    );
  });

  it("lets post scrolling win when the pointer moves before the press delay", async () => {
    const source = await readFile("components/board/DraggableSticker.tsx", "utf8");

    assert.match(
      source,
      /const stickerDragCancelDistance = \d+;/,
      "placed sticker pending drags should have a movement cancel threshold",
    );
    assert.match(
      source,
      /if \(!dragStarted\) \{[\s\S]*if \(delta > stickerDragCancelDistance\) \{[\s\S]*cleanupDrag\(false\);[\s\S]*\}[\s\S]*return;[\s\S]*\}/,
      "moving before the press delay should cancel sticker dragging so the post feed can scroll",
    );
    assert.doesNotMatch(
      source,
      /className=\{`group absolute touch-none/,
      "placed stickers should not disable touch scrolling before the press delay",
    );
    assert.match(
      source,
      /className=\{`group absolute touch-pan-y/,
      "placed stickers should explicitly allow vertical touch scrolling while idle",
    );
  });
});
