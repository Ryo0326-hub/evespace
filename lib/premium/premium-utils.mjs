const PREMIUM_STATUSES = new Set(["active", "trialing"]);

export function isPremiumSubscriptionStatus(status) {
  return PREMIUM_STATUSES.has(String(status ?? "").trim().toLowerCase());
}

export function getPremiumStatus(profile) {
  const status = cleanString(profile?.stripeSubscriptionStatus);
  const currentPeriodEnd = cleanString(profile?.stripeCurrentPeriodEnd);
  const cancelAtPeriodEnd = Boolean(profile?.stripeCancelAtPeriodEnd);

  return {
    isPremium: isPremiumSubscriptionStatus(status),
    status,
    currentPeriodEnd,
    cancelAtPeriodEnd,
  };
}

export function canUsePremiumStickers(profile) {
  return getPremiumStatus(profile).isPremium;
}

export function assertPremiumStickerAccess({ profile, stickerCount }) {
  if (Number(stickerCount) > 0 && !canUsePremiumStickers(profile)) {
    throw new Error("Premium is required to use stickers.");
  }
}

export function normalizeStripeSubscriptionForProfile(subscription) {
  const profileId = cleanString(subscription?.metadata?.profileId);
  const clerkUserId = cleanString(subscription?.metadata?.clerkUserId);
  const stripeCustomerId = readStripeId(subscription?.customer);
  const stripeSubscriptionId = cleanString(subscription?.id);
  const stripeSubscriptionStatus = cleanString(subscription?.status);
  const stripeCurrentPeriodEnd = unixSecondsToIso(
    subscription?.current_period_end ??
      subscription?.items?.data?.[0]?.current_period_end,
  );
  const stripeCancelAtPeriodEnd = Boolean(subscription?.cancel_at_period_end);

  return {
    profileId,
    clerkUserId,
    stripeCustomerId,
    stripeSubscriptionId,
    stripeSubscriptionStatus,
    stripeCurrentPeriodEnd,
    stripeCancelAtPeriodEnd,
  };
}

export function cleanPremiumNextPath(value, fallback = "/official-events/new") {
  const next = cleanString(value);

  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return fallback;
  }

  return next;
}

export function buildPremiumCheckoutReturnUrls({ baseUrl, next }) {
  const normalizedBaseUrl = cleanString(baseUrl)?.replace(/\/+$/, "") ?? "";
  const safeNext = cleanPremiumNextPath(next);
  const encodedNext = encodeURIComponent(safeNext);

  return {
    successUrl: `${normalizedBaseUrl}/premium/success?session_id={CHECKOUT_SESSION_ID}&next=${encodedNext}`,
    cancelUrl: `${normalizedBaseUrl}/premium/cancel?next=${encodedNext}`,
  };
}

function readStripeId(value) {
  if (typeof value === "string") {
    return cleanString(value);
  }

  return cleanString(value?.id);
}

function unixSecondsToIso(value) {
  const seconds = Number(value);

  if (!Number.isFinite(seconds) || seconds <= 0) {
    return null;
  }

  return new Date(seconds * 1000).toISOString();
}

function cleanString(value) {
  const next = String(value ?? "").trim();
  return next.length > 0 ? next : null;
}
