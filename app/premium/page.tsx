import { redirect } from "next/navigation";
import {
  createBillingPortalSessionAction,
  createPremiumCheckoutSessionAction,
} from "@/app/actions/premium";
import { Button, LinkButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ensureUserProfile } from "@/lib/auth/ensure-user-profile";
import { syncActivePremiumSubscriptionForProfile } from "@/lib/data/premium";
import { cleanPremiumNextPath, getPremiumStatus } from "@/lib/premium/premium-utils.mjs";

export default async function PremiumPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string; next?: string }>;
}) {
  const profile = await ensureUserProfile();

  if (!profile) {
    redirect("/login");
  }

  const params = await searchParams;
  const next = cleanPremiumNextPath(params?.next);
  let premiumStatus = getPremiumStatus(profile);

  if (!premiumStatus.isPremium) {
    premiumStatus = await syncActivePremiumSubscriptionForProfile(profile);
  }

  if (premiumStatus.isPremium && params?.next) {
    redirect(next);
  }

  return (
    <main className="cosmic-bg evespace-page">
      <div className="evespace-shell max-w-5xl">
        <header className="evespace-page-header">
          <p className="evespace-kicker">EveSpace Premium</p>
          <h1 className="evespace-page-title">Host official events and unlock stickers.</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
            Premium is required for new official event hosting and gives your
            account access to the sticker tools across memory boards.
          </p>
        </header>

        {params?.error ? (
          <div className="rounded-3xl border border-rose-300/25 bg-rose-400/10 px-4 py-3 text-sm font-medium text-rose-100">
            {params.error}
          </div>
        ) : null}

        <div className="grid gap-5 lg:grid-cols-[1fr_24rem]">
          <Card className="grid gap-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-100">
                  Monthly membership
                </p>
                <h2 className="mt-3 text-4xl font-semibold text-white">CAD $5</h2>
                <p className="mt-2 text-sm text-slate-400">per month</p>
              </div>
              {premiumStatus.isPremium ? (
                <span className="rounded-full border border-amber-200/45 bg-amber-200/15 px-3 py-1 text-xs font-semibold text-amber-100">
                  Premium Active
                </span>
              ) : null}
            </div>

            <div className="grid gap-3 text-sm leading-6 text-slate-300">
              <p>Included with EveSpace Premium:</p>
              <ul className="grid gap-2">
                <li>Official event hosting for organizations, schools, festivals, and meetups.</li>
                <li>Premium sticker access for memory boards.</li>
                <li>Self-service billing through Stripe&apos;s secure Customer Portal.</li>
              </ul>
            </div>

            {premiumStatus.isPremium ? (
              <div className="grid gap-3 sm:flex sm:flex-wrap">
                <LinkButton className="w-full sm:w-auto" href={next}>
                  Continue
                </LinkButton>
                {profile.stripeCustomerId ? (
                  <form action={createBillingPortalSessionAction}>
                    <Button className="w-full sm:w-auto" type="submit" variant="secondary">
                      Manage billing
                    </Button>
                  </form>
                ) : null}
              </div>
            ) : (
              <form action={createPremiumCheckoutSessionAction}>
                <input name="next" type="hidden" value={next} />
                <Button className="w-full sm:w-auto" type="submit">
                  Subscribe with Stripe
                </Button>
              </form>
            )}
          </Card>

          <Card className="grid content-start gap-4">
            <h2 className="evespace-card-title">Subscription status</h2>
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-sm font-semibold text-white">
                {premiumStatus.isPremium ? "Premium is active" : "Premium is not active"}
              </p>
              {premiumStatus.currentPeriodEnd ? (
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Current period ends {formatDate(premiumStatus.currentPeriodEnd)}.
                </p>
              ) : (
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Subscribe in Stripe sandbox to activate premium on this account.
                </p>
              )}
              {premiumStatus.cancelAtPeriodEnd ? (
                <p className="mt-2 text-sm leading-6 text-amber-100">
                  This subscription is set to cancel at the end of the current period.
                </p>
              ) : null}
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(new Date(value));
}
