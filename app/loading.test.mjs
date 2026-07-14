import { readFile } from "node:fs/promises";
import { describe, it } from "node:test";
import assert from "node:assert/strict";

describe("root loading screen", () => {
  it("shows an accessible flipping hourglass with concise loading text", async () => {
    const [loadingSource, globalsSource] = await Promise.all([
      readFile("app/loading.tsx", "utf8"),
      readFile("app/globals.css", "utf8"),
    ]);

    assert.match(loadingSource, /role="status"/);
    assert.match(loadingSource, /aria-live="polite"/);
    assert.match(loadingSource, /className="loading-hourglass/);
    assert.match(loadingSource, /<span>Loading\.\.<\/span>/);
    assert.doesNotMatch(loadingSource, /Loading this corner of the galaxy/);
    assert.match(
      globalsSource,
      /\.loading-hourglass\s*\{[\s\S]*animation:\s*loading-hourglass-flip/,
    );
    assert.match(
      globalsSource,
      /@keyframes loading-hourglass-flip\s*\{[\s\S]*rotate\(180deg\)[\s\S]*rotate\(360deg\)/,
    );
    assert.match(
      globalsSource,
      /@media \(prefers-reduced-motion: reduce\)\s*\{[\s\S]*\.loading-hourglass\s*\{[\s\S]*animation:\s*none/,
    );
  });
});
