import type { VerificationStatus } from "@/types/evespace";

export const SITE_OWNER_EMAIL: string;

export function isSiteOwnerEmail(email: string | null | undefined): boolean;

export function isPublicOfficialEventStatus(
  status: VerificationStatus | string | null | undefined,
): boolean;
