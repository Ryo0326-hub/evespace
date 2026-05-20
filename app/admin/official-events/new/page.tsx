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
    <main className="cosmic-bg evespace-page">
      <div className="evespace-shell max-w-5xl">
        <LinkButton href="/admin/official-events" variant="ghost">
          Back to Official Events
        </LinkButton>
        <header className="evespace-page-header">
          <p className="evespace-kicker">
            Official Event
          </p>
          <h1 className="evespace-page-title">
            Create official event star
          </h1>
        </header>
        <EventForm action={createEventAction} />
      </div>
    </main>
  );
}
