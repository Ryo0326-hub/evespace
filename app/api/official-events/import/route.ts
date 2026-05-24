import { ensureUserProfile } from "@/lib/auth/ensure-user-profile";
import {
  buildCrawledWebsiteImportPrompt,
  buildOfficialEventImportPrompt,
  cleanImportedOfficialEventDraft,
  cleanWebsiteText,
  extractSameSiteLinks,
  extractWebsiteHeadings,
  extractWebsiteImageCandidates,
  extractWebsitePageTitle,
  isPublicHttpUrl,
  isSupportedOfficialEventImportFile,
  normalizeWebsiteImportUrl,
  OFFICIAL_EVENT_IMPORT_JSON_SCHEMA,
} from "@/lib/official-events/import-draft-utils.mjs";

export const runtime = "nodejs";

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const WEBSITE_FETCH_TIMEOUT_MS = 12_000;
const WEBSITE_PAGE_TEXT_LIMIT = 8_000;
const WEBSITE_TOTAL_TEXT_LIMIT = 120_000;
const WEBSITE_MAX_PAGES = 60;
const WEBSITE_MAX_IMAGE_CANDIDATES = 120;
const DEFAULT_EVENT_IMPORT_MODEL = "gpt-5-mini";
const EVENT_IMPORT_OUTPUT_TOKEN_LIMIT = 4_000;

type ImportContentPart =
  | { type: "input_text"; text: string }
  | { type: "input_file"; filename: string; file_data: string }
  | { type: "input_image"; image_url: string };

type ImportBuildResult = {
  content: ImportContentPart[];
  warnings: string[];
};

export async function POST(request: Request) {
  const profile = await ensureUserProfile();

  if (!profile) {
    return Response.json({ error: "Sign in to import official event details." }, { status: 401 });
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return Response.json(
      { error: "Add OPENAI_API_KEY to .env.local to enable event imports." },
      { status: 503 },
    );
  }

  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    return Response.json({ error: "Send the import request as form data." }, { status: 400 });
  }

  const sourceType = String(formData.get("sourceType") ?? "");

  try {
    const importRequest =
      sourceType === "file"
        ? await buildFileImportContent(formData)
        : sourceType === "url"
          ? await buildWebsiteImportContent(formData)
          : null;

    if (!importRequest) {
      return Response.json({ error: "Choose a schedule file or event website to import." }, { status: 400 });
    }

    const draft = await requestOpenAIEventDraft(importRequest.content, apiKey);

    return Response.json({
      draft: {
        ...draft,
        warnings: mergeWarnings(importRequest.warnings, draft.warnings),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Event import failed.";
    return Response.json({ error: message }, { status: 400 });
  }
}

async function buildFileImportContent(formData: FormData): Promise<ImportBuildResult> {
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Add a PDF or image schedule file to import.");
  }

  if (!isSupportedOfficialEventImportFile(file.name, file.type, file.size)) {
    throw new Error("Use a PDF, JPG, PNG, or WebP file under 10 MB.");
  }

  const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");
  const mimeType = file.type || guessMimeTypeFromFileName(file.name);
  const fileData = `data:${mimeType};base64,${base64}`;
  const prompt = buildOfficialEventImportPrompt(`uploaded file "${file.name}"`);

  if (mimeType.startsWith("image/")) {
    return {
      content: [
        { type: "input_text", text: prompt },
        { type: "input_image", image_url: fileData },
      ],
      warnings: [],
    };
  }

  return {
    content: [
      { type: "input_text", text: prompt },
      { type: "input_file", filename: file.name || "event-schedule.pdf", file_data: fileData },
    ],
    warnings: [],
  };
}

async function buildWebsiteImportContent(formData: FormData): Promise<ImportBuildResult> {
  const url = String(formData.get("url") ?? "").trim();

  if (!isPublicHttpUrl(url)) {
    throw new Error("Enter a public http or https event website URL.");
  }

  const crawl = await crawlWebsiteForImport(url);

  return {
    content: [
      {
        type: "input_text",
        text: buildCrawledWebsiteImportPrompt({
          rootUrl: crawl.rootUrl,
          pages: crawl.pages,
          imageCandidates: crawl.imageCandidates,
          crawlWarnings: crawl.warnings,
        }),
      },
    ],
    warnings: crawl.warnings,
  };
}

async function crawlWebsiteForImport(url: string) {
  const rootUrl = normalizeWebsiteImportUrl(url);

  if (!rootUrl) {
    throw new Error("Enter a public http or https event website URL.");
  }

  const queue = [rootUrl];
  const queued = new Set(queue);
  const visited = new Set<string>();
  const pages: Array<{
    url: string;
    title: string | null;
    headings: string[];
    text: string;
  }> = [];
  const imageCandidates = new Map<
    string,
    { url: string; alt: string | null; sourcePageUrl: string; sponsorish: boolean }
  >();
  const warnings: string[] = [];
  let totalTextLength = 0;

  while (
    queue.length > 0 &&
    pages.length < WEBSITE_MAX_PAGES &&
    totalTextLength < WEBSITE_TOTAL_TEXT_LIMIT
  ) {
    const pageUrl = queue.shift();

    if (!pageUrl || visited.has(pageUrl)) {
      continue;
    }

    visited.add(pageUrl);

    let html: string;

    try {
      html = await fetchWebsiteHtml(pageUrl);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not read page.";

      if (pageUrl === rootUrl) {
        throw new Error(message);
      }

      warnings.push(`Skipped ${pageUrl}: ${message}`);
      continue;
    }

    const remainingTextBudget = WEBSITE_TOTAL_TEXT_LIMIT - totalTextLength;
    const text = cleanWebsiteText(
      html,
      Math.min(WEBSITE_PAGE_TEXT_LIMIT, remainingTextBudget),
    );

    if (text.length >= 40) {
      pages.push({
        url: pageUrl,
        title: extractWebsitePageTitle(html),
        headings: extractWebsiteHeadings(html),
        text,
      });
      totalTextLength += text.length;
    } else {
      warnings.push(`Skipped ${pageUrl}: not enough readable event text.`);
    }

    for (const image of extractWebsiteImageCandidates(html, pageUrl)) {
      const existing = imageCandidates.get(image.url);

      if (!existing) {
        imageCandidates.set(image.url, image);
      } else if (image.sponsorish && !existing.sponsorish) {
        imageCandidates.set(image.url, { ...existing, ...image, sponsorish: true });
      }
    }

    for (const link of extractSameSiteLinks(html, pageUrl, rootUrl)) {
      if (
        !visited.has(link) &&
        !queued.has(link) &&
        queued.size < WEBSITE_MAX_PAGES * 2
      ) {
        queue.push(link);
        queued.add(link);
      }
    }
  }

  if (pages.length === 0) {
    throw new Error("That website did not include enough readable event text.");
  }

  if (queue.length > 0 || queued.size > visited.size) {
    warnings.push(`Crawl stopped after ${pages.length} readable pages.`);
  }

  if (totalTextLength >= WEBSITE_TOTAL_TEXT_LIMIT) {
    warnings.push("Website text was trimmed to keep the import fast.");
  }

  return {
    rootUrl,
    pages,
    imageCandidates: [...imageCandidates.values()]
      .sort((a, b) => Number(b.sponsorish) - Number(a.sponsorish) || a.url.localeCompare(b.url))
      .slice(0, WEBSITE_MAX_IMAGE_CANDIDATES),
    warnings,
  };
}

async function fetchWebsiteHtml(url: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), WEBSITE_FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      headers: {
        Accept: "text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.5",
        "User-Agent": "EveSpaceEventImporter/1.0",
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error("Could not read that event website.");
    }

    const contentType = response.headers.get("content-type") ?? "";

    if (
      contentType &&
      !contentType.includes("text/html") &&
      !contentType.includes("application/xhtml") &&
      !contentType.includes("text/plain")
    ) {
      throw new Error("Skipped a non-HTML page.");
    }

    return await response.text();
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("The event website took too long to respond.");
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function mergeWarnings(...groups: Array<Array<string | null | undefined>>) {
  return [
    ...new Set(
      groups
        .flat()
        .map((warning) => String(warning ?? "").trim())
        .filter(Boolean),
    ),
  ];
}

async function requestOpenAIEventDraft(content: ImportContentPart[], apiKey: string) {
  const model = process.env.OPENAI_EVENT_IMPORT_MODEL || DEFAULT_EVENT_IMPORT_MODEL;
  const isGpt5Model = model.startsWith("gpt-5");
  const textFormat = {
    format: {
      type: "json_schema",
      name: "official_event_import",
      strict: true,
      schema: OFFICIAL_EVENT_IMPORT_JSON_SCHEMA,
    },
  };
  const response = await fetch(OPENAI_RESPONSES_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      store: false,
      input: [
        {
          role: "user",
          content,
        },
      ],
      max_output_tokens: EVENT_IMPORT_OUTPUT_TOKEN_LIMIT,
      ...(isGpt5Model ? { reasoning: { effort: "minimal" } } : {}),
      text: isGpt5Model ? { ...textFormat, verbosity: "low" } : textFormat,
    }),
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(readOpenAIError(payload) ?? "OpenAI could not parse this event source.");
  }

  const outputText = extractResponseOutputText(payload);

  if (!outputText) {
    throw new Error("OpenAI returned an empty event draft.");
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(stripJsonFences(outputText));
  } catch {
    throw new Error("OpenAI returned an unreadable event draft.");
  }

  return cleanImportedOfficialEventDraft(parsed);
}

function extractResponseOutputText(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  if ("output_text" in payload && typeof payload.output_text === "string") {
    return payload.output_text;
  }

  const output = "output" in payload && Array.isArray(payload.output) ? payload.output : [];
  const chunks: string[] = [];

  for (const item of output) {
    if (!item || typeof item !== "object" || !("content" in item) || !Array.isArray(item.content)) {
      continue;
    }

    for (const content of item.content) {
      if (!content || typeof content !== "object") {
        continue;
      }

      if ("text" in content && typeof content.text === "string") {
        chunks.push(content.text);
      }
    }
  }

  return chunks.join("\n").trim() || null;
}

function readOpenAIError(payload: unknown) {
  if (!payload || typeof payload !== "object" || !("error" in payload)) {
    return null;
  }

  const error = payload.error;

  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
    return error.message;
  }

  return null;
}

function stripJsonFences(value: string) {
  return value
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();
}

function guessMimeTypeFromFileName(fileName: string) {
  const normalized = fileName.toLowerCase();

  if (normalized.endsWith(".png")) {
    return "image/png";
  }

  if (normalized.endsWith(".webp")) {
    return "image/webp";
  }

  if (normalized.endsWith(".jpg") || normalized.endsWith(".jpeg")) {
    return "image/jpeg";
  }

  return "application/pdf";
}
