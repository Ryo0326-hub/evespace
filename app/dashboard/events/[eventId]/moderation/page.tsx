import { notFound, redirect } from "next/navigation";
import { moderatePostAction } from "@/app/actions/memories";
import { ModerationQueue } from "@/components/admin/ModerationQueue";
import { Card } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";
import { ensureUserProfile } from "@/lib/auth/ensure-user-profile";
import { isEventAdmin } from "@/lib/auth/permissions";
import { getEventById } from "@/lib/data/events";
import { getPendingMemoryPosts } from "@/lib/data/memory-posts";

export default async function DashboardModerationPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const profile = await ensureUserProfile();
  if (!profile) {
    redirect("/login");
  }

  const { eventId } = await params;
  const [event, canModerate] = await Promise.all([
    getEventById(eventId),
    isEventAdmin(eventId, profile.clerkUserId),
  ]);

  if (!event) {
    notFound();
  }

  if (!canModerate) {
    return (
      <main className="cosmic-bg flex min-h-screen items-center justify-center px-4">
        <Card className="max-w-lg text-center">
          <h1 className="text-2xl font-semibold text-white">
            You are not an admin for this event.
          </h1>
          <LinkButton className="mt-6" href={`/events/${event.slug}`}>
            Back to Event
          </LinkButton>
        </Card>
      </main>
    );
  }

  const posts = await getPendingMemoryPosts(event.id);

  return (
    <main className="cosmic-bg min-h-screen px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <LinkButton href="/dashboard" variant="ghost">
          Back to Dashboard
        </LinkButton>
        <header className="my-8">
          <p className="text-sm font-medium uppercase tracking-[0.35em] text-cyan-100">
            Moderation
          </p>
          <h1 className="mt-3 text-4xl font-semibold text-white">{event.title}</h1>
        </header>
        <ModerationQueue action={moderatePostAction} posts={posts} />
      </div>
    </main>
  );
}
