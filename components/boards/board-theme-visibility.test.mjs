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
});
