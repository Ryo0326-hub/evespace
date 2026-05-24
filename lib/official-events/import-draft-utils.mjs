export const MAX_OFFICIAL_EVENT_IMPORT_FILE_BYTES = 10 * 1024 * 1024;

export const SUPPORTED_OFFICIAL_EVENT_IMPORT_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const SUPPORTED_OFFICIAL_EVENT_IMPORT_EXTENSIONS = new Set([
  ".jpeg",
  ".jpg",
  ".pdf",
  ".png",
  ".webp",
]);

const NON_HTML_IMPORT_EXTENSIONS = new Set([
  ".avi",
  ".css",
  ".csv",
  ".doc",
  ".docx",
  ".gif",
  ".ics",
  ".jpeg",
  ".jpg",
  ".js",
  ".json",
  ".mov",
  ".mp3",
  ".mp4",
  ".pdf",
  ".png",
  ".ppt",
  ".pptx",
  ".svg",
  ".webp",
  ".xls",
  ".xlsx",
  ".zip",
]);

export const OFFICIAL_EVENT_IMPORT_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "title",
    "description",
    "category",
    "eventWebsiteUrl",
    "locationName",
    "locationAddress",
    "googleMapsUrl",
    "accessInformation",
    "scheduleItems",
    "goodsServices",
    "sponsors",
    "warnings",
  ],
  properties: {
    title: { type: ["string", "null"] },
    description: { type: ["string", "null"] },
    category: { type: ["string", "null"] },
    eventWebsiteUrl: { type: ["string", "null"] },
    locationName: { type: ["string", "null"] },
    locationAddress: { type: ["string", "null"] },
    googleMapsUrl: { type: ["string", "null"] },
    accessInformation: { type: ["string", "null"] },
    scheduleItems: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "title",
          "description",
          "scheduleDate",
          "startTime",
          "endTime",
          "startClockTime",
          "endClockTime",
          "locationLabel",
        ],
        properties: {
          title: { type: ["string", "null"] },
          description: { type: ["string", "null"] },
          scheduleDate: { type: ["string", "null"] },
          startTime: { type: ["string", "null"] },
          endTime: { type: ["string", "null"] },
          startClockTime: { type: ["string", "null"] },
          endClockTime: { type: ["string", "null"] },
          locationLabel: { type: ["string", "null"] },
        },
      },
    },
    goodsServices: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "description", "price", "imageUrl", "externalLink"],
        properties: {
          name: { type: ["string", "null"] },
          description: { type: ["string", "null"] },
          price: { type: ["string", "null"] },
          imageUrl: { type: ["string", "null"] },
          externalLink: { type: ["string", "null"] },
        },
      },
    },
    sponsors: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "description", "tier", "logoUrl", "websiteUrl"],
        properties: {
          name: { type: ["string", "null"] },
          description: { type: ["string", "null"] },
          tier: { type: ["string", "null"] },
          logoUrl: { type: ["string", "null"] },
          websiteUrl: { type: ["string", "null"] },
        },
      },
    },
    warnings: {
      type: "array",
      items: { type: "string" },
    },
  },
};

export function buildOfficialEventImportPrompt(sourceDescription) {
  return [
    "Extract a compact EveSpace official event draft from the provided source.",
    `Source: ${sourceDescription}.`,
    "Return only schema fields as JSON.",
    "Use null when a value is missing or uncertain.",
    "For schedules, always fill scheduleDate as YYYY-MM-DD when a date can be inferred.",
    "Fill startClockTime/endClockTime in 24-hour HH:mm when a clock time can be inferred.",
    "Fill startTime/endTime as YYYY-MM-DDTHH:mm when exact full date-times are already clear.",
    "Extract goods/services such as vendors, merch, food stalls, booths, paid activities, or sponsor offers.",
    "Extract sponsors and partners separately from goods/services. Include sponsor tiers and logo URLs when clear.",
    "Add brief warnings for uncertain dates, partial schedules, unclear prices, or fields needing host review.",
  ].join("\n");
}

export function cleanImportedOfficialEventDraft(raw) {
  const record = isRecord(raw) ? raw : {};

  return {
    title: cleanText(record.title, 100),
    description: cleanText(record.description, 5000),
    category: cleanText(record.category, 120),
    eventWebsiteUrl: cleanText(record.eventWebsiteUrl, 500),
    locationName: cleanText(record.locationName, 200),
    locationAddress: cleanText(record.locationAddress, 500),
    googleMapsUrl: cleanText(record.googleMapsUrl, 500),
    accessInformation: cleanText(record.accessInformation, 3000),
    scheduleItems: cleanArray(record.scheduleItems)
      .map((item) => cleanScheduleItem(item))
      .filter((item) => item.title),
    goodsServices: cleanArray(record.goodsServices)
      .map((item) => cleanGoodsService(item))
      .filter((item) => item.name),
    sponsors: cleanArray(record.sponsors)
      .map((item) => cleanSponsor(item))
      .filter((item) => item.name),
    warnings: cleanArray(record.warnings)
      .map((warning) => cleanText(warning, 220))
      .filter(Boolean),
  };
}

export function isSupportedOfficialEventImportFile(fileName, mimeType, byteSize) {
  if (byteSize > MAX_OFFICIAL_EVENT_IMPORT_FILE_BYTES) {
    return false;
  }

  const normalizedMimeType = String(mimeType ?? "").toLowerCase();

  if (SUPPORTED_OFFICIAL_EVENT_IMPORT_MIME_TYPES.has(normalizedMimeType)) {
    return true;
  }

  const normalizedName = String(fileName ?? "").toLowerCase();
  const extension = normalizedName.match(/\.[a-z0-9]+$/)?.[0] ?? "";
  return SUPPORTED_OFFICIAL_EVENT_IMPORT_EXTENSIONS.has(extension);
}

export function isPublicHttpUrl(value) {
  try {
    const url = new URL(String(value ?? ""));
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return false;
    }

    const hostname = url.hostname.toLowerCase();
    if (
      hostname === "localhost" ||
      hostname.endsWith(".localhost") ||
      hostname === "0.0.0.0" ||
      hostname.startsWith("127.") ||
      hostname.startsWith("10.") ||
      hostname.startsWith("192.168.") ||
      /^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname)
    ) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

export function cleanWebsiteText(html, maxLength = 24_000) {
  const withoutScripts = String(html ?? "")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, " ");
  const text = decodeHtmlEntities(withoutScripts.replace(/<[^>]+>/g, " "));
  return text.replace(/\s+/g, " ").trim().slice(0, maxLength);
}

export function normalizeWebsiteImportUrl(value, baseUrl = undefined) {
  try {
    const url = new URL(String(value ?? ""), baseUrl);

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null;
    }

    url.hash = "";

    if ((url.pathname === "/" || url.pathname === "") && url.search === "") {
      return `${url.origin}/`;
    }

    return url.toString();
  } catch {
    return null;
  }
}

export function normalizeSameSiteImportUrl(value, pageUrl, rootUrl) {
  const normalized = normalizeWebsiteImportUrl(value, pageUrl);
  const root = normalizeWebsiteImportUrl(rootUrl);

  if (!normalized || !root) {
    return null;
  }

  const nextUrl = new URL(normalized);
  const rootUrlObject = new URL(root);

  if (nextUrl.origin !== rootUrlObject.origin) {
    return null;
  }

  const lastPathSegment = nextUrl.pathname.split("/").pop() ?? "";
  const extension = lastPathSegment.match(/\.[a-z0-9]+$/i)?.[0]?.toLowerCase();

  if (extension && NON_HTML_IMPORT_EXTENSIONS.has(extension)) {
    return null;
  }

  return nextUrl.toString();
}

export function extractSameSiteLinks(html, pageUrl, rootUrl) {
  const links = new Set();
  const currentUrl = normalizeWebsiteImportUrl(pageUrl);
  const hrefPattern = /\bhref\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s>]+))/gi;
  let match;

  while ((match = hrefPattern.exec(String(html ?? "")))) {
    const href = match[1] ?? match[2] ?? match[3] ?? "";
    const normalized = normalizeSameSiteImportUrl(href, pageUrl, rootUrl);

    if (normalized && normalized !== currentUrl) {
      links.add(normalized);
    }
  }

  return [...links].sort();
}

export function extractWebsitePageTitle(html) {
  const title = String(html ?? "").match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1];
  return cleanText(cleanWebsiteText(title ?? "", 180), 180);
}

export function extractWebsiteHeadings(html, maxCount = 12) {
  const headings = [];
  const headingPattern = /<h[1-3]\b[^>]*>([\s\S]*?)<\/h[1-3]>/gi;
  let match;

  while ((match = headingPattern.exec(String(html ?? ""))) && headings.length < maxCount) {
    const heading = cleanText(cleanWebsiteText(match[1] ?? "", 160), 160);

    if (heading && !headings.includes(heading)) {
      headings.push(heading);
    }
  }

  return headings;
}

export function extractWebsiteImageCandidates(html, pageUrl, maxCount = 80) {
  const candidates = new Map();
  const tags = [
    ...String(html ?? "").matchAll(/<meta\b[^>]*>/gi),
    ...String(html ?? "").matchAll(/<img\b[^>]*>/gi),
  ];

  for (const tagMatch of tags) {
    const tag = tagMatch[0] ?? "";
    const attributes = readHtmlAttributes(tag);
    const source =
      attributes.src ??
      attributes["data-src"] ??
      attributes["data-lazy-src"] ??
      attributes.content;
    const url = normalizeWebsiteImportUrl(source, pageUrl);

    if (!url) {
      continue;
    }

    const label = cleanText(
      attributes.alt ??
        attributes.title ??
        attributes["aria-label"] ??
        attributes.property ??
        attributes.name ??
        "",
      180,
    );
    const sourcePageUrl = normalizeWebsiteImportUrl(pageUrl) ?? pageUrl;
    const sponsorish = isSponsorImageCandidate(url, label);

    if (!candidates.has(url)) {
      candidates.set(url, {
        url,
        alt: label,
        sourcePageUrl,
        sponsorish,
      });
    }
  }

  return [...candidates.values()]
    .sort((a, b) => Number(b.sponsorish) - Number(a.sponsorish) || a.url.localeCompare(b.url))
    .slice(0, maxCount);
}

/**
 * @param {{
 *   rootUrl: string;
 *   pages: Array<{ url: string; title: string | null; headings: string[]; text: string }>;
 *   imageCandidates?: Array<{ url: string; alt: string | null; sourcePageUrl: string; sponsorish: boolean }>;
 *   crawlWarnings?: string[];
 * }} input
 */
export function buildCrawledWebsiteImportPrompt({
  rootUrl,
  pages,
  imageCandidates = [],
  crawlWarnings = [],
}) {
  const pageBlocks = cleanArray(pages)
    .map((page, index) => {
      const headings = cleanArray(page.headings).filter(Boolean).join(" | ");
      return [
        `Page ${index + 1}`,
        `URL: ${page.url ?? ""}`,
        `Title: ${page.title ?? ""}`,
        headings ? `Headings: ${headings}` : null,
        `Text: ${page.text ?? ""}`,
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n\n---\n\n");
  const imageBlock = cleanArray(imageCandidates)
    .map((image, index) => {
      return `${index + 1}. ${image.url}${image.alt ? ` | alt: ${image.alt}` : ""}${
        image.sourcePageUrl ? ` | page: ${image.sourcePageUrl}` : ""
      }`;
    })
    .join("\n");
  const warningBlock = cleanArray(crawlWarnings)
    .map((warning) => `- ${warning}`)
    .join("\n");

  return [
    buildOfficialEventImportPrompt(`full same-site crawl of ${rootUrl}`),
    "Use all provided pages together. Look for event facts across menus, schedule pages, sponsor pages, access pages, vendor pages, and location pages.",
    "If schedules are split into day sections on one page or across several pages, keep each schedule item on the correct calendar date.",
    "For sponsor logos, choose the best matching image URL from the image candidates when possible.",
    warningBlock ? `Crawler warnings to preserve in warnings when relevant:\n${warningBlock}` : null,
    imageBlock ? `Image candidates:\n${imageBlock}` : null,
    `Crawled pages:\n${pageBlocks}`,
  ]
    .filter(Boolean)
    .join("\n\n");
}

export function groupImportedScheduleItemsByDay(items) {
  const groups = new Map();
  const unscheduled = [];

  for (const item of cleanArray(items)) {
    const date = extractDatetimeLocalDate(item?.startTime) ?? extractDatetimeLocalDate(item?.endTime);

    if (!date) {
      unscheduled.push(item);
      continue;
    }

    if (!groups.has(date)) {
      groups.set(date, {
        date,
        label: formatDayLabel(date),
        items: [],
      });
    }

    groups.get(date).items.push(item);
  }

  const dayGroups = [...groups.values()].sort((a, b) => a.date.localeCompare(b.date));

  if (unscheduled.length > 0) {
    dayGroups.push({
      date: null,
      label: "Unscheduled",
      items: unscheduled,
    });
  }

  return dayGroups;
}

function cleanScheduleItem(raw) {
  const record = isRecord(raw) ? raw : {};
  const scheduleDate = cleanDate(
    record.scheduleDate ?? record.date ?? record.dayDate ?? record.eventDate,
  );
  const startTime = cleanDatetimeLocal(record.startTime ?? record.startDateTime);
  const endTime = cleanDatetimeLocal(record.endTime ?? record.endDateTime);

  return {
    title: cleanText(record.title, 150),
    description: cleanText(record.description, 1000),
    startTime:
      startTime ??
      combineDateAndClock(
        scheduleDate,
        record.startClockTime ?? record.startClock ?? record.start ?? record.startTime,
      ),
    endTime:
      endTime ??
      combineDateAndClock(
        scheduleDate,
        record.endClockTime ?? record.endClock ?? record.end ?? record.endTime,
      ),
    locationLabel: cleanText(record.locationLabel, 200),
  };
}

function cleanGoodsService(raw) {
  const record = isRecord(raw) ? raw : {};

  return {
    name: cleanText(record.name, 150),
    description: cleanText(record.description, 1000),
    price: cleanText(record.price, 50),
    imageUrl: cleanText(record.imageUrl, 500),
    externalLink: cleanText(record.externalLink, 500),
  };
}

function cleanSponsor(raw) {
  const record = isRecord(raw) ? raw : {};

  return {
    name: cleanText(record.name, 150),
    description: cleanText(record.description, 1000),
    tier: cleanText(record.tier, 80),
    logoUrl: cleanText(record.logoUrl, 500),
    websiteUrl: cleanText(record.websiteUrl, 500),
  };
}

function readHtmlAttributes(tag) {
  const attributes = {};
  const attributePattern = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g;
  let match;

  while ((match = attributePattern.exec(String(tag ?? "")))) {
    attributes[match[1].toLowerCase()] = decodeHtmlEntities(
      match[2] ?? match[3] ?? match[4] ?? "",
    );
  }

  return attributes;
}

function isSponsorImageCandidate(url, label) {
  return /sponsor|partner|supporter|logo|協賛|スポンサー|パートナー|ロゴ/i.test(
    `${url} ${label ?? ""}`,
  );
}

function cleanArray(value) {
  return Array.isArray(value) ? value : [];
}

function cleanText(value, maxLength) {
  const text = String(value ?? "").replace(/\s+/g, " ").trim();
  return text ? text.slice(0, maxLength) : null;
}

function cleanDatetimeLocal(value) {
  const text = cleanText(value, 40);
  if (!text) {
    return null;
  }

  const match = text.match(/^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2})/);
  return match ? `${match[1]}T${match[2]}` : null;
}

function combineDateAndClock(date, clockValue) {
  const clock = cleanClock(clockValue);
  return date && clock ? `${date}T${clock}` : null;
}

function cleanDate(value) {
  const text = cleanText(value, 40);
  if (!text) {
    return null;
  }

  const isoDate = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoDate) {
    return `${isoDate[1]}-${isoDate[2].padStart(2, "0")}-${isoDate[3].padStart(2, "0")}`;
  }

  const slashDate = text.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})/);
  if (slashDate) {
    return `${slashDate[1]}-${slashDate[2].padStart(2, "0")}-${slashDate[3].padStart(2, "0")}`;
  }

  return null;
}

function cleanClock(value) {
  const text = cleanText(value, 40);
  if (!text) {
    return null;
  }

  const twentyFourHour = text.match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
  if (twentyFourHour) {
    return `${twentyFourHour[1].padStart(2, "0")}:${twentyFourHour[2]}`;
  }

  const twelveHour = text.match(/^(\d{1,2})(?::([0-5]\d))?\s*([ap])\.?m\.?$/i);
  if (!twelveHour) {
    return null;
  }

  const suffix = twelveHour[3].toLowerCase();
  let hour = Number(twelveHour[1]);
  if (hour < 1 || hour > 12) {
    return null;
  }

  if (suffix === "p" && hour !== 12) {
    hour += 12;
  }

  if (suffix === "a" && hour === 12) {
    hour = 0;
  }

  return `${String(hour).padStart(2, "0")}:${twelveHour[2] ?? "00"}`;
}

function extractDatetimeLocalDate(value) {
  const text = cleanDatetimeLocal(value);
  return text?.slice(0, 10) ?? null;
}

function formatDayLabel(date) {
  const [year, month, day] = date.split("-").map(Number);
  const value = new Date(Date.UTC(year, month - 1, day));
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(value);
}

function decodeHtmlEntities(value) {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)));
}

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
