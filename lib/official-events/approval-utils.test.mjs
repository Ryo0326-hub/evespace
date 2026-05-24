import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  isPublicOfficialEventStatus,
  isSiteOwnerEmail,
  SITE_OWNER_EMAIL,
} from "./approval-utils.mjs";

describe("official event approval utilities", () => {
  it("matches only the configured site owner email case-insensitively", () => {
    assert.equal(SITE_OWNER_EMAIL, "rkitano0326@gmail.com");
    assert.equal(isSiteOwnerEmail("rkitano0326@gmail.com"), true);
    assert.equal(isSiteOwnerEmail("  RKITANO0326@GMAIL.COM  "), true);
    assert.equal(isSiteOwnerEmail("admin@example.com"), false);
    assert.equal(isSiteOwnerEmail(null), false);
  });

  it("publishes only verified official event statuses", () => {
    assert.equal(isPublicOfficialEventStatus("verified"), true);
    assert.equal(isPublicOfficialEventStatus("pending_review"), false);
    assert.equal(isPublicOfficialEventStatus("unverified"), false);
    assert.equal(isPublicOfficialEventStatus("rejected"), false);
    assert.equal(isPublicOfficialEventStatus("not_applicable"), false);
  });
});
