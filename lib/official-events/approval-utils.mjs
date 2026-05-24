export const SITE_OWNER_EMAIL = "rkitano0326@gmail.com";

export function isSiteOwnerEmail(email) {
  return String(email ?? "").trim().toLowerCase() === SITE_OWNER_EMAIL;
}

export function isPublicOfficialEventStatus(status) {
  return status === "verified";
}
