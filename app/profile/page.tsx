import Image from "next/image";
import { redirect } from "next/navigation";
import { ensureUserProfile } from "@/lib/auth/ensure-user-profile";
import { getManagedEvents } from "@/lib/data/events";
import { Card } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";
import { compactDateLocation } from "@/lib/utils";

export default async function ProfilePage() {
  const profile = await ensureUserProfile();

  if (!profile) {
    redirect("/login");
  }

  const events = await getManagedEvents(profile.clerkUserId);

  return (
    <main className="cosmic-bg min-h-screen px-4 py-8 sm:px-8">
      <div className="mx-auto grid max-w-5xl gap-6">
        <Card className="grid gap-5 sm:grid-cols-[auto_1fr] sm:items-center">
          {profile.avatarUrl ? (
            <Image
              alt={profile.displayName ?? "Profile avatar"}
              className="size-20 rounded-full border border-white/20"
              height={80}
              src={profile.avatarUrl}
              unoptimized
              width={80}
            />
          ) : (
            <div className="flex size-20 items-center justify-center rounded-full border border-white/20 bg-white/10 text-2xl font-semibold">
              {(profile.displayName ?? "E").slice(0, 1)}
            </div>
          )}
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-cyan-100">
              Profile
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-white">
              {profile.displayName}
            </h1>
            <p className="mt-1 text-sm text-slate-400">{profile.email}</p>
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-semibold text-white">Events Managed</h2>
          <p className="mt-2 text-4xl font-semibold text-cyan-100">
            {events.length}
          </p>
        </Card>

        <Card>
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-semibold text-white">Your Event Stars</h2>
            <LinkButton href="/dashboard" variant="secondary">
              Open Dashboard
            </LinkButton>
          </div>
          <div className="mt-5 grid gap-3">
            {events.map((event) => (
              <div
                className="rounded-2xl border border-white/10 bg-white/[0.05] p-4"
                key={event.id}
              >
                <p className="font-semibold text-white">{event.title}</p>
                <p className="mt-1 text-sm text-slate-400">
                  {compactDateLocation(event.startTime, event.locationName)}
                </p>
              </div>
            ))}
            {events.length === 0 ? (
              <p className="text-sm text-slate-400">
                You have not created any event stars yet.
              </p>
            ) : null}
          </div>
        </Card>
      </div>
    </main>
  );
}
