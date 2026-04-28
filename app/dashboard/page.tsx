import { redirect } from "next/navigation";
import { ensureUserProfile } from "@/lib/auth/ensure-user-profile";
import { getManagedEvents } from "@/lib/data/events";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { LinkButton } from "@/components/ui/Button";
import { EventVerificationBadge } from "@/components/events/EventVerificationBadge";
import { compactDateLocation } from "@/lib/utils";

export default async function DashboardPage() {
  const profile = await ensureUserProfile();

  if (!profile) {
    redirect("/login");
  }

  const events = await getManagedEvents(profile.clerkUserId);

  return (
    <main className="cosmic-bg min-h-screen px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.35em] text-cyan-100">
              Dashboard
            </p>
            <h1 className="mt-3 text-4xl font-semibold text-white">
              Your Event Stars
            </h1>
          </div>
          <LinkButton href="/dashboard/events/new">Create Event Star</LinkButton>
        </header>

        {events.length === 0 ? (
          <div className="grid gap-5">
            <EmptyState
              title="You have not created any event stars yet."
              description="Create an official event page, then invite attendees to leave memories."
            />
            <LinkButton className="w-fit" href="/dashboard/events/new">
              Create Event Star
            </LinkButton>
          </div>
        ) : (
          <div className="grid gap-4">
            {events.map((event) => (
              <Card
                className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center"
                key={event.id}
              >
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="text-xl font-semibold text-white">{event.title}</p>
                    <EventVerificationBadge status={event.verificationStatus} />
                  </div>
                  <p className="mt-2 text-sm text-slate-400">
                    {compactDateLocation(event.startTime, event.locationName)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <LinkButton href={`/events/${event.slug}`} variant="ghost">
                    View
                  </LinkButton>
                  <LinkButton
                    href={`/dashboard/events/${event.id}/edit`}
                    variant="secondary"
                  >
                    Edit
                  </LinkButton>
                  <LinkButton
                    href={`/dashboard/events/${event.id}/moderation`}
                    variant="secondary"
                  >
                    Moderate
                  </LinkButton>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
