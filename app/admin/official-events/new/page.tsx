import { redirect } from "next/navigation";
import { createEventAction } from "@/app/actions/events";
import { EventForm } from "@/components/admin/EventForm";
import { LinkButton } from "@/components/ui/Button";
import { requirePlatformAdmin } from "@/lib/auth/permissions";

export default async function NewOfficialEventPage() {
  try {
    await requirePlatformAdmin();
  } catch {
    redirect("/dashboard");
  }

  return (
    <main className="cosmic-bg min-h-screen px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <LinkButton href="/admin/official-events" variant="ghost">
          Back to Official Events
        </LinkButton>
        <header className="my-8">
          <p className="text-sm font-medium uppercase tracking-[0.35em] text-cyan-100">
            Official Event
          </p>
          <h1 className="mt-3 text-4xl font-semibold text-white">
            Create official event star
          </h1>
        </header>
        <EventForm action={createEventAction} />
      </div>
    </main>
  );
}
