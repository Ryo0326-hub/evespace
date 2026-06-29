import Image from "next/image";
import { LinkButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { cleanPremiumNextPath } from "@/lib/premium/premium-utils.mjs";

export default async function PremiumPage({
  searchParams,
}: {
  searchParams?: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const next = cleanPremiumNextPath(params?.next);

  return (
    <main className="cosmic-bg evespace-page">
      <div className="evespace-shell max-w-5xl">
        <header className="evespace-page-header">
          <p className="evespace-kicker">EveSpace Premium</p>
          <h1 className="evespace-page-title">Premium stickers are coming later.</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
            We are holding off on payment setup until EveSpace has a stronger
            artist-made sticker collection. For now, checkout and billing are
            intentionally unavailable.
          </p>
        </header>

        <div className="grid gap-5 lg:grid-cols-[1fr_24rem]">
          <Card className="grid gap-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-100">
                  Membership
                </p>
                <h2 className="mt-3 text-4xl font-semibold text-white">Not for sale yet</h2>
                <p className="mt-2 text-sm text-slate-400">
                  Payment setup will come back when the sticker catalog is ready.
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200/45 bg-amber-200/15 px-3 py-1 text-xs font-semibold text-amber-100">
                <Image
                  alt=""
                  aria-hidden="true"
                  className="h-5 w-5 object-contain"
                  height={20}
                  src="/dashboard-icons/premium.png"
                  width={20}
                />
                Later
              </span>
            </div>

            <div className="grid gap-3 text-sm leading-6 text-slate-300">
              <p>Planned for a future Premium launch:</p>
              <ul className="grid gap-2">
                <li>Official event hosting for organizations, schools, festivals, and meetups.</li>
                <li>Artist-made sticker packs for memory boards.</li>
                <li>A clean payment and account management flow once the catalog is worth charging for.</li>
              </ul>
            </div>

            <div className="grid gap-3 sm:flex sm:flex-wrap">
              <LinkButton className="w-full sm:w-auto" href="/dashboard">
                Back to dashboard
              </LinkButton>
              {params?.next ? (
                <LinkButton className="w-full sm:w-auto" href={next} variant="secondary">
                  Continue anyway
                </LinkButton>
              ) : null}
            </div>
          </Card>

          <Card className="grid content-start gap-4">
            <h2 className="evespace-card-title">Payment status</h2>
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-sm font-semibold text-white">
                Checkout is disabled
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                There is no payment provider, webhook, checkout session, or billing
                portal connected to this app right now.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}
