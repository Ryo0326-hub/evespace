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
    assert.match(userPlanetSource, /src="\/dashboard-icons\/dashboard\.png"/);
    assert.match(premiumSource, /src="\/dashboard-icons\/premium\.png"/);
  });

  it("moves Your Planet to the top nav and keeps Dashboard in the profile menu", async () => {
    const source = await readFile("components/navigation/AppNav.tsx", "utf8");

    assert.match(
      source,
      /aria-label="Your Planet"[\s\S]*href="\/profile"[\s\S]*src="\/navigation-icons\/your-planet\.png"/,
      "Your Planet should be a direct top nav link using the planet icon",
    );
    assert.match(
      source,
      /href="\/dashboard"[\s\S]*src="\/dashboard-icons\/dashboard\.png"[\s\S]*<span>Dashboard<\/span>/,
      "profile menu should use the dashboard icon for the Dashboard link",
    );
    assert.doesNotMatch(
      source,
      /role="menuitem"[\s\S]*<span>Your Planet<\/span>/,
      "Your Planet should no longer live inside the profile dropdown",
    );
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

  it("uses a compact desktop dashboard header without changing the mobile action stack", async () => {
    const dashboardSource = await readFile("app/dashboard/page.tsx", "utf8");

    assert.match(
      dashboardSource,
      /dashboard-desktop-header[^"`]*sm:grid-cols-\[minmax\(0,1fr\)_16rem\][^"`]*lg:grid-cols-\[minmax\(0,1fr\)_auto\][^"`]*lg:items-center/,
      "desktop dashboard header should align the title and controls in one compact row",
    );
    assert.match(
      dashboardSource,
      /dashboard-action-stack[^"`]*w-full[^"`]*sm:w-64[^"`]*lg:w-auto[^"`]*lg:grid-cols-\[17\.75rem_10rem_15rem\]/,
      "desktop dashboard actions should become one horizontal command cluster while mobile keeps the existing stack",
    );
    assert.match(
      dashboardSource,
      /dashboard-follow-grid[^"`]*grid-cols-2[^"`]*lg:grid-cols-\[8\.75rem_8\.75rem\]/,
      "desktop follow buttons should have enough fixed width to avoid label truncation",
    );
  });

  it("puts dashboard action icons after labels while follow icons stay before labels", async () => {
    const [dashboardSource, userPlanetSource] = await Promise.all([
      readFile("app/dashboard/page.tsx", "utf8"),
      readFile("components/profile/UserPlanet.tsx", "utf8"),
    ]);

    assert.match(
      dashboardSource,
      /Create\s*<Image[\s\S]*src="\/dashboard-icons\/create\.png"/,
      "Create action icon should sit to the right of its label",
    );
    assert.match(
      dashboardSource,
      /Host an official event\s*<Image[\s\S]*src="\/dashboard-icons\/host\.png"/,
      "Host action icon should sit to the right of its label",
    );
    assert.match(
      userPlanetSource,
      /Open Dashboard\s*<Image[\s\S]*src="\/dashboard-icons\/dashboard\.png"/,
      "Open Dashboard action icon should sit to the right of its label",
    );
    assert.match(
      dashboardSource,
      /src="\/dashboard-icons\/friends\.png"[\s\S]*<span className="truncate">\{label\}<\/span>/,
      "Following and Followers should keep the friends icon before the label",
    );
  });
});
