import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { orderSuggestedExploreProfiles } from "./profile-suggestions.mjs";

function profile(id, followStatus) {
  return {
    id,
    displayName: id,
    email: `${id}@example.com`,
    followStatus,
  };
}

describe("profile suggestions", () => {
  it("shows pending requests first and excludes already-followed or blocked people", () => {
    const suggestions = orderSuggestedExploreProfiles([
      profile("newest-none", "none"),
      profile("already-following", "following"),
      profile("requested-a", "requested"),
      profile("blocked", "blocked"),
      profile("requested-b", "requested"),
      profile("blocked-by", "blocked_by"),
      profile("older-none", "none"),
    ]);

    assert.deepEqual(
      suggestions.map((suggestion) => suggestion.id),
      ["requested-a", "requested-b", "newest-none", "older-none"],
    );
  });
});
