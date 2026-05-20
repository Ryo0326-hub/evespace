import { redirect } from "next/navigation";
import Link from "next/link";
import { FollowButton } from "@/components/social/FollowButton";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ensureUserProfile } from "@/lib/auth/ensure-user-profile";
import { getExploreProfiles } from "@/lib/data/profiles";
import { SearchBar } from "@/components/explore/SearchBar";

export default async function ExplorePage(props: {
  searchParams?: Promise<{ q?: string }>;
}) {
  const searchParams = await props.searchParams;
  const query = searchParams?.q?.toLowerCase() || "";
  const profile = await ensureUserProfile();

  if (!profile) {
    redirect("/login");
  }

  let profiles = await getExploreProfiles(profile);

  if (query) {
    profiles = profiles.filter(
      (p) =>
        p.displayName?.toLowerCase().includes(query) ||
        p.email?.toLowerCase().includes(query),
    );
  }

  const suggestedProfiles = profiles.slice(0, 10);

  return (
    <main className="cosmic-bg evespace-page">
      <div className="evespace-shell max-w-5xl">
        <header className="evespace-page-header">
          <p className="evespace-kicker">
            Explore
          </p>
          <h1 className="evespace-page-title">
            Find your circle
          </h1>
        </header>

        <SearchBar />

        {suggestedProfiles.length === 0 ? (
          <EmptyState
            title="No other users yet."
            description="When more people join Evespace, you will be able to follow them here."
          />
        ) : (
          <section className="evespace-section">
            <div className="evespace-section-header">
              <div>
                <p className="evespace-section-kicker">
                  Suggested
                </p>
                <h2 className="evespace-section-title mt-1">
                  Suggested people
                </h2>
              </div>
              <p className="evespace-section-count">
                {suggestedProfiles.length}/10
              </p>
            </div>

            <Card className="grid gap-3 p-3 sm:p-4">
              {suggestedProfiles.map((person) => (
                <div
                  className="grid gap-3 rounded-2xl border border-white/10 bg-white/[0.05] p-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                  key={person.id}
                >
                  <Link
                    className="flex min-w-0 items-center gap-4 transition-opacity hover:opacity-80"
                    href={`/user/${person.id}`}
                  >
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-full border border-cyan-100/25 bg-cyan-100/10 text-sm font-bold text-cyan-100 shadow-[0_0_18px_rgba(103,232,249,0.12)]">
                      {getInitials(person.displayName ?? person.email)}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-base font-semibold text-white">
                        {person.displayName ?? person.email ?? "Evespace User"}
                      </p>
                      {person.email ? (
                        <p className="truncate text-sm text-slate-400">{person.email}</p>
                      ) : null}
                    </div>
                  </Link>
                  <FollowButton
                    followingProfileId={person.id}
                    returnPath="/explore"
                    status={person.followStatus}
                  />
                </div>
              ))}
            </Card>
          </section>
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
