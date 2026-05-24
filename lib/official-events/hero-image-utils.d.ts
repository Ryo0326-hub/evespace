export const MAX_OFFICIAL_EVENT_HERO_IMAGE_BYTES: number;

export function isSupportedOfficialEventHeroImage(
  fileName: string | null | undefined,
  mimeType: string | null | undefined,
  byteSize: number,
): boolean;

export function buildOfficialEventHeroImageStoragePath(input: {
  eventKey: string | null | undefined;
  fileName: string | null | undefined;
  mimeType: string | null | undefined;
  now?: number;
}): string;

export function readHeroImageExtension(
  fileName: string | null | undefined,
  mimeType: string | null | undefined,
): string | null;
