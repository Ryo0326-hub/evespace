import { readFile } from "node:fs/promises";
import { describe, it } from "node:test";
import assert from "node:assert/strict";

describe("board theme registry", () => {
  it("offers exactly five simple single-color memory board themes", async () => {
    const [typesSource, themeSource] = await Promise.all([
      readFile("types/evespace.ts", "utf8"),
      readFile("lib/board-themes.ts", "utf8"),
    ]);

    assert.match(
      typesSource,
      /BoardThemeId\s*=\s*"paper"\s*\|\s*"sage"\s*\|\s*"sky"\s*\|\s*"rose"\s*\|\s*"lavender"/,
      "BoardThemeId should only allow the five simple color themes",
    );
    assert.match(
      themeSource,
      /BOARD_THEME_OPTIONS: BoardThemeId\[\] = \[\s*"paper",\s*"sage",\s*"sky",\s*"rose",\s*"lavender",\s*\]/,
      "theme picker options should be the five new color themes in order",
    );
    assert.doesNotMatch(themeSource, /\b(?:plain|camo|pastel|city|nature):\s*\{/);
  });

  it("styles board themes as coordinated solid color systems", async () => {
    const [cssSource, migrationSource] = await Promise.all([
      readFile("app/globals.css", "utf8"),
      readFile("supabase/migrations/0020_simple_color_board_themes.sql", "utf8"),
    ]);

    for (const theme of ["paper", "sage", "sky", "rose", "lavender"]) {
      assert.match(cssSource, new RegExp(`\\.theme-page-${theme},`));
      assert.match(cssSource, new RegExp(`\\.theme-board-${theme},`));
      assert.match(cssSource, new RegExp(`\\.theme-card-${theme}`));
      assert.match(cssSource, new RegExp(`\\.theme-preview-${theme}`));
      assert.match(cssSource, new RegExp(`\\.theme-nav-${theme}`));
    }

    assert.match(cssSource, /--board-tape-bg:/);
    assert.match(cssSource, /--board-title-mark:/);
    assert.match(cssSource, /--board-primary-bg:/);
    assert.match(cssSource, /\.memory-card-tape[\s\S]*var\(--board-tape-bg/);

    for (const theme of ["paper", "sage", "sky", "rose", "lavender"]) {
      for (const prefix of ["page", "board", "card", "preview"]) {
        const className = `.theme-${prefix}-${theme}`;
        const classIndex = cssSource.indexOf(className);
        assert.notEqual(classIndex, -1, `${className} should exist`);
        const blockStart = cssSource.indexOf("{", classIndex);
        const blockEnd = cssSource.indexOf("}", blockStart);
        const block = cssSource.slice(blockStart, blockEnd);

        assert.doesNotMatch(block, /url\(/, `${className} should not use image assets`);
        assert.doesNotMatch(
          block,
          /(?:radial|linear)-gradient/,
          `${className} should stay a single-color theme block`,
        );
      }
    }

    assert.match(
      migrationSource,
      /check \(board_background_theme in \('paper', 'sage', 'sky', 'rose', 'lavender'\)\)/,
      "database constraint should only allow the five simple color themes",
    );
  });
});
