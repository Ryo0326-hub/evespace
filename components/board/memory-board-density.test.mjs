import { access, readFile } from "node:fs/promises";
import { constants } from "node:fs";
import { describe, it } from "node:test";
import assert from "node:assert/strict";

const boardRoutePaths = [
  "app/boards/[boardId]/page.tsx",
  "app/events/[eventSlug]/board/page.tsx",
  "app/official-events/[id]/board/page.tsx",
];

const boardThemes = ["paper", "sage", "sky", "rose", "lavender"];

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
      /\/memory-board-actions\/edit\.png/,
      "memory cards should use the supplied edit icon",
    );
    assert.match(
      cardSource,
      /memory-edit-icon-button/,
      "the edit icon trigger should use its own transparent button style",
    );
    assert.match(
      cardSource,
      /memory-card-action-row[\s\S]*memory-edit-icon-button[\s\S]*memory-delete-icon-button/,
      "the edit icon should render immediately to the left of the delete icon",
    );
    assert.match(
      cardSource,
      /memory-card-icon-button inline-flex size-10[\s\S]*memory-card-icon-image h-7 w-7/,
      "edit and delete controls should share the same button and image sizing classes",
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
      /\.memory-card-icon-button\s*\{[\s\S]*background:\s*transparent/,
      "memory action icon buttons should not draw colored circles behind the supplied icons",
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
      /\.memory-card-push-pin\s*\{[\s\S]*background:[\s\S]*var\(--board-primary-bg/,
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
      /--memory-paper-line-height:\s*2rem;/,
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

  it("lets the empty board sign fill the board width instead of one post column", async () => {
    const interactiveSource = await readFile(
      "components/board/InteractiveMemoryBoard.tsx",
      "utf8",
    );
    const globalsSource = await readFile("app/globals.css", "utf8");

    assert.match(
      interactiveSource,
      /memory-board-empty-state[^"`]*col-span-full[^"`]*w-full/,
      "the empty memory sign should span every memory grid column",
    );
    assert.doesNotMatch(
      interactiveSource,
      /memory-board-empty-state[^"`]*max-w-xl/,
      "the empty memory sign should not be capped to a narrow card width",
    );
    assert.match(
      globalsSource,
      /\.memory-board-empty-state\s*\{[\s\S]*justify-self:\s*stretch;[\s\S]*width:\s*100%;/,
      "the themed empty memory sign should stretch to the available board width",
    );
  });

  it("serves the supplied delete icon for memory post delete controls", async () => {
    await assert.doesNotReject(
      access("public/memory-board-actions/delete.png", constants.R_OK),
      "delete memory icon should be copied into public assets",
    );
  });

  it("serves the supplied edit icon for memory post edit controls", async () => {
    await assert.doesNotReject(
      access("public/memory-board-actions/edit.png", constants.R_OK),
      "edit memory icon should be copied into public assets",
    );
  });

  it("serves the supplied paper texture for message paper", async () => {
    await assert.doesNotReject(
      access("public/textures/paper-texture.avif", constants.R_OK),
      "paper texture should be copied into public assets",
    );
  });

  it("centers push pins near the card top and renders them as realistic small push pins", async () => {
    const cardSource = await readFile("components/board/MemoryCard.tsx", "utf8");
    const globalsSource = await readFile("app/globals.css", "utf8");

    assert.match(
      cardSource,
      /type MemoryAttachmentStyle = "tape" \| "pin"/,
      "pinned memory cards should use one centered pin style",
    );
    assert.match(
      cardSource,
      /"memory-card-push-pin memory-card-push-pin-center"/,
      "the push pin should render in the middle of the card instead of on the left or right",
    );
    assert.doesNotMatch(
      cardSource,
      /memory-card-push-pin-left|memory-card-push-pin-right/,
      "push pins should not use side-specific placement classes",
    );
    assert.match(
      globalsSource,
      /--memory-card-pin-center-y:\s*1\.05rem;/,
      "push pin center should sit slightly above the date row so it looks pinned through the paper edge",
    );
    assert.match(
      globalsSource,
      /\.memory-card-push-pin-center\s*\{[\s\S]*left:\s*50%;[\s\S]*transform:\s*translate\(-50%,\s*-50%\);/,
      "centered push pin should be horizontally centered and positioned by its center point",
    );
    assert.match(
      globalsSource,
      /\.memory-card-push-pin\s*\{[\s\S]*--memory-card-pin-cap:[\s\S]*#f04f98[\s\S]*radial-gradient/,
      "push pin should use a brighter memorial-style cap instead of blending into the brown board theme",
    );
    assert.match(
      globalsSource,
      /\.memory-card-push-pin::before\s*\{[\s\S]*border-radius:\s*0 0 0\.18rem 0\.18rem;[\s\S]*transform:\s*translateX\(-50%\);/,
      "push pin should include a tiny stem below the glossy cap",
    );
    assert.match(
      globalsSource,
      /\.memory-card-push-pin::after\s*\{[\s\S]*inset:\s*0\.36rem;/,
      "push pin should have a recessed center dimple",
    );
    assert.match(
      globalsSource,
      /\.memory-card-push-pin::after\s*\{[\s\S]*box-shadow:\s*inset/,
      "push pin should have a recessed center dimple",
    );
  });

  it("omits the paper message card for photo-only memories", async () => {
    const cardSource = await readFile("components/board/MemoryCard.tsx", "utf8");
    const globalsSource = await readFile("app/globals.css", "utf8");

    assert.match(
      cardSource,
      /const hasMessage = \(post\.caption\?\.trim\(\)\.length \?\? 0\) > 0;/,
      "memory cards should distinguish empty legacy captions from real messages",
    );
    assert.match(
      cardSource,
      /\{hasMessage \? \(/,
      "photo-only memories should skip the message paper block entirely",
    );
    assert.doesNotMatch(
      cardSource,
      /memory-post-message-note-empty/,
      "photo-only memories should not render a special empty paper note",
    );
    assert.doesNotMatch(
      cardSource,
      /hasMessage \? post\.caption : ""/,
      "photo-only memories should not render a blank message paragraph",
    );
    assert.doesNotMatch(
      globalsSource,
      /\.memory-post-message-note-empty\s*\{/,
      "the empty paper note style should be removed",
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

  it("keeps small posted photos in compact contained frames", async () => {
    const cardSource = await readFile("components/board/MemoryCard.tsx", "utf8");
    const globalsSource = await readFile("app/globals.css", "utf8");

    assert.match(
      cardSource,
      /className="memory-post-image"/,
      "posted memory photos should use a dedicated image class instead of full-width crop utilities",
    );
    assert.doesNotMatch(
      cardSource,
      /aspect-\[4\/3\]|object-cover|w-full object-cover/,
      "posted memory photos should not force small images into a cropped full-width frame",
    );
    assert.match(
      globalsSource,
      /\.memory-post-media\s*\{[\s\S]*display:\s*flex;[\s\S]*width:\s*fit-content;[\s\S]*max-width:\s*100%;/,
      "posted photo frames should shrink to the rendered image while staying within the card",
    );
    assert.match(
      globalsSource,
      /\.memory-post-image\s*\{[\s\S]*height:\s*auto;[\s\S]*max-height:\s*22rem;[\s\S]*object-fit:\s*contain;[\s\S]*width:\s*auto;/,
      "posted photos should preserve the whole image without upscaling small uploads into a large box",
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

  it("renders memory board hero banners as crisp CSS scrapbook panels", async () => {
    const globalsSource = await readFile("app/globals.css", "utf8");

    for (const theme of boardThemes) {
      assert.match(
        globalsSource,
        new RegExp(`\\.theme-page-${theme},[\\s\\S]*--board-hero-paper:`),
        `${theme} should expose a themed paper color for the hero banner`,
      );
      assert.match(
        globalsSource,
        new RegExp(`\\.theme-page-${theme},[\\s\\S]*--board-hero-stitch:`),
        `${theme} should expose a themed stitched detail color for the hero banner`,
      );
      assert.match(
        globalsSource,
        new RegExp(`\\.theme-page-${theme},[\\s\\S]*--board-hero-tape:`),
        `${theme} should expose a themed tape color for the hero banner`,
      );
    }

    assert.doesNotMatch(
      globalsSource,
      /brush-strokes|--board-hero-brush-image/,
      "the board hero should not depend on low-resolution brush stroke image assets",
    );
    assert.match(
      globalsSource,
      /\.memory-board-title-card\s*\{[\s\S]*width:\s*100%;[\s\S]*background:[\s\S]*var\(--board-hero-paper/,
      "the board hero should render as a full-width themed paper panel",
    );
    assert.doesNotMatch(
      globalsSource,
      /\) :is\(\.memory-board-title-card, \.memory-board-form, \[data-memory-card-id\]\)/,
      "theme card overrides should not flatten the scrapbook hero back into a rectangular surface",
    );
    assert.match(
      globalsSource,
      /\.memory-board-title-card\s*\{[\s\S]*overflow:\s*hidden;[\s\S]*isolation:\s*isolate;/,
      "the board hero should contain its craft details inside the original banner area",
    );
    assert.match(
      globalsSource,
      /\.memory-board-title-card::before\s*\{[\s\S]*border:\s*2px dashed var\(--board-hero-stitch[\s\S]*radial-gradient[\s\S]*repeating-linear-gradient/,
      "the board hero should use CSS stitches and paper grain instead of raster paint",
    );
    assert.match(
      globalsSource,
      /\.memory-board-title-card::after\s*\{[\s\S]*linear-gradient[\s\S]*background-size:[\s\S]*clamp\([\s\S]*filter:\s*drop-shadow/,
      "the board hero should use responsive CSS tape tabs for scrapbook craft detail",
    );
    assert.doesNotMatch(
      globalsSource,
      /\.memory-board-title-card::(?:before|after)\s*\{[\s\S]*clip-path:\s*polygon/,
      "the title banner should not fake craft edges with fragile CSS polygons",
    );
    assert.match(
      globalsSource,
      /\.memory-board-title-card > \*\s*\{[\s\S]*position:\s*relative;[\s\S]*z-index:\s*2;/,
      "all hero text should stay layered above the decorative paint stroke",
    );
  });

  it("uses the Kaito scrapbook font for memory board titles without an underline", async () => {
    const [layoutSource, globalsSource] = await Promise.all([
      readFile("app/layout.tsx", "utf8"),
      readFile("app/globals.css", "utf8"),
    ]);

    await assert.doesNotReject(
      access("app/fonts/PolandCannedIntoKaito-j9OjM.ttf", constants.R_OK),
      "the Poland canned into Kaito font should be self-hosted as a local app font",
    );
    assert.match(
      layoutSource,
      /import localFont from "next\/font\/local";/,
      "the custom title font should use Next's local font loader",
    );
    assert.match(
      layoutSource,
      /const polandKaito = localFont\(\{[\s\S]*src:\s*"\.\/fonts\/PolandCannedIntoKaito-j9OjM\.ttf"[\s\S]*variable:\s*"--font-poland-kaito"[\s\S]*display:\s*"swap"/,
      "the Kaito font should be exposed as a CSS variable with swap loading",
    );
    assert.match(
      layoutSource,
      /className=\{`\$\{geistSans\.variable\} \$\{geistMono\.variable\} \$\{polandKaito\.variable\} h-full antialiased`\}/,
      "the title font variable should be available globally",
    );
    assert.match(
      globalsSource,
      /\.memory-board-title-mark\s*\{[\s\S]*font-family:\s*var\(--font-poland-kaito\), var\(--font-geist-sans\), Arial, sans-serif;/,
      "memory board titles should use the Kaito scrapbook font with a readable fallback stack",
    );
    assert.match(
      globalsSource,
      /\.memory-board-title-mark\s*\{[\s\S]*background:\s*none;/,
      "the old title underline should be removed",
    );
    assert.match(
      globalsSource,
      /\.memory-board-title-mark\s*\{[\s\S]*line-height:\s*0\.92;/,
      "the decorative font should keep a tight display line-height",
    );
  });
});
