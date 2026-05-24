import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildOfficialEventHeroImageStoragePath,
  isSupportedOfficialEventHeroImage,
} from "./hero-image-utils.mjs";

describe("official event hero image utilities", () => {
  it("accepts jpg, png, and webp images within the upload limit", () => {
    assert.equal(isSupportedOfficialEventHeroImage("banner.jpg", "image/jpeg", 500_000), true);
    assert.equal(isSupportedOfficialEventHeroImage("banner.png", "image/png", 500_000), true);
    assert.equal(isSupportedOfficialEventHeroImage("banner.webp", "image/webp", 500_000), true);
  });

  it("rejects unsupported or oversized hero images", () => {
    assert.equal(isSupportedOfficialEventHeroImage("banner.gif", "image/gif", 500_000), false);
    assert.equal(
      isSupportedOfficialEventHeroImage("banner.jpg", "image/jpeg", 6 * 1024 * 1024),
      false,
    );
  });

  it("creates deterministic safe storage paths", () => {
    assert.equal(
      buildOfficialEventHeroImageStoragePath({
        eventKey: "Tokyo Culture Fest!",
        fileName: "Main Banner.JPG",
        mimeType: "image/jpeg",
        now: 1770000000000,
      }),
      "tokyo-culture-fest/1770000000000-main-banner.jpg",
    );
  });
});
