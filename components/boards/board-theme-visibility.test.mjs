import { readFile } from "node:fs/promises";
import { describe, it } from "node:test";
import assert from "node:assert/strict";

describe("shared board theme visibility", () => {
  it("uses the saved private memory board theme for every viewer allowed to open the board", async () => {
    const source = await readFile("app/boards/[boardId]/page.tsx", "utf8");

    assert.match(
      source,
      /const background = getBoardTheme\(board\.boardBackgroundTheme\);/,
      "private memory board pages should render the saved theme after access checks pass",
    );
    assert.doesNotMatch(
      source,
      /viewerOwnsBoard|DEFAULT_BOARD_THEME/,
      "private memory board pages should not reset non-owner or signed-out viewers to the default theme",
    );
  });

  it("keeps friends feed cards on each board's saved theme", async () => {
    const source = await readFile("components/boards/FriendsBoardsFeed.tsx", "utf8");

    assert.doesNotMatch(
      source,
      /themeOverride=/,
      "shared board cards should not override friends' saved themes to a default theme",
    );
    assert.match(
      source,
      /<DashboardBoardCard\s+board=\{board\}\s+canEdit=\{false\}/,
      "friend board cards should let DashboardBoardCard read board.boardBackgroundTheme",
    );
  });

  it("renders dashboard board previews as glossy glass cards with theme color accents", async () => {
    const [cardSource, cssSource] = await Promise.all([
      readFile("components/boards/DashboardBoardCard.tsx", "utf8"),
      readFile("app/globals.css", "utf8"),
    ]);

    assert.match(cardSource, /dashboard-board-card/);
    assert.match(cardSource, /dashboard-board-preview/);
    assert.match(cardSource, /dashboard-board-preview-sheen/);
    assert.match(cardSource, /dashboard-board-theme-wash/);
    assert.match(cardSource, /background\.boardClassName/);
    assert.match(cardSource, /background\.previewClassName/);
    assert.match(cardSource, /dashboard-board-action/);
    assert.doesNotMatch(cardSource, /border-\[3px\][^"]*border-black/);
    assert.doesNotMatch(cardSource, /shadow-\[8px_8px_0/);
    assert.doesNotMatch(cardSource, /memory-board-cute-button|memory-board-soft-button/);
    assert.match(
      cssSource,
      /\.dashboard-board-card\s*\{[\s\S]*backdrop-filter:\s*blur\(/,
      "dashboard board previews should use the app's glossy glass treatment",
    );
    assert.match(
      cssSource,
      /\.dashboard-board-card\s*\{[\s\S]*var\(--board-primary-bg/,
      "dashboard board previews should tint their glow with the selected board theme",
    );
    assert.match(
      cssSource,
      /\.dashboard-board-preview\s*\{[\s\S]*var\(--board-primary-bg/,
      "dashboard board preview marker should use the selected board theme color",
    );
    assert.match(
      cssSource,
      /\.dashboard-board-action\s*\{[\s\S]*background:\s*rgba\(15,\s*23,\s*42,\s*0\.72\)/,
      "card action buttons should match the dashboard's dark glossy button style",
    );
  });
});
