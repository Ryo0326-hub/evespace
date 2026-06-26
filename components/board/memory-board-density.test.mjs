import { access, readFile } from "node:fs/promises";
import { constants } from "node:fs";
import { describe, it } from "node:test";
import assert from "node:assert/strict";

const boardRoutePaths = [
  "app/boards/[boardId]/page.tsx",
  "app/events/[eventSlug]/board/page.tsx",
  "app/official-events/[id]/board/page.tsx",
];

describe("memory board dense layout", () => {
  it("does not render a title-like author line on memory posts", async () => {
    const source = await readFile("components/board/MemoryCard.tsx", "utf8");

    assert.doesNotMatch(
      source,
      /post\.authorDisplayName\s*\|\|\s*"Anonymous"/,
      "memory cards should not show the old title-like post heading",
    );
  });

  it("keeps the board grid tight while rendering scrapbook paper cards", async () => {
    const boardSource = await readFile("components/board/MemoryBoard.tsx", "utf8");
    const cardSource = await readFile("components/board/MemoryCard.tsx", "utf8");
    const interactiveSource = await readFile(
      "components/board/InteractiveMemoryBoard.tsx",
      "utf8",
    );
    const globalsSource = await readFile("app/globals.css", "utf8");

    assert.match(boardSource, /grid min-w-0 max-w-full gap-2 overflow-x-clip/);
    assert.match(
      cardSource,
      /memory-post-message-note/,
      "memory post cards should render the message as a paper note",
    );
    assert.match(
      cardSource,
      /!hasPhoto[\s\S]*data-sticker-layer-for=\{post\.id\}/,
      "message-only memories should expose the paper note as the sticker drop layer",
    );
    assert.doesNotMatch(
      cardSource,
      /border-\[3px\][^"]*border-black/,
      "memory post cards should not use the old bold black border",
    );
    assert.match(
      cardSource,
      /\/memory-board-actions\/delete\.png/,
      "memory cards should use the supplied delete icon instead of a text x",
    );
    assert.match(
      cardSource,
      /memory-delete-icon-button/,
      "the delete icon trigger should use its own transparent button style",
    );
    assert.doesNotMatch(
      cardSource,
      /memory-board-danger-button inline-flex size-9/,
      "the delete icon trigger should not reuse the red danger button background",
    );
    assert.match(
      globalsSource,
      /\.memory-delete-icon-button\s*\{[\s\S]*background:\s*transparent/,
      "the delete icon button should not draw a colored circle behind the supplied icon",
    );
    assert.match(
      cardSource,
      /memory-card-tape memory-card-tape-top-center/,
      "memory cards that use tape should render one centered tape strip",
    );
    assert.doesNotMatch(
      cardSource,
      /memory-card-tape memory-card-tape-top-left|memory-card-tape memory-card-tape-top-right/,
      "memory cards should not render two tape strips",
    );
    assert.match(
      globalsSource,
      /\.memory-card-tape-top-center\s*\{[\s\S]*left:\s*50%;[\s\S]*top:\s*-\d/,
      "center tape should overlap above the card edge",
    );
    assert.match(
      globalsSource,
      /\.memory-card-push-pin\s*\{[\s\S]*background:\s*var\(--board-primary-bg/,
      "push pins should use the selected theme color",
    );
    assert.match(
      cardSource,
      /getMemoryAttachmentStyle\(post\.id\)/,
      "some memories should deterministically use push pins instead of tape",
    );
    assert.doesNotMatch(
      cardSource,
      /memory-post-card[^"]*overflow-hidden/,
      "memory cards should not clip attachments that overlap the card edge",
    );
    assert.match(
      cardSource,
      /paperClassName,\s*\n\s*penClassName/,
      "posted messages should keep the selected paper and pen classes from the create form",
    );
    assert.match(
      globalsSource,
      /\.memory-message-paper,\s*\n\.memory-post-message-note\s*\{[\s\S]*border-color:\s*var\(--memory-paper-border\)[\s\S]*background-color:\s*var\(--memory-paper-bg\)/,
      "posted message paper should use the same paper variables as the create page textarea",
    );
    assert.match(
      globalsSource,
      /url\("\/textures\/paper-texture\.avif"\)/,
      "message paper should layer in the supplied paper texture asset",
    );
    assert.match(
      globalsSource,
      /\.memory-message-paper::before,\s*\n\.memory-post-message-note::before\s*\{[\s\S]*mix-blend-mode:\s*multiply/,
      "message paper should use a subtle multiply texture layer instead of a flat fill",
    );
    assert.match(
      globalsSource,
      /\.memory-message-paper::after,\s*\n\.memory-post-message-note::after\s*\{[\s\S]*background:[\s\S]*repeating-linear-gradient/,
      "message paper should render lined paper as an overlay above the texture",
    );
    assert.match(
      globalsSource,
      /--memory-paper-line-height:\s*1\.75rem;/,
      "message paper should use one shared line-height token for create and posted messages",
    );
    assert.match(
      globalsSource,
      /\.memory-message-paper,\s*\n\.memory-post-message-note\s*\{[\s\S]*line-height:\s*var\(--memory-paper-line-height\)/,
      "message paper text should align to the paper line grid",
    );
    assert.match(
      globalsSource,
      /background-position:\s*left var\(--memory-paper-line-inset\),\s*center,\s*center;/,
      "create page paper lines should start at the same top inset as the message text",
    );
    assert.doesNotMatch(
      globalsSource,
      /transparent 1\.58rem|1\.64rem|1\.7rem/,
      "paper lines should not use hard-coded offsets that drift through message text",
    );
    assert.doesNotMatch(
      globalsSource,
      /\[data-memory-card-id\]\s*>\s*\.relative\.z-10\.mt-3\s*\{[\s\S]*background:\s*var\(--board-ui-surface-strong/,
      "theme overrides should not flatten posted message paper back into a white board panel",
    );
    assert.doesNotMatch(interactiveSource, /pt-4 sm:pt-6/);
    assert.match(globalsSource, /\.memory-grid\s*\{[\s\S]*gap:\s*var\(--memory-board-mobile-gap,\s*1rem\);/);
    assert.match(
      globalsSource,
      /\.memory-board-main\s*\{[\s\S]*--memory-board-mobile-gap:\s*1rem;/,
      "mobile board spacing should use the larger post-to-post gap as the shared token",
    );
    assert.match(
      globalsSource,
      /@media \(max-width: 767px\)[\s\S]*\.memory-board-content-stack\s*\{[\s\S]*gap:\s*var\(--memory-board-mobile-gap\)/,
      "mobile content stack should use the shared spacing token between banner and posts",
    );
    assert.match(
      globalsSource,
      /\.memory-board-content-stack > \.memory-board-title-card\s*\{[\s\S]*margin-block-start:\s*var\(--memory-board-mobile-gap\) !important;/,
      "mobile banner should use the shared spacing token below the navbar",
    );
    assert.match(
      globalsSource,
      /\.memory-board-main\s*\{[\s\S]*padding-bottom:\s*calc\(var\(--memory-board-mobile-action-height\) \+ var\(--memory-board-mobile-gap\)\) !important;/,
      "mobile bottom padding should leave the shared spacing token above the action bar",
    );
    assert.match(
      globalsSource,
      /\.memory-post-card\[data-memory-card-id\]\s*\{[\s\S]*border-color:\s*rgba\(122,\s*91,\s*73,\s*0\.24\) !important;[\s\S]*border-style:\s*solid !important;/,
      "theme overrides should use the new matte scrapbook card border",
    );
  });

  it("serves the supplied delete icon for memory post delete controls", async () => {
    await assert.doesNotReject(
      access("public/memory-board-actions/delete.png", constants.R_OK),
      "delete memory icon should be copied into public assets",
    );
  });

  it("serves the supplied paper texture for message paper", async () => {
    await assert.doesNotReject(
      access("public/textures/paper-texture.avif", constants.R_OK),
      "paper texture should be copied into public assets",
    );
  });

  it("keeps selected message paper styling after a memory is posted", async () => {
    const cardSource = await readFile("components/board/MemoryCard.tsx", "utf8");
    const globalsSource = await readFile("app/globals.css", "utf8");

    assert.match(
      cardSource,
      /paperClassName,\s*\n\s*penClassName/,
      "posted messages should keep the selected paper and pen classes from the create form",
    );
    assert.match(
      globalsSource,
      /\.memory-message-paper,\s*\n\.memory-post-message-note\s*\{[\s\S]*border-color:\s*var\(--memory-paper-border\)[\s\S]*background-color:\s*var\(--memory-paper-bg\)/,
      "posted message paper should use the same paper variables as the create page textarea",
    );
    assert.match(
      globalsSource,
      /\.memory-message-paper,\s*\n\.memory-post-message-note\s*\{[\s\S]*position:\s*relative[\s\S]*isolation:\s*isolate/,
      "message paper should create a local layering context for paper grain and lines",
    );
    assert.match(
      globalsSource,
      /\.memory-post-message-note > :not\(\.memory-paper-texture-layer\)/,
      "posted message content should remain above the decorative paper texture layers",
    );
    assert.match(
      globalsSource,
      /\.memory-post-message-note > p\s*\{[\s\S]*line-height:\s*inherit/,
      "posted message text should inherit the same line-height as the create page paper",
    );
    assert.doesNotMatch(
      cardSource,
      /leading-7/,
      "posted message markup should not override the shared paper line rhythm",
    );
    assert.doesNotMatch(
      globalsSource,
      /\[data-memory-card-id\]\s*>\s*\.relative\.z-10\.mt-3\s*\{[\s\S]*background:\s*var\(--board-ui-surface-strong/,
      "theme overrides should not flatten posted message paper back into a white board panel",
    );
  });

  it("uses compact page-to-banner spacing on all memory board routes", async () => {
    for (const routePath of boardRoutePaths) {
      const source = await readFile(routePath, "utf8");

      assert.match(
        source,
        /memory-board-main[^"`]*h-\[calc\(100dvh-4rem\)\][^"`]*overflow-y-auto[^"`]*pt-0[^"`]*md:pt-3/,
        `${routePath} should use a scrollable board viewport with the same mobile spacing from navbar to banner as banner to posts`,
      );
      assert.match(
        source,
        /memory-board-title-card[^"`]*mt-0[^"`]*mb-0/,
        `${routePath} should avoid mobile margin collapse around the banner`,
      );
      assert.match(
        source,
        /memory-board-content-stack/,
        `${routePath} should use the mobile content stack gap`,
      );
    }
  });
});
