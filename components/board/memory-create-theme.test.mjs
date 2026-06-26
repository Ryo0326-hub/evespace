import { readFile } from "node:fs/promises";
import { describe, it } from "node:test";
import assert from "node:assert/strict";

const postRouteThemes = [
  {
    path: "app/boards/[boardId]/post/page.tsx",
    themeSource: /getBoardTheme\(board\.boardBackgroundTheme\)/,
  },
  {
    path: "app/events/[eventSlug]/post/page.tsx",
    themeSource: /getBoardTheme\(event\.boardBackgroundTheme\)/,
  },
  {
    path: "app/official-events/[id]/post/page.tsx",
    themeSource: /getBoardTheme\(event\.boardBackgroundTheme\)/,
  },
];

describe("memory create and edit themed surfaces", () => {
  it("uses the selected board theme on every create memory page", async () => {
    for (const { path, themeSource } of postRouteThemes) {
      const source = await readFile(path, "utf8");

      assert.match(source, /import \{ getBoardTheme \} from "@\/lib\/board-themes";/);
      assert.match(source, themeSource, `${path} should read the saved board theme`);
      assert.match(
        source,
        /\$\{background\.pageClassName\} memory-create-page/,
        `${path} should apply the saved theme class to the create memory surface`,
      );
    }
  });

  it("derives create-page surfaces and primary buttons from theme variables", async () => {
    const cssSource = await readFile("app/globals.css", "utf8");

    assert.match(
      cssSource,
      /\.memory-create-page\s*\{[\s\S]*var\(--board-page-bg/,
      "create memory page background should come from the selected board theme",
    );
    assert.doesNotMatch(
      cssSource,
      /\.memory-create-page\s*\{[\s\S]*--board-primary-bg:\s*#beddc0/,
      "create memory page should not replace selected theme button colors",
    );
    assert.match(
      cssSource,
      /\.memory-scrapbook-submit,[\s\S]*\.memory-board-cute-button\s*\{[\s\S]*background:\s*var\(--board-primary-bg/,
      "post and edit primary buttons should use selected theme button colors",
    );
    assert.doesNotMatch(
      cssSource,
      /\.memory-scrapbook-submit,\s*\n\.memory-board-cute-button\s*\{[\s\S]*background:\s*#a44f31/,
      "post and edit primary buttons should not use the old fixed orange",
    );
  });
});
