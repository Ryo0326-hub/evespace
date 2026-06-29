import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  assertPremiumStickerAccess,
  canUsePremiumStickers,
  cleanPremiumNextPath,
  getPremiumStatus,
} from "./premium-utils.mjs";

describe("premium utilities", () => {
  it("keeps premium checkout unavailable while allowing signed-in users to use current sticker tools", () => {
    assert.deepEqual(getPremiumStatus(), {
      isPremium: false,
      status: "unavailable",
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
    });

    assert.equal(canUsePremiumStickers(null), false);
    assert.equal(canUsePremiumStickers({ id: "profile_123" }), true);
  });

  it("allows sticker payloads for signed-in users while payment setup is deferred", () => {
    assert.doesNotThrow(() =>
      assertPremiumStickerAccess({
        profile: { id: "profile_123" },
        stickerCount: 0,
      }),
    );
    assert.doesNotThrow(() =>
      assertPremiumStickerAccess({
        profile: { id: "profile_123" },
        stickerCount: 1,
      }),
    );
    assert.throws(
      () => assertPremiumStickerAccess({ profile: null, stickerCount: 1 }),
      /Sign in to use stickers/,
    );
  });

  it("keeps premium return paths local", () => {
    assert.equal(
      cleanPremiumNextPath("/official-events/new?from=dashboard"),
      "/official-events/new?from=dashboard",
    );
    assert.equal(cleanPremiumNextPath("https://example.com"), "/official-events/new");
    assert.equal(cleanPremiumNextPath("//example.com"), "/official-events/new");
  });
});
