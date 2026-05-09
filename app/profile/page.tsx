import { redirect } from "next/navigation";
import { ensureUserProfile } from "@/lib/auth/ensure-user-profile";
import { getManagedEvents } from "@/lib/data/events";
import { UserPlanet } from "@/components/profile/UserPlanet";

export default async function ProfilePage() {
  const profile = await ensureUserProfile();

  if (!profile) {
    redirect("/login");
  }

  const events = await getManagedEvents(profile);

  return (
    <main className="cosmic-bg min-h-screen overflow-hidden px-3 py-6 sm:px-8 sm:py-8">
      <div className="mx-auto mb-6 flex w-full max-w-7xl items-center justify-between gap-4">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-cyan-100">
          Your Planet
        </p>
      </div>
      <UserPlanet events={events} profile={profile} />
    </main>
  );
}
