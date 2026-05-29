"use server";

import { redirect } from "next/navigation";
import { ensureUserProfile } from "@/lib/auth/ensure-user-profile";
import {
  setStripeCustomerIdForProfile,
  syncActivePremiumSubscriptionForProfile,
} from "@/lib/data/premium";
import {
  buildPremiumCheckoutReturnUrls,
  cleanPremiumNextPath,
  getPremiumStatus,
} from "@/lib/premium/premium-utils.mjs";
import { getStripeClient } from "@/lib/stripe/client";
import {
  getAppBaseUrl,
  stripePremiumCurrency,
  stripePremiumMonthlyAmount,
  stripePremiumProductId,
} from "@/lib/stripe/config";

export async function createPremiumCheckoutSessionAction(formData: FormData) {
  const profile = await ensureUserProfile();

  if (!profile) {
    redirect("/login");
  }

  const next = cleanPremiumNextPath(String(formData.get("next") ?? ""));

  if (getPremiumStatus(profile).isPremium) {
    redirect(next);
  }

  const recoveredPremiumStatus = await syncActivePremiumSubscriptionForProfile(profile);

  if (recoveredPremiumStatus.isPremium) {
    redirect(next);
  }

  const stripe = getStripeClient();

  if (!stripe) {
    redirect(`/premium?error=${encodeURIComponent("Stripe is not configured yet.")}&next=${encodeURIComponent(next)}`);
  }

  const baseUrl = getAppBaseUrl();
  const customerId = await getOrCreateStripeCustomerId(profile);
  const returnUrls = buildPremiumCheckoutReturnUrls({ baseUrl, next });
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    client_reference_id: profile.id,
    line_items: [
      {
        price_data: {
          product: stripePremiumProductId,
          currency: stripePremiumCurrency,
          unit_amount: stripePremiumMonthlyAmount,
          recurring: {
            interval: "month",
          },
        },
        quantity: 1,
      },
    ],
    allow_promotion_codes: true,
    metadata: {
      profileId: profile.id,
      clerkUserId: profile.clerkUserId,
      next,
    },
    subscription_data: {
      metadata: {
        profileId: profile.id,
        clerkUserId: profile.clerkUserId,
      },
    },
    success_url: returnUrls.successUrl,
    cancel_url: returnUrls.cancelUrl,
  });

  if (!session.url) {
    redirect(`/premium?error=${encodeURIComponent("Stripe checkout could not be started.")}&next=${encodeURIComponent(next)}`);
  }

  redirect(session.url);
}

export async function createBillingPortalSessionAction() {
  const profile = await ensureUserProfile();

  if (!profile) {
    redirect("/login");
  }

  const stripe = getStripeClient();

  if (!stripe || !profile.stripeCustomerId) {
    redirect("/premium");
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: profile.stripeCustomerId,
    return_url: `${getAppBaseUrl()}/premium`,
  });

  redirect(session.url);
}

async function getOrCreateStripeCustomerId(profile: NonNullable<Awaited<ReturnType<typeof ensureUserProfile>>>) {
  if (profile.stripeCustomerId) {
    return profile.stripeCustomerId;
  }

  const stripe = getStripeClient();

  if (!stripe) {
    throw new Error("Stripe is not configured.");
  }

  const customer = await stripe.customers.create({
    email: profile.email ?? undefined,
    name: profile.displayName ?? undefined,
    metadata: {
      profileId: profile.id,
      clerkUserId: profile.clerkUserId,
    },
  });

  await setStripeCustomerIdForProfile(profile.id, customer.id);

  return customer.id;
}
