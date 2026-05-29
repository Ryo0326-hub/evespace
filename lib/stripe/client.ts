import "server-only";

import Stripe from "stripe";
import { stripeSecretKey } from "@/lib/stripe/config";

let stripeClient: Stripe | null = null;

export function getStripeClient() {
  if (!stripeSecretKey) {
    return null;
  }

  stripeClient ??= new Stripe(stripeSecretKey, {
    apiVersion: "2026-04-22.dahlia",
    typescript: true,
  });

  return stripeClient;
}
