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
    <main className="cosmic-bg min-h-screen px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <p className="text-sm font-medium uppercase tracking-[0.35em] text-cyan-100">
          Evespace Admin
        </p>
        <h1 className="mt-3 text-4xl font-semibold text-white">
          Platform controls
        </h1>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <Card>
            <h2 className="text-xl font-semibold text-white">Official Events</h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Create, edit, and review verified public event stars.
            </p>
            <LinkButton className="mt-5" href="/admin/official-events">
              Manage Official Events
            </LinkButton>
          </Card>
          <Card>
            <h2 className="text-xl font-semibold text-white">Verification</h2>
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
