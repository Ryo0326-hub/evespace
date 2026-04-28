import { redirect } from "next/navigation";

export default async function EditDashboardEventPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  redirect(`/admin/official-events/${eventId}/edit`);
}
