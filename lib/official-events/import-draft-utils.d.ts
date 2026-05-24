export type ImportedOfficialEventScheduleItemDraft = {
  title: string | null;
  description: string | null;
  startTime: string | null;
  endTime: string | null;
  locationLabel: string | null;
};

export type ImportedOfficialEventGoodsServiceDraft = {
  name: string | null;
  description: string | null;
  price: string | null;
  imageUrl: string | null;
  externalLink: string | null;
};

export type ImportedOfficialEventSponsorDraft = {
  name: string | null;
  description: string | null;
  tier: string | null;
  logoUrl: string | null;
  websiteUrl: string | null;
};

export type ImportedOfficialEventDraft = {
  title: string | null;
  description: string | null;
  category: string | null;
  eventWebsiteUrl: string | null;
  locationName: string | null;
  locationAddress: string | null;
  googleMapsUrl: string | null;
  accessInformation: string | null;
  scheduleItems: ImportedOfficialEventScheduleItemDraft[];
  goodsServices: ImportedOfficialEventGoodsServiceDraft[];
  sponsors: ImportedOfficialEventSponsorDraft[];
  warnings: string[];
};

export type WebsiteImageCandidate = {
  url: string;
  alt: string | null;
  sourcePageUrl: string;
  sponsorish: boolean;
};

export type CrawledWebsiteImportPage = {
  url: string;
  title: string | null;
  headings: string[];
  text: string;
};

export type ImportedOfficialEventScheduleDayGroup = {
  date: string | null;
  label: string;
  items: ImportedOfficialEventScheduleItemDraft[];
};

export const MAX_OFFICIAL_EVENT_IMPORT_FILE_BYTES: number;
export const SUPPORTED_OFFICIAL_EVENT_IMPORT_MIME_TYPES: Set<string>;
export const OFFICIAL_EVENT_IMPORT_JSON_SCHEMA: Record<string, unknown>;

export function buildOfficialEventImportPrompt(sourceDescription: string): string;
export function buildCrawledWebsiteImportPrompt(input: {
  rootUrl: string;
  pages: CrawledWebsiteImportPage[];
  imageCandidates?: WebsiteImageCandidate[];
  crawlWarnings?: string[];
}): string;
export function cleanImportedOfficialEventDraft(raw: unknown): ImportedOfficialEventDraft;
export function cleanWebsiteText(html: string, maxLength?: number): string;
export function extractSameSiteLinks(
  html: string,
  pageUrl: string,
  rootUrl: string,
): string[];
export function extractWebsiteHeadings(html: string, maxCount?: number): string[];
export function extractWebsiteImageCandidates(
  html: string,
  pageUrl: string,
  maxCount?: number,
): WebsiteImageCandidate[];
export function extractWebsitePageTitle(html: string): string | null;
export function groupImportedScheduleItemsByDay(
  items: ImportedOfficialEventScheduleItemDraft[],
): ImportedOfficialEventScheduleDayGroup[];
export function isPublicHttpUrl(value: unknown): boolean;
export function isSupportedOfficialEventImportFile(
  fileName: string | null | undefined,
  mimeType: string | null | undefined,
  byteSize: number,
): boolean;
export function normalizeSameSiteImportUrl(
  value: unknown,
  pageUrl: string,
  rootUrl: string,
): string | null;
export function normalizeWebsiteImportUrl(
  value: unknown,
  baseUrl?: string,
): string | null;
