import type Stripe from "stripe";
import { upsertStripeSubscriptionFromWebhook } from "@/lib/data/premium";
import { getStripeClient } from "@/lib/stripe/client";
import { stripeWebhookSecret } from "@/lib/stripe/config";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const stripe = getStripeClient();
  const signature = request.headers.get("stripe-signature");
  const body = await request.text();

  if (!stripe || !stripeWebhookSecret || !signature) {
    return new Response("Stripe webhook is not configured.", { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, stripeWebhookSecret);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid signature.";
    return new Response(`Webhook Error: ${message}`, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      await syncSubscriptionFromCheckoutSession(session);
    }

    if (
      event.type === "customer.subscription.created" ||
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.deleted"
    ) {
      await upsertStripeSubscriptionFromWebhook(
        event.data.object as Stripe.Subscription,
      );
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Webhook processing failed.";
    return new Response(message, { status: 500 });
  }

  return Response.json({ received: true });
}

async function syncSubscriptionFromCheckoutSession(
  session: Stripe.Checkout.Session,
) {
  if (session.mode !== "subscription" || !session.subscription) {
    return;
  }

  const stripe = getStripeClient();

  if (!stripe) {
    throw new Error("Stripe is not configured.");
  }

  const subscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription.id;
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  await upsertStripeSubscriptionFromWebhook(subscription);
}
