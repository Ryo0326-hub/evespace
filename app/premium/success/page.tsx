import { redirect } from "next/navigation";
import { LinkButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ensureUserProfile } from "@/lib/auth/ensure-user-profile";
import { syncPremiumCheckoutSessionForProfile } from "@/lib/data/premium";
import { cleanPremiumNextPath, getPremiumStatus } from "@/lib/premium/premium-utils.mjs";

export default async function PremiumSuccessPage({
  searchParams,
}: {
  searchParams?: Promise<{ next?: string; session_id?: string }>;
}) {
  const params = await searchParams;
  const next = cleanPremiumNextPath(params?.next);
  const sessionId = String(params?.session_id ?? "").trim();
  const profile = await ensureUserProfile();

  if (!profile) {
    redirect("/login");
  }

  let premiumStatus = getPremiumStatus(profile);
  let syncError = "";

  if (!premiumStatus.isPremium && sessionId) {
    try {
      premiumStatus = await syncPremiumCheckoutSessionForProfile(sessionId, profile);
    } catch (error) {
      syncError =
        error instanceof Error
          ? error.message
          : "Premium checkout could not be confirmed.";
    }
  }

  if (premiumStatus.isPremium) {
    redirect(next);
  }

  return (
    <main className="cosmic-bg evespace-page">
      <div className="evespace-shell max-w-3xl">
        <Card className="text-center">
          <p className="evespace-kicker">Premium</p>
          <h1 className="mt-4 text-3xl font-semibold text-white sm:text-5xl">
            Checkout complete
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-slate-300">
            {syncError
              ? syncError
              : "Stripe is confirming your subscription. If your premium access does not appear immediately, check that the sandbox webhook is forwarding to this app."}
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <LinkButton href={next}>Continue</LinkButton>
            <LinkButton href="/premium" variant="secondary">
              View premium status
            </LinkButton>
          </div>
        </Card>
      </div>
    </main>
  );
}
