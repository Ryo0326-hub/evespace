import { LinkButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { cleanPremiumNextPath } from "@/lib/premium/premium-utils.mjs";

export default async function PremiumCancelPage({
  searchParams,
}: {
  searchParams?: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const next = cleanPremiumNextPath(params?.next);

  return (
    <main className="cosmic-bg evespace-page">
      <div className="evespace-shell max-w-3xl">
        <Card className="text-center">
          <p className="evespace-kicker">Premium</p>
          <h1 className="mt-4 text-3xl font-semibold text-white sm:text-5xl">
            Checkout canceled
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-slate-300">
            No subscription was started. You can return to premium checkout when
            you are ready to host an official event or use stickers.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <LinkButton href={`/premium?next=${encodeURIComponent(next)}`}>
              Try again
            </LinkButton>
            <LinkButton href="/dashboard" variant="secondary">
              Back to dashboard
            </LinkButton>
          </div>
        </Card>
      </div>
    </main>
  );
}
