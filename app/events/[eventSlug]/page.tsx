import { notFound } from "next/navigation";
import { EventDetail } from "@/components/events/EventDetail";
import { getEventBySlug } from "@/lib/data/events";
import { getEventSchedules } from "@/lib/data/schedules";
import { getApprovedMemoryPosts } from "@/lib/data/memory-posts";

export default async function EventPage({
  params,
}: {
  params: Promise<{ eventSlug: string }>;
}) {
  const { eventSlug } = await params;
  const event = await getEventBySlug(eventSlug);

  if (!event) {
    notFound();
  }

  const [schedules, memoryPosts] = await Promise.all([
    getEventSchedules(event.id),
    getApprovedMemoryPosts(event.id, { limit: 3 }),
  ]);

  return (
    <EventDetail
      event={event}
      schedules={schedules}
      memoryPreview={memoryPosts}
    />
  );
}
