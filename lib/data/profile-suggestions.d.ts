import type { FollowRelationshipStatus } from "@/types/evespace";

export type SuggestedExploreProfile = {
  followStatus: FollowRelationshipStatus;
};

export function orderSuggestedExploreProfiles<T extends SuggestedExploreProfile>(
  profiles: T[],
): T[];
