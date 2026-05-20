import { redirect } from "next/navigation";
import { LinkButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { requirePlatformAdmin } from "@/lib/auth/permissions";

export default async function AdminPage() {
  try {
    await requirePlatformAdmin();
  } catch {
    redirect("/dashboard");
  }

  return (
    <main className="cosmic-bg evespace-page">
      <div className="evespace-shell max-w-5xl">
        <header className="evespace-page-header">
          <p className="evespace-kicker">
            Evespace Admin
          </p>
          <h1 className="evespace-page-title">
            Platform controls
          </h1>
        </header>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <h2 className="evespace-card-title">Official Events</h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Create, edit, and review verified public event stars.
            </p>
            <LinkButton className="mt-5" href="/admin/official-events">
              Manage Official Events
            </LinkButton>
          </Card>
          <Card>
            <h2 className="evespace-card-title">Verification</h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Approve or reject official event verification requests.
            </p>
            <LinkButton className="mt-5" href="/admin/verification">
              Review Requests
            </LinkButton>
          </Card>
        </div>
      </div>
    </main>
  );
}
