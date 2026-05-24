export const MAX_OFFICIAL_EVENT_HERO_IMAGE_BYTES = 5 * 1024 * 1024;

const SUPPORTED_HERO_IMAGE_TYPES = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

const SUPPORTED_HERO_IMAGE_EXTENSIONS = new Map([
  [".jpeg", "jpg"],
  [".jpg", "jpg"],
  [".png", "png"],
  [".webp", "webp"],
]);

export function isSupportedOfficialEventHeroImage(fileName, mimeType, byteSize) {
  const size = Number(byteSize);

  if (!Number.isFinite(size) || size <= 0 || size > MAX_OFFICIAL_EVENT_HERO_IMAGE_BYTES) {
    return false;
  }

  return Boolean(readHeroImageExtension(fileName, mimeType));
}

export function buildOfficialEventHeroImageStoragePath({
  eventKey,
  fileName,
  mimeType,
  now = Date.now(),
}) {
  const extension = readHeroImageExtension(fileName, mimeType) ?? "jpg";
  const safeEventKey = slugifyPathPart(eventKey) || "official-event";
  const safeFileName = slugifyPathPart(stripFileExtension(fileName)) || "hero";

  return `${safeEventKey}/${now}-${safeFileName}.${extension}`;
}

export function readHeroImageExtension(fileName, mimeType) {
  const normalizedMimeType = String(mimeType ?? "").toLowerCase();

  if (SUPPORTED_HERO_IMAGE_TYPES.has(normalizedMimeType)) {
    return SUPPORTED_HERO_IMAGE_TYPES.get(normalizedMimeType);
  }

  const normalizedName = String(fileName ?? "").toLowerCase();
  const extension = normalizedName.match(/\.[a-z0-9]+$/)?.[0] ?? "";
  return SUPPORTED_HERO_IMAGE_EXTENSIONS.get(extension) ?? null;
}

function stripFileExtension(value) {
  return String(value ?? "").replace(/\.[a-z0-9]+$/i, "");
}

function slugifyPathPart(value) {
  return String(value ?? "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
