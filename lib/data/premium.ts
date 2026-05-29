import "server-only";

import type Stripe from "stripe";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  getPremiumStatus,
  normalizeStripeSubscriptionForProfile,
} from "@/lib/premium/premium-utils.mjs";
import { getStripeClient } from "@/lib/stripe/client";
import { stripePremiumProductId } from "@/lib/stripe/config";
import type { Profile } from "@/types/evespace";

export function isPremiumProfile(profile: Profile | null) {
  return getPremiumStatus(profile).isPremium;
}

export function requirePremiumForOfficialEventHosting(profile: Profile | null) {
  if (!isPremiumProfile(profile)) {
    throw new Error("EveSpace Premium is required to host an official event.");
  }
}

export async function setStripeCustomerIdForProfile(
  profileId: string,
  stripeCustomerId: string,
) {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    throw new Error("Supabase service role is not configured.");
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      stripe_customer_id: stripeCustomerId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", profileId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function upsertStripeSubscriptionFromWebhook(
  subscription: Stripe.Subscription | Record<string, unknown>,
) {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    throw new Error("Supabase service role is not configured.");
  }

  const normalized = normalizeStripeSubscriptionForProfile(subscription);
  const existingProfile = await findProfileForStripeSubscription(normalized);

  if (!existingProfile) {
    throw new Error("No matching EveSpace profile for Stripe subscription.");
  }

  const isPremium = getPremiumStatus({
    stripeSubscriptionStatus: normalized.stripeSubscriptionStatus,
  }).isPremium;
  const premiumSince =
    isPremium && !existingProfile.premiumSince
      ? new Date().toISOString()
      : existingProfile.premiumSince;

  const { error } = await supabase
    .from("profiles")
    .update({
      stripe_customer_id: normalized.stripeCustomerId,
      stripe_subscription_id: normalized.stripeSubscriptionId,
      stripe_subscription_status: normalized.stripeSubscriptionStatus,
      stripe_current_period_end: normalized.stripeCurrentPeriodEnd,
      stripe_cancel_at_period_end: normalized.stripeCancelAtPeriodEnd,
      premium_since: premiumSince,
      updated_at: new Date().toISOString(),
    })
    .eq("id", existingProfile.id);

  if (error) {
    throw new Error(error.message);
  }
}

export async function syncPremiumCheckoutSessionForProfile(
  sessionId: string,
  profile: Profile,
): Promise<ReturnType<typeof getPremiumStatus>> {
  const stripe = getStripeClient();
  const cleanSessionId = sessionId.trim();

  if (!stripe || !cleanSessionId) {
    return getPremiumStatus(profile);
  }

  const session = await stripe.checkout.sessions.retrieve(cleanSessionId, {
    expand: ["subscription"],
  });

  if (!checkoutSessionBelongsToProfile(session, profile)) {
    throw new Error("This Stripe Checkout Session does not belong to this account.");
  }

  if (
    session.mode !== "subscription" ||
    session.status !== "complete" ||
    !session.subscription
  ) {
    return getPremiumStatus(profile);
  }

  const subscription =
    typeof session.subscription === "string"
      ? await stripe.subscriptions.retrieve(session.subscription)
      : session.subscription;
  const subscriptionForProfile = mergeCheckoutSessionProfileMetadata(
    subscription,
    session,
  );

  await upsertStripeSubscriptionFromWebhook(subscriptionForProfile);

  const normalized = normalizeStripeSubscriptionForProfile(subscriptionForProfile);

  return getPremiumStatus({
    stripeSubscriptionStatus: normalized.stripeSubscriptionStatus,
    stripeCurrentPeriodEnd: normalized.stripeCurrentPeriodEnd,
    stripeCancelAtPeriodEnd: normalized.stripeCancelAtPeriodEnd,
  });
}

export async function syncActivePremiumSubscriptionForProfile(
  profile: Profile,
): Promise<ReturnType<typeof getPremiumStatus>> {
  const currentStatus = getPremiumStatus(profile);

  if (currentStatus.isPremium || !profile.stripeCustomerId) {
    return currentStatus;
  }

  const stripe = getStripeClient();

  if (!stripe) {
    return currentStatus;
  }

  const subscriptions = await stripe.subscriptions.list({
    customer: profile.stripeCustomerId,
    status: "all",
    limit: 20,
  });
  const premiumSubscription = subscriptions.data.find(
    (subscription) =>
      getPremiumStatus({
        stripeSubscriptionStatus: subscription.status,
      }).isPremium && subscriptionUsesPremiumProduct(subscription),
  );

  if (!premiumSubscription) {
    return currentStatus;
  }

  await upsertStripeSubscriptionFromWebhook(premiumSubscription);

  const normalized = normalizeStripeSubscriptionForProfile(premiumSubscription);

  return getPremiumStatus({
    stripeSubscriptionStatus: normalized.stripeSubscriptionStatus,
    stripeCurrentPeriodEnd: normalized.stripeCurrentPeriodEnd,
    stripeCancelAtPeriodEnd: normalized.stripeCancelAtPeriodEnd,
  });
}

async function findProfileForStripeSubscription(normalized: {
  profileId: string | null;
  clerkUserId: string | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
}) {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    throw new Error("Supabase service role is not configured.");
  }

  if (normalized.profileId) {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", normalized.profileId)
      .maybeSingle();

    if (data) {
      return mapExistingProfile(data);
    }
  }

  if (normalized.clerkUserId) {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("clerk_user_id", normalized.clerkUserId)
      .maybeSingle();

    if (data) {
      return mapExistingProfile(data);
    }
  }

  if (normalized.stripeCustomerId) {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("stripe_customer_id", normalized.stripeCustomerId)
      .maybeSingle();

    if (data) {
      return mapExistingProfile(data);
    }
  }

  if (normalized.stripeSubscriptionId) {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("stripe_subscription_id", normalized.stripeSubscriptionId)
      .maybeSingle();

    if (data) {
      return mapExistingProfile(data);
    }
  }

  return null;
}

function mapExistingProfile(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    premiumSince: (row.premium_since as string | null) ?? null,
  };
}

function checkoutSessionBelongsToProfile(
  session: Stripe.Checkout.Session,
  profile: Profile,
) {
  const profileId = session.metadata?.profileId;
  const clerkUserId = session.metadata?.clerkUserId;
  const customerId =
    typeof session.customer === "string" ? session.customer : session.customer?.id;

  return Boolean(
    session.client_reference_id === profile.id ||
      profileId === profile.id ||
      clerkUserId === profile.clerkUserId ||
      (profile.stripeCustomerId && customerId === profile.stripeCustomerId),
  );
}

function mergeCheckoutSessionProfileMetadata(
  subscription: Stripe.Subscription,
  session: Stripe.Checkout.Session,
) {
  return {
    ...subscription,
    metadata: {
      ...session.metadata,
      ...subscription.metadata,
      profileId: subscription.metadata?.profileId ?? session.metadata?.profileId,
      clerkUserId:
        subscription.metadata?.clerkUserId ?? session.metadata?.clerkUserId,
    },
  };
}

function subscriptionUsesPremiumProduct(subscription: Stripe.Subscription) {
  return subscription.items.data.some((item) => {
    const product = item.price?.product;

    if (typeof product === "string") {
      return product === stripePremiumProductId;
    }

    return product?.id === stripePremiumProductId;
  });
}
