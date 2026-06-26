import { readFile } from "node:fs/promises";
import { describe, it } from "node:test";
import assert from "node:assert/strict";

describe("scrapbook memory post action", () => {
  it("requires a message, treats photo as optional, and persists scrapbook styles", async () => {
    const source = await readFile("app/actions/memories.ts", "utf8");

    assert.match(source, /const photoFile = photo instanceof File && photo\.size > 0 \? photo : null;/);
    assert.match(source, /Write a message before posting\./);
    assert.doesNotMatch(source, /Choose a photo before posting\./);
    assert.match(source, /caption:\s*message/);
    assert.match(source, /sticky_note_style:\s*memoryPostStyle\.stickyNoteStyle/);
    assert.match(source, /message_pen_style:\s*memoryPostStyle\.memoryPenStyle/);
    assert.match(source, /if \(photoFile && uploadedMedia\) \{/);
  });
});
