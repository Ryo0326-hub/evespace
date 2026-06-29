import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { describe, it } from "node:test";

describe("desktop content width", () => {
  it("keeps form-heavy pages compact while leaving landing full-bleed", async () => {
    const [
      globalsSource,
      privatePostPage,
      officialPostPage,
      eventPostPage,
      officialEventCreatePage,
      boardCreatePage,
      boardEditPage,
      profileSource,
      landingSource,
      memoryFormSource,
    ] = await Promise.all([
      readFile("app/globals.css", "utf8"),
      readFile("app/boards/[boardId]/post/page.tsx", "utf8"),
      readFile("app/official-events/[id]/post/page.tsx", "utf8"),
      readFile("app/events/[eventSlug]/post/page.tsx", "utf8"),
      readFile("app/official-events/new/page.tsx", "utf8"),
      readFile("app/boards/new/page.tsx", "utf8"),
      readFile("app/boards/[boardId]/edit/page.tsx", "utf8"),
      readFile("components/profile/UserPlanet.tsx", "utf8"),
      readFile("components/galaxy/GalaxyLanding.tsx", "utf8"),
      readFile("components/board/MemoryPostForm.tsx", "utf8"),
    ]);

    assert.match(
      globalsSource,
      /--evespace-content-max-width:\s*67\.5rem;/,
      "shared content rail should match Ken Memorial's 1080px shell",
    );
    assert.match(
      globalsSource,
      /--evespace-form-max-width:\s*50rem;/,
      "create and post pages should use a compact 800px desktop form rail",
    );
    assert.match(
      globalsSource,
      /\.evespace-shell\s*\{[\s\S]*max-width:\s*var\(--evespace-content-max-width\)/,
      "standard app shell should use the shared rail",
    );
    assert.match(
      globalsSource,
      /\.evespace-content-shell\s*\{[\s\S]*max-width:\s*var\(--evespace-content-max-width\)/,
      "direct page wrappers should have a shared rail utility",
    );
    assert.match(
      globalsSource,
      /\.evespace-form-shell\s*\{[\s\S]*max-width:\s*var\(--evespace-form-max-width\)/,
      "form-heavy create and post pages should have a tighter desktop rail",
    );
    assert.match(
      globalsSource,
      /@media \(min-width: 768px\)[\s\S]*\.memory-board-page-shell\s*\{[\s\S]*max-width:\s*var\(--evespace-content-max-width\)/,
      "memory boards should stop expanding across desktop screens",
    );
    assert.match(
      globalsSource,
      /\.memory-post-create-shell\s*\{[\s\S]*max-width:\s*var\(--evespace-form-max-width\)/,
      "create memory form should use the compact form rail",
    );
    assert.match(privatePostPage, /evespace-form-shell/);
    assert.match(officialPostPage, /evespace-form-shell/);
    assert.match(eventPostPage, /evespace-form-shell/);
    assert.match(
      officialEventCreatePage,
      /redirect\("\/premium\?next=\/official-events\/new"\)/,
      "official event creation should route to the premium placeholder while payments are paused",
    );
    assert.match(boardCreatePage, /evespace-form-shell/);
    assert.match(boardEditPage, /evespace-form-shell/);
    assert.match(profileSource, /evespace-content-shell/);
    assert.match(memoryFormSource, /memory-post-create-shell/);
    assert.doesNotMatch(landingSource, /evespace-content-shell|evespace-shell/);
  });
});
