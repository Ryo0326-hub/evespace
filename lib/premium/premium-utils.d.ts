export type PremiumStatus = {
  isPremium: boolean;
  status: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
};

export type StripeSubscriptionProfileState = {
  profileId: string | null;
  clerkUserId: string | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  stripeSubscriptionStatus: string | null;
  stripeCurrentPeriodEnd: string | null;
  stripeCancelAtPeriodEnd: boolean;
};

export function isPremiumSubscriptionStatus(status?: string | null): boolean;

export function getPremiumStatus(profile?: {
  stripeSubscriptionStatus?: string | null;
  stripeCurrentPeriodEnd?: string | null;
  stripeCancelAtPeriodEnd?: boolean | null;
} | null): PremiumStatus;

export function canUsePremiumStickers(profile?: {
  stripeSubscriptionStatus?: string | null;
  stripeCurrentPeriodEnd?: string | null;
  stripeCancelAtPeriodEnd?: boolean | null;
} | null): boolean;

export function assertPremiumStickerAccess(input: {
  profile?: {
    stripeSubscriptionStatus?: string | null;
    stripeCurrentPeriodEnd?: string | null;
    stripeCancelAtPeriodEnd?: boolean | null;
  } | null;
  stickerCount?: number | null;
}): void;

export function normalizeStripeSubscriptionForProfile(
  subscription?: Record<string, unknown> | null,
): StripeSubscriptionProfileState;

export function cleanPremiumNextPath(
  value?: string | null,
  fallback?: string,
): string;

export function buildPremiumCheckoutReturnUrls(input: {
  baseUrl?: string | null;
  next?: string | null;
}): {
  successUrl: string;
  cancelUrl: string;
};
