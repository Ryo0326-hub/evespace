import { readFile } from "node:fs/promises";
import { describe, it } from "node:test";
import assert from "node:assert/strict";

describe("memory post form", () => {
  it("does not ask for a display name when creating a memory post", async () => {
    const source = await readFile("components/board/MemoryPostForm.tsx", "utf8");

    assert.doesNotMatch(
      source,
      /<Field label="Display name">/,
      "create memory post form should not render a display name field",
    );
    assert.doesNotMatch(
      source,
      /name="authorDisplayName"/,
      "create memory post form should not submit an authorDisplayName input",
    );
    assert.doesNotMatch(
      source,
      /authorDisplayName,\s*setAuthorDisplayName|setAuthorDisplayName/,
      "create memory post form should not keep display name input state",
    );
  });

  it("uses message-first scrapbook fields instead of a required caption/photo flow", async () => {
    const source = await readFile("components/board/MemoryPostForm.tsx", "utf8");

    assert.match(source, /Field label="Message"/);
    assert.match(source, /name="message"/);
    assert.match(source, /name="stickyNoteStyle"/);
    assert.match(source, /name="memoryPenStyle"/);
    assert.match(source, /Pick Your Paper Color|Choose Your Paper Color/);
    assert.match(source, /Choose Your Pen/);
    assert.match(source, /\/memory-board-actions\/upload\.png/);
    assert.doesNotMatch(source, /Field label="Caption"/);
    assert.doesNotMatch(source, /disabled=\{!fileSelected \|\| busy\}/);
  });
});
