import { redirect, notFound } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";
import { ensureUserProfile } from "@/lib/auth/ensure-user-profile";
import { isEventAdmin } from "@/lib/auth/permissions";
import { getEventBySlug } from "@/lib/data/events";

export default async function ManageEventEntryPage({
  params,
}: {
  params: Promise<{ eventSlug: string }>;
}) {
  const { eventSlug } = await params;
  const event = await getEventBySlug(eventSlug);

  if (!event) {
    notFound();
  }

  const profile = await ensureUserProfile();
  if (!profile) {
    redirect("/login");
  }

  if (await isEventAdmin(event.id, profile.clerkUserId)) {
    redirect(`/dashboard/events/${event.id}/edit`);
  }

  return (
    <main className="cosmic-bg flex min-h-screen items-center justify-center px-4">
      <Card className="max-w-lg text-center">
        <h1 className="text-2xl font-semibold text-white">
          You are not an admin for this event.
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          Sign in with an organizer account or ask the event owner for access.
        </p>
        <LinkButton className="mt-6" href={`/events/${event.slug}`}>
          Back to Event
        </LinkButton>
      </Card>
    </main>
  );
}
