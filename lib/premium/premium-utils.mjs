export function getPremiumStatus() {
  return {
    isPremium: false,
    status: "unavailable",
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
  };
}

export function canUsePremiumStickers(profile) {
  return Boolean(profile);
}

export function assertPremiumStickerAccess({ profile, stickerCount }) {
  if (Number(stickerCount) > 0 && !canUsePremiumStickers(profile)) {
    throw new Error("Sign in to use stickers.");
  }
}

export function cleanPremiumNextPath(value, fallback = "/official-events/new") {
  const next = cleanString(value);

  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return fallback;
  }

  return next;
}

function cleanString(value) {
  const next = String(value ?? "").trim();
  return next.length > 0 ? next : null;
}
