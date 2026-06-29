import { readFile } from "node:fs/promises";
import { describe, it } from "node:test";
import assert from "node:assert/strict";

const allowedCategories = ["pixel", "doodle", "clay"];

describe("sticker registry reset", () => {
  it("only exposes pixel, doodle, and clay categories", async () => {
    const [source, typesSource] = await Promise.all([
      readFile("lib/stickers/sticker-registry.ts", "utf8"),
      readFile("types/evespace.ts", "utf8"),
    ]);

    const categoryBlock = source.match(/STICKER_CATEGORIES[\s\S]*?\];/)?.[0] ?? "";
    const categoryIds = [...categoryBlock.matchAll(/id: "([^"]+)"/g)].map(
      (match) => match[1],
    );
    const typeBlock = typesSource.match(/export type StickerCategory =[\s\S]*?;/)?.[0] ?? "";
    const typeCategories = [...typeBlock.matchAll(/"([^"]+)"/g)].map((match) => match[1]);

    assert.deepEqual(categoryIds, allowedCategories);
    assert.deepEqual(typeCategories, allowedCategories);
  });

  it("only registers stickers from the reset categories", async () => {
    const source = await readFile("lib/stickers/sticker-registry.ts", "utf8");
    const stickerBlock = source.match(/export const STICKERS[\s\S]*?\];/)?.[0] ?? "";
    const stickerCategories = [...stickerBlock.matchAll(/category: "([^"]+)"/g)].map(
      (match) => match[1],
    );

    assert.ok(stickerCategories.length > 0, "reset sticker catalog should not be empty");
    assert.deepEqual([...new Set(stickerCategories)].sort(), [...allowedCategories].sort());
    assert.doesNotMatch(
      stickerBlock,
      /\/stickers\/ICONS8\//,
      "reset sticker catalog should not reference old ICONS8 demo stickers",
    );
  });
});
