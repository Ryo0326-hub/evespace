import { redirect } from "next/navigation";
import { FollowButton } from "@/components/social/FollowButton";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ensureUserProfile } from "@/lib/auth/ensure-user-profile";
import { getExploreProfiles } from "@/lib/data/profiles";

export default async function ExplorePage() {
  const profile = await ensureUserProfile();

  if (!profile) {
    redirect("/login");
  }

  const profiles = await getExploreProfiles(profile);

  return (
    <main className="cosmic-bg min-h-screen px-4 py-8 sm:px-8">
      <div className="mx-auto grid max-w-5xl gap-8">
        <header>
          <p className="text-sm font-medium uppercase tracking-[0.35em] text-cyan-100">
            Explore
          </p>
          <h1 className="mt-3 text-4xl font-semibold text-white">
            Discover people to follow
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
            Follow friends to see memory boards they share with followers in your
            galaxy.
          </p>
        </header>

        {profiles.length === 0 ? (
          <EmptyState
            title="No other users yet."
            description="When more people join Evespace, you will be able to follow them here."
          />
        ) : (
          <div className="grid gap-4">
            {profiles.map((person) => (
              <Card
                className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
                key={person.id}
              >
                <div className="flex min-w-0 items-center gap-4">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-full border border-white/10 bg-cyan-200/15 text-sm font-bold text-cyan-100">
                    {getInitials(person.displayName ?? person.email)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-lg font-semibold text-white">
                      {person.displayName ?? person.email ?? "Evespace User"}
                    </p>
                    {person.email ? (
                      <p className="truncate text-sm text-slate-400">{person.email}</p>
                    ) : null}
                  </div>
                </div>
                <FollowButton
                  following={person.isFollowing}
                  followingProfileId={person.id}
                  returnPath="/explore"
                />
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function getInitials(value?: string | null) {
  if (!value) {
    return "EV";
  }

  return value
    .split(/[ @._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "EV";
}
