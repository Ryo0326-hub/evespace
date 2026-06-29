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
    assert.doesNotMatch(source, /name="message"[\s\S]{0,260}required/);
    assert.match(source, /name="stickyNoteStyle"/);
    assert.match(source, /name="memoryPenStyle"/);
    assert.match(source, /Pick Your Paper Color|Choose Your Paper Color/);
    assert.match(source, /Choose Your Pen/);
    assert.match(source, /\/memory-board-actions\/upload\.png/);
    assert.match(source, /const ready = message\.trim\(\)\.length > 0 \|\| hasPhoto;/);
    assert.match(source, /disabled=\{!ready \|\| busy\}/);
    assert.doesNotMatch(source, /Field label="Caption"/);
    assert.doesNotMatch(source, /disabled=\{!fileSelected \|\| busy\}/);
  });

  it("keeps uploaded photo previews compact without cropping the full image", async () => {
    const [editorSource, globalsSource] = await Promise.all([
      readFile("components/board/PhotoDoodleEditor.tsx", "utf8"),
      readFile("app/globals.css", "utf8"),
    ]);

    assert.match(editorSource, /memory-doodle-canvas/);
    assert.doesNotMatch(editorSource, /aspect-\[4\/3\]|object-cover/);
    assert.match(
      globalsSource,
      /\.memory-doodle-canvas-frame\s*\{[\s\S]*max-width:\s*min\(100%,\s*24rem\)/,
      "doodle preview frame should not fill the whole form width",
    );
    assert.match(
      globalsSource,
      /\.memory-doodle-canvas\s*\{[\s\S]*max-height:\s*18rem[\s\S]*object-fit:\s*contain/,
      "doodle preview canvas should preserve the whole uploaded image",
    );
  });

  it("aligns message paper lines to textarea rows", async () => {
    const globalsSource = await readFile("app/globals.css", "utf8");
    const lineGradientCount = (globalsSource.match(/repeating-linear-gradient\(to bottom/g) ?? [])
      .length;

    assert.match(
      globalsSource,
      /--memory-paper-line-height:\s*2rem;/,
      "paper line height should match the textarea row rhythm",
    );
    assert.ok(
      lineGradientCount >= 2,
      "paper line gradients should be anchored top-down for the textarea and post note overlays",
    );
    assert.match(globalsSource, /line-height:\s*var\(--memory-paper-line-height\)/);
  });
});
