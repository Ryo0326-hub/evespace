const EXCLUDED_EXPLORE_FOLLOW_STATUSES = new Set([
  "following",
  "blocked",
  "blocked_by",
]);

export function orderSuggestedExploreProfiles(profiles) {
  return profiles
    .filter((profile) => !EXCLUDED_EXPLORE_FOLLOW_STATUSES.has(profile.followStatus))
    .map((profile, index) => ({ profile, index }))
    .sort((left, right) => {
      const leftRank = left.profile.followStatus === "requested" ? 0 : 1;
      const rightRank = right.profile.followStatus === "requested" ? 0 : 1;

      if (leftRank !== rightRank) {
        return leftRank - rightRank;
      }

      return left.index - right.index;
    })
    .map(({ profile }) => profile);
}
