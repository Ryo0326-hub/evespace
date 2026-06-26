import { readFile } from "node:fs/promises";
import { describe, it } from "node:test";
import assert from "node:assert/strict";

describe("dashboard section headers", () => {
  it("keeps category headers minimal without per-section action buttons", async () => {
    const source = await readFile("app/dashboard/page.tsx", "utf8");

    assert.doesNotMatch(source, />\s*New Board\s*</);
    assert.doesNotMatch(source, />\s*View Friends\s*</);
    assert.doesNotMatch(source, />\s*Host Event\s*</);
  });

  it("uses one compact one-line title style for dashboard categories", async () => {
    const source = await readFile("app/dashboard/page.tsx", "utf8");

    const titleMatches = source.match(/className="dashboard-section-title"/g) ?? [];

    assert.equal(titleMatches.length, 3);
  });
});
