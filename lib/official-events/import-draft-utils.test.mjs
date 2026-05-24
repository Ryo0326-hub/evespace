import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildCrawledWebsiteImportPrompt,
  cleanImportedOfficialEventDraft,
  cleanWebsiteText,
  extractSameSiteLinks,
  extractWebsiteImageCandidates,
  groupImportedScheduleItemsByDay,
  isSupportedOfficialEventImportFile,
} from "./import-draft-utils.mjs";

describe("official event import draft utilities", () => {
  it("normalizes imported fields and trims empty schedule and goods rows", () => {
    const draft = cleanImportedOfficialEventDraft({
      title: "  Night Market  ",
      description: "  A community event with food, music, and booths.  ",
      category: "",
      eventWebsiteUrl: " https://example.com/event ",
      locationName: "  Main Quad ",
      scheduleItems: [
        { title: " Opening ", startTime: "2026-07-01T10:00", description: " Welcome " },
        { title: "   ", description: "No title means discard" },
      ],
      goodsServices: [
        { name: " Stickers ", price: "$5", externalLink: " https://example.com/shop " },
        { name: "", description: "No name means discard" },
      ],
      sponsors: [
        {
          name: " Campus Radio ",
          tier: "Gold",
          logoUrl: " https://example.com/radio.png ",
          websiteUrl: " https://example.com/radio ",
        },
        { name: "", description: "No name means discard" },
      ],
      warnings: ["  Double check times  ", ""],
    });

    assert.equal(draft.title, "Night Market");
    assert.equal(draft.category, null);
    assert.equal(draft.eventWebsiteUrl, "https://example.com/event");
    assert.equal(draft.locationName, "Main Quad");
    assert.deepEqual(draft.scheduleItems, [
      {
        title: "Opening",
        description: "Welcome",
        startTime: "2026-07-01T10:00",
        endTime: null,
        locationLabel: null,
      },
    ]);
    assert.deepEqual(draft.goodsServices, [
      {
        name: "Stickers",
        description: null,
        price: "$5",
        imageUrl: null,
        externalLink: "https://example.com/shop",
      },
    ]);
    assert.deepEqual(draft.sponsors, [
      {
        name: "Campus Radio",
        description: null,
        tier: "Gold",
        logoUrl: "https://example.com/radio.png",
        websiteUrl: "https://example.com/radio",
      },
    ]);
    assert.deepEqual(draft.warnings, ["Double check times"]);
  });

  it("accepts only supported schedule import file types within 10 MB", () => {
    assert.equal(isSupportedOfficialEventImportFile("poster.pdf", "application/pdf", 10_000), true);
    assert.equal(isSupportedOfficialEventImportFile("poster.webp", "image/webp", 10_000), true);
    assert.equal(isSupportedOfficialEventImportFile("poster.txt", "text/plain", 10_000), false);
    assert.equal(
      isSupportedOfficialEventImportFile("poster.pdf", "application/pdf", 11 * 1024 * 1024),
      false,
    );
  });

  it("combines imported schedule date and clock fields into datetime-local values", () => {
    const draft = cleanImportedOfficialEventDraft({
      scheduleItems: [
        {
          title: "Opening Ceremony",
          scheduleDate: "2026-10-11",
          startClockTime: "10:00",
          endClockTime: "10:30",
        },
        {
          title: "Evening Showcase",
          scheduleDate: "2026-10-12",
          startClockTime: "5:15 PM",
          endClockTime: "7:00 PM",
        },
      ],
    });

    assert.deepEqual(
      draft.scheduleItems.map((item) => ({
        title: item.title,
        startTime: item.startTime,
        endTime: item.endTime,
      })),
      [
        {
          title: "Opening Ceremony",
          startTime: "2026-10-11T10:00",
          endTime: "2026-10-11T10:30",
        },
        {
          title: "Evening Showcase",
          startTime: "2026-10-12T17:15",
          endTime: "2026-10-12T19:00",
        },
      ],
    );
  });

  it("preserves imported full datetimes and groups multi-day schedules chronologically", () => {
    const draft = cleanImportedOfficialEventDraft({
      scheduleItems: [
        { title: "Day 2 Booths", startTime: "2026-10-12T10:00:00+09:00" },
        { title: "Day 1 Opening", startTime: "2026-10-11T10:00" },
        { title: "Undated Info Session" },
      ],
    });

    assert.deepEqual(
      draft.scheduleItems.map((item) => item.startTime),
      ["2026-10-12T10:00", "2026-10-11T10:00", null],
    );
    assert.deepEqual(groupImportedScheduleItemsByDay(draft.scheduleItems), [
      {
        date: "2026-10-11",
        label: "Oct 11, 2026",
        items: [draft.scheduleItems[1]],
      },
      {
        date: "2026-10-12",
        label: "Oct 12, 2026",
        items: [draft.scheduleItems[0]],
      },
      {
        date: null,
        label: "Unscheduled",
        items: [draft.scheduleItems[2]],
      },
    ]);
  });

  it("cleans website HTML into compact readable text", () => {
    const text = cleanWebsiteText(`
      <html>
        <head><style>.x{color:red}</style><script>alert(1)</script></head>
        <body>
          <h1>Festival &amp; Market</h1>
          <p>Food booths<br>Live music</p>
        </body>
      </html>
    `);

    assert.equal(text, "Festival & Market Food booths Live music");
  });

  it("extracts deterministic same-site crawl links and excludes external assets", () => {
    const links = extractSameSiteLinks(
      `
        <a href="/schedule">Schedule</a>
        <a href="https://events.example.edu/sponsors?level=gold#top">Sponsors</a>
        <a href="https://external.example.com/vendors">External</a>
        <a href="/poster.pdf">PDF</a>
        <a href="mailto:hello@example.edu">Mail</a>
      `,
      "https://events.example.edu/festival/",
      "https://events.example.edu/festival/",
    );

    assert.deepEqual(links, [
      "https://events.example.edu/schedule",
      "https://events.example.edu/sponsors?level=gold",
    ]);
  });

  it("extracts sponsor-looking image candidates for website import prompts", () => {
    const candidates = extractWebsiteImageCandidates(
      `
        <meta property="og:image" content="/hero.png">
        <img src="/logos/acme.png" alt="Acme sponsor logo">
        <img src="/map.png" alt="Campus map">
      `,
      "https://events.example.edu/festival/",
    );

    assert.equal(candidates[0].url, "https://events.example.edu/logos/acme.png");
    assert.equal(candidates[0].sponsorish, true);
    assert.equal(candidates.some((candidate) => candidate.url.endsWith("/hero.png")), true);
  });

  it("builds a multi-page website prompt packet in page order", () => {
    const prompt = buildCrawledWebsiteImportPrompt({
      rootUrl: "https://events.example.edu/festival/",
      pages: [
        {
          url: "https://events.example.edu/festival/",
          title: "Festival",
          headings: ["Welcome"],
          text: "Main event information.",
        },
        {
          url: "https://events.example.edu/festival/sponsors",
          title: "Sponsors",
          headings: ["Gold Sponsors"],
          text: "Acme supports the event.",
        },
      ],
      imageCandidates: [
        {
          url: "https://events.example.edu/acme.png",
          alt: "Acme logo",
          sourcePageUrl: "https://events.example.edu/festival/sponsors",
          sponsorish: true,
        },
      ],
      crawlWarnings: ["Crawl stopped after 2 readable pages."],
    });

    assert.match(prompt, /Page 1\nURL: https:\/\/events\.example\.edu\/festival\//);
    assert.match(prompt, /Page 2\nURL: https:\/\/events\.example\.edu\/festival\/sponsors/);
    assert.match(prompt, /Image candidates:\n1\. https:\/\/events\.example\.edu\/acme\.png/);
    assert.match(prompt, /Crawl stopped after 2 readable pages\./);
  });
});
