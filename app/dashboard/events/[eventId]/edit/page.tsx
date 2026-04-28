import { notFound, redirect } from "next/navigation";
import { EventForm } from "@/components/admin/EventForm";
import { LinkButton, Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EventVerificationBadge } from "@/components/events/EventVerificationBadge";
import {
  submitEventVerificationAction,
  updateEventAction,
} from "@/app/actions/events";
import { ensureUserProfile } from "@/lib/auth/ensure-user-profile";
import { isEventAdmin } from "@/lib/auth/permissions";
import { getEventById } from "@/lib/data/events";
import { getEventSchedules } from "@/lib/data/schedules";

export default async function EditDashboardEventPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const profile = await ensureUserProfile();
  if (!profile) {
    redirect("/login");
  }

  const { eventId } = await params;
  const [event, canEdit] = await Promise.all([
    getEventById(eventId),
    isEventAdmin(eventId, profile.clerkUserId),
  ]);

  if (!event) {
    notFound();
  }

  if (!canEdit) {
    return (
      <main className="cosmic-bg flex min-h-screen items-center justify-center px-4">
        <Card className="max-w-lg text-center">
          <h1 className="text-2xl font-semibold text-white">
            You are not an admin for this event.
          </h1>
          <p className="mt-3 text-sm text-slate-300">
            Sign in with an organizer account or ask the event owner for access.
          </p>
          <LinkButton className="mt-6" href={`/events/${event.slug}`}>
            Back to Event
          </LinkButton>
        </Card>
      </main>
    );
  }

  const schedules = await getEventSchedules(event.id);
  const scheduleText = schedules
    .map((item) =>
      [
        `${item.startTime ? item.startTime.slice(11, 16) : ""} ${item.title}`.trim(),
        item.locationName,
        item.description,
      ]
        .filter(Boolean)
        .join(" | "),
    )
    .join("\n");

  return (
    <main className="cosmic-bg min-h-screen px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <LinkButton href="/dashboard" variant="ghost">
            Back to Dashboard
          </LinkButton>
          <EventVerificationBadge status={event.verificationStatus} />
        </div>
        <header className="my-8">
          <p className="text-sm font-medium uppercase tracking-[0.35em] text-cyan-100">
            Edit Event
          </p>
          <h1 className="mt-3 text-4xl font-semibold text-white">{event.title}</h1>
        </header>
        <div className="grid gap-6">
          <EventForm
            action={updateEventAction}
            event={event}
            scheduleText={scheduleText}
          />
          {event.verificationStatus !== "verified" ? (
            <Card>
              <h2 className="text-xl font-semibold text-white">
                Event Verification
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Add an official website, social profile, or organizer email in
                the event form, then submit this event for review.
              </p>
              <form action={submitEventVerificationAction} className="mt-4">
                <input name="eventId" type="hidden" value={event.id} />
                <Button type="submit" variant="secondary">
                  Submit for Verification
                </Button>
              </form>
            </Card>
          ) : null}
        </div>
      </div>
    </main>
  );
}
