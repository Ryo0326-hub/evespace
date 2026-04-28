import { redirect } from "next/navigation";
import { EventForm } from "@/components/admin/EventForm";
import { createEventAction } from "@/app/actions/events";
import { ensureUserProfile } from "@/lib/auth/ensure-user-profile";
import { LinkButton } from "@/components/ui/Button";

export default async function NewDashboardEventPage() {
  const profile = await ensureUserProfile();

  if (!profile) {
    redirect("/login");
  }

  return (
    <main className="cosmic-bg min-h-screen px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <LinkButton href="/dashboard" variant="ghost">
          Back to Dashboard
        </LinkButton>
        <header className="my-8">
          <p className="text-sm font-medium uppercase tracking-[0.35em] text-cyan-100">
            Dashboard
          </p>
          <h1 className="mt-3 text-4xl font-semibold text-white">
            Create Event Star
          </h1>
        </header>
        <EventForm action={createEventAction} />
      </div>
    </main>
  );
}
