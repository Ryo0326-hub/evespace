import { access, readFile } from "node:fs/promises";
import { constants } from "node:fs";
import { describe, it } from "node:test";
import assert from "node:assert/strict";

const dashboardIconPaths = [
  "public/dashboard-icons/premium.png",
  "public/dashboard-icons/friends.png",
  "public/dashboard-icons/dashboard.png",
  "public/dashboard-icons/create.png",
  "public/dashboard-icons/host.png",
];

describe("dashboard and profile icons", () => {
  it("serves the supplied dashboard UI icons", async () => {
    for (const iconPath of dashboardIconPaths) {
      await assert.doesNotReject(
        access(iconPath, constants.R_OK),
        `${iconPath} should be readable`,
      );
    }
  });

  it("renders icons in premium, follow stat, and open dashboard UI", async () => {
    const [dashboardSource, userPlanetSource, premiumSource] = await Promise.all([
      readFile("app/dashboard/page.tsx", "utf8"),
      readFile("components/profile/UserPlanet.tsx", "utf8"),
      readFile("app/premium/page.tsx", "utf8"),
    ]);

    assert.match(dashboardSource, /from "next\/image"/);
    assert.match(dashboardSource, /src="\/dashboard-icons\/friends\.png"/);
    assert.match(dashboardSource, /src="\/dashboard-icons\/create\.png"/);
    assert.match(dashboardSource, /src="\/dashboard-icons\/host\.png"/);
    assert.match(userPlanetSource, /src="\/dashboard-icons\/premium\.png"/);
    assert.match(userPlanetSource, /src="\/dashboard-icons\/dashboard\.png"/);
    assert.match(premiumSource, /src="\/dashboard-icons\/premium\.png"/);
  });

  it("aligns mobile follow buttons to half-width dashboard actions", async () => {
    const dashboardSource = await readFile("app/dashboard/page.tsx", "utf8");

    assert.match(
      dashboardSource,
      /dashboard-action-stack[^"`]*w-full[^"`]*sm:w-64/,
      "dashboard action stack should have one shared mobile width for follow and create/host buttons",
    );
    assert.match(
      dashboardSource,
      /dashboard-follow-grid[^"`]*grid-cols-2/,
      "following and followers should sit in two equal columns on mobile",
    );
    assert.match(
      dashboardSource,
      /dashboard-follow-button[^"`]*w-full[^"`]*min-w-0/,
      "each follow button should fill one half of the shared action width",
    );
    assert.match(
      dashboardSource,
      /dashboard-primary-action[^"`]*w-full/,
      "create and host actions should remain full width under the follow row",
    );
  });
});
