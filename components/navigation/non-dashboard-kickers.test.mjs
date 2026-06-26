import { readFile } from "node:fs/promises";
import { describe, it } from "node:test";
import assert from "node:assert/strict";

describe("non-dashboard section kickers", () => {
  it("removes unnecessary blue page/section labels outside the dashboard", async () => {
    const [exploreSource, notificationsSource, profileSource, planetSource] =
      await Promise.all([
        readFile("app/explore/page.tsx", "utf8"),
        readFile("app/notifications/page.tsx", "utf8"),
        readFile("app/profile/page.tsx", "utf8"),
        readFile("components/profile/UserPlanet.tsx", "utf8"),
      ]);

    assert.doesNotMatch(exploreSource, /evespace-kicker[\s\S]*Explore/);
    assert.doesNotMatch(exploreSource, /evespace-section-kicker[\s\S]*Suggested/);
    assert.doesNotMatch(notificationsSource, /evespace-kicker[\s\S]*Notifications/);
    assert.doesNotMatch(profileSource, /evespace-kicker[\s\S]*Your Planet/);
    assert.doesNotMatch(
      planetSource,
      /text-cyan-100[\s\S]*\{isSelf \? "Your Planet" : "User Planet"\}/,
      "profile planet card should not show the redundant blue planet label",
    );
  });

  it("keeps dashboard section kickers available", async () => {
    const dashboardSource = await readFile("app/dashboard/page.tsx", "utf8");

    assert.match(dashboardSource, /evespace-kicker/);
    assert.match(dashboardSource, /evespace-section-kicker/);
  });
});
