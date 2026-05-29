import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  assertPremiumStickerAccess,
  buildPremiumCheckoutReturnUrls,
  getPremiumStatus,
  isPremiumSubscriptionStatus,
  normalizeStripeSubscriptionForProfile,
} from "./premium-utils.mjs";

describe("premium subscription utilities", () => {
  it("treats active and trialing subscriptions as premium", () => {
    assert.equal(isPremiumSubscriptionStatus("active"), true);
    assert.equal(isPremiumSubscriptionStatus("trialing"), true);
    assert.equal(isPremiumSubscriptionStatus("past_due"), false);
    assert.equal(isPremiumSubscriptionStatus("incomplete"), false);
    assert.equal(isPremiumSubscriptionStatus("unpaid"), false);
    assert.equal(isPremiumSubscriptionStatus("canceled"), false);
  });

  it("reads premium status from profile billing fields", () => {
    assert.deepEqual(
      getPremiumStatus({
        stripeSubscriptionStatus: "active",
        stripeCurrentPeriodEnd: "2026-06-25T00:00:00.000Z",
        stripeCancelAtPeriodEnd: true,
      }),
      {
        isPremium: true,
        status: "active",
        currentPeriodEnd: "2026-06-25T00:00:00.000Z",
        cancelAtPeriodEnd: true,
      },
    );

    assert.deepEqual(getPremiumStatus({ stripeSubscriptionStatus: "past_due" }), {
      isPremium: false,
      status: "past_due",
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
    });
  });

  it("normalizes Stripe subscription webhook payloads for profile updates", () => {
    assert.deepEqual(
      normalizeStripeSubscriptionForProfile({
        id: "sub_123",
        customer: "cus_123",
        status: "active",
        current_period_end: 1_779_062_400,
        cancel_at_period_end: false,
        metadata: {
          clerkUserId: "user_123",
          profileId: "profile_123",
        },
      }),
      {
        profileId: "profile_123",
        clerkUserId: "user_123",
        stripeCustomerId: "cus_123",
        stripeSubscriptionId: "sub_123",
        stripeSubscriptionStatus: "active",
        stripeCurrentPeriodEnd: "2026-05-18T00:00:00.000Z",
        stripeCancelAtPeriodEnd: false,
      },
    );
  });

  it("reads current period end from Stripe subscription items when needed", () => {
    assert.equal(
      normalizeStripeSubscriptionForProfile({
        id: "sub_123",
        customer: { id: "cus_123" },
        status: "trialing",
        items: {
          data: [{ current_period_end: 1_779_062_400 }],
        },
      }).stripeCurrentPeriodEnd,
      "2026-05-18T00:00:00.000Z",
    );
  });

  it("rejects sticker payloads for non-premium users", () => {
    assert.doesNotThrow(() =>
      assertPremiumStickerAccess({
        profile: { stripeSubscriptionStatus: "active" },
        stickerCount: 3,
      }),
    );
    assert.doesNotThrow(() =>
      assertPremiumStickerAccess({
        profile: { stripeSubscriptionStatus: "canceled" },
        stickerCount: 0,
      }),
    );
    assert.throws(
      () =>
        assertPremiumStickerAccess({
          profile: { stripeSubscriptionStatus: "canceled" },
          stickerCount: 1,
        }),
      /Premium is required to use stickers/,
    );
  });

  it("builds Checkout return URLs with the session id template", () => {
    assert.deepEqual(
      buildPremiumCheckoutReturnUrls({
        baseUrl: "https://evespace.test/",
        next: "/official-events/new?from=dashboard",
      }),
      {
        successUrl:
          "https://evespace.test/premium/success?session_id={CHECKOUT_SESSION_ID}&next=%2Fofficial-events%2Fnew%3Ffrom%3Ddashboard",
        cancelUrl:
          "https://evespace.test/premium/cancel?next=%2Fofficial-events%2Fnew%3Ffrom%3Ddashboard",
      },
    );
  });
});
