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
    <main className="cosmic-bg evespace-page overflow-hidden">
      <div className="mx-auto mb-6 flex w-full max-w-7xl items-center justify-between gap-4">
        <p className="evespace-kicker">
          Your Planet
        </p>
      </div>
      <UserPlanet events={events} profile={profile} />
    </main>
  );
}
