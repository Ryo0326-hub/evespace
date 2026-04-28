import { redirect } from "next/navigation";
import { FriendsBoardsFeed } from "@/components/boards/FriendsBoardsFeed";
import { Card } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";
import { ensureUserProfile } from "@/lib/auth/ensure-user-profile";
import { getFriendBoards } from "@/lib/data/boards";
import {
  getFollowerProfiles,
  getFollowingProfiles,
} from "@/lib/data/follows";

export default async function DashboardFriendsPage() {
  const profile = await ensureUserProfile();

  if (!profile) {
    redirect("/login");
  }

  const [friendBoards, following, followers] = await Promise.all([
    getFriendBoards(profile),
    getFollowingProfiles(profile.id),
    getFollowerProfiles(profile.id),
  ]);

  return (
    <main className="cosmic-bg min-h-screen px-4 py-8 sm:px-8">
      <div className="mx-auto grid max-w-6xl gap-8">
        <header>
          <LinkButton href="/dashboard" variant="ghost">
            Back to Dashboard
          </LinkButton>
          <p className="mt-8 text-sm font-medium uppercase tracking-[0.35em] text-cyan-100">
            Friends
          </p>
          <h1 className="mt-3 text-4xl font-semibold text-white">
            Following and followers
          </h1>
        </header>

        <section className="grid gap-4">
          <h2 className="text-2xl font-semibold text-white">Friends&apos; Boards</h2>
          <FriendsBoardsFeed boards={friendBoards} />
        </section>

        <div className="grid gap-4 md:grid-cols-2">
          <ProfileList title="Following" profiles={following} />
          <ProfileList title="Followers" profiles={followers} />
        </div>
      </div>
    </main>
  );
}

function ProfileList({
  title,
  profiles,
}: {
  title: string;
  profiles: Array<{ id: string; displayName: string | null; email: string | null }>;
}) {
  return (
    <Card>
      <h2 className="text-xl font-semibold text-white">{title}</h2>
      <div className="mt-4 grid gap-3">
        {profiles.map((profile) => (
          <div
            className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3"
            key={profile.id}
          >
            <p className="font-semibold text-white">
              {profile.displayName ?? profile.email ?? "Evespace User"}
            </p>
          </div>
        ))}
        {profiles.length === 0 ? (
          <p className="text-sm text-slate-300">
            No {title.toLowerCase()} yet.
          </p>
        ) : null}
      </div>
    </Card>
  );
}
