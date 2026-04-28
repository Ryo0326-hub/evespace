import { redirect } from "next/navigation";

export default async function ModerationPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  redirect(`/dashboard/events/${eventId}/moderation`);
}
