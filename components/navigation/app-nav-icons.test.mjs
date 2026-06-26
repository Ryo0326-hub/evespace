import { access, readFile } from "node:fs/promises";
import { constants } from "node:fs";
import { describe, it } from "node:test";
import assert from "node:assert/strict";

const navigationIconPaths = [
  "public/navigation-icons/search.png",
  "public/navigation-icons/notification.png",
  "public/navigation-icons/your-planet.png",
  "public/navigation-icons/manage.png",
  "public/navigation-icons/sign-out.png",
];

describe("app nav icon assets", () => {
  it("serves the supplied nav and profile menu icons", async () => {
    for (const iconPath of navigationIconPaths) {
      await assert.doesNotReject(
        access(iconPath, constants.R_OK),
        `${iconPath} should be readable`,
      );
    }
  });

  it("renders the supplied image icons in the nav and profile menu", async () => {
    const source = await readFile("components/navigation/AppNav.tsx", "utf8");

    for (const iconPath of navigationIconPaths) {
      const publicPath = iconPath.replace(/^public/, "");
      assert.match(
        source,
        new RegExp(publicPath.replaceAll("/", "\\/").replace(".", "\\.")),
        `AppNav should reference ${publicPath}`,
      );
    }

    assert.doesNotMatch(source, /<UserButton/);
    assert.match(
      source,
      /className="fixed[^"]*right-3[^"]*w-\[min\(14rem,calc\(100vw-1\.5rem\)\)\]/,
      "profile menu should be fixed to the viewport and constrained on mobile",
    );
  });
});
