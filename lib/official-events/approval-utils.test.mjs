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

  it("publishes official event statuses without an approval gate", () => {
    assert.equal(isPublicOfficialEventStatus("verified"), true);
    assert.equal(isPublicOfficialEventStatus("pending_review"), true);
    assert.equal(isPublicOfficialEventStatus("unverified"), true);
    assert.equal(isPublicOfficialEventStatus("rejected"), false);
    assert.equal(isPublicOfficialEventStatus("not_applicable"), false);
  });
});
