import { redirect } from "next/navigation";
import { createHostedOfficialEventAction } from "@/app/actions/official-events";
import { OfficialEventHostForm } from "@/components/official-events/OfficialEventHostForm";
import { LinkButton } from "@/components/ui/Button";
import { ensureUserProfile } from "@/lib/auth/ensure-user-profile";

export default async function NewHostedOfficialEventPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const profile = await ensureUserProfile();

  if (!profile) {
    redirect("/login");
  }

  const error = (await searchParams)?.error;

  return (
    <main className="cosmic-bg min-h-screen overflow-x-hidden px-3 py-5 sm:px-8 sm:py-8">
      <div className="mx-auto grid w-full max-w-6xl gap-6">
        <nav>
          <LinkButton href="/dashboard" variant="ghost">
            Back to Dashboard
          </LinkButton>
        </nav>

        <header className="relative overflow-hidden rounded-[2rem] border border-cyan-100/15 bg-slate-950/70 px-5 py-8 shadow-2xl shadow-cyan-950/20 sm:px-8 sm:py-10">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(103,232,249,0.18),transparent_32%),radial-gradient(circle_at_82%_0%,rgba(168,85,247,0.14),transparent_30%)]" />
          <div className="relative max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.34em] text-cyan-100">
              Host an official event
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-6xl">
              Broadcast an event star.
            </h1>
            <p className="mt-5 text-sm leading-7 text-slate-300 sm:text-base">
              Create a public event page for an organization, school event,
              festival, meetup, or large gathering. EveSpace can verify official
              events later so they display a verified label in search.
            </p>
          </div>
        </header>

        {error ? (
          <div className="rounded-3xl border border-rose-300/25 bg-rose-400/10 px-4 py-3 text-sm font-medium text-rose-100">
            {error}
          </div>
        ) : null}

        <OfficialEventHostForm action={createHostedOfficialEventAction} />
      </div>
    </main>
  );
}
