export type PremiumStatus = {
  isPremium: boolean;
  status: "unavailable";
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
};

export function getPremiumStatus(): PremiumStatus;

export function canUsePremiumStickers(profile?: unknown): boolean;

export function assertPremiumStickerAccess(input: {
  profile?: unknown;
  stickerCount?: number | null;
}): void;

export function cleanPremiumNextPath(
  value?: string | null,
  fallback?: string,
): string;
