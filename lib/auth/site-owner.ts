import "server-only";

import { ensureUserProfile } from "@/lib/auth/ensure-user-profile";
import { isSiteOwnerEmail } from "@/lib/official-events/approval-utils.mjs";
import type { Profile } from "@/types/evespace";

export function isSiteOwnerProfile(profile: Profile | null): boolean {
  return isSiteOwnerEmail(profile?.email);
}

export function canReviewOfficialEvents(profile: Profile | null): boolean {
  return isSiteOwnerProfile(profile);
}

export async function requireSiteOwner(): Promise<Profile> {
  const profile = await ensureUserProfile();

  if (!profile || !canReviewOfficialEvents(profile)) {
    throw new Error("Site owner access required.");
  }

  return profile;
}
