export const stripeSecretKey = process.env.STRIPE_SECRET_KEY ?? "";
export const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET ?? "";
export const stripePremiumProductId =
  process.env.STRIPE_PREMIUM_PRODUCT_ID ?? "prod_Ua1oHeg7OqxBZD";
export const stripePremiumCurrency =
  (process.env.STRIPE_PREMIUM_CURRENCY ?? "cad").trim().toLowerCase() || "cad";
export const stripePremiumMonthlyAmount = readPositiveInteger(
  process.env.STRIPE_PREMIUM_MONTHLY_AMOUNT,
  500,
);

export const hasStripeCheckoutConfig = Boolean(
  stripeSecretKey && stripePremiumProductId && stripePremiumCurrency,
);
export const hasStripeWebhookConfig = Boolean(stripeSecretKey && stripeWebhookSecret);

export function getAppBaseUrl() {
  const raw =
    process.env.APP_BASE_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");
  const url = raw.trim().replace(/\/+$/, "");

  return url || "http://localhost:3000";
}

function readPositiveInteger(value: string | undefined, fallback: number) {
  const parsed = Number(value);

  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}
