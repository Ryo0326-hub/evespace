import Image from "next/image";
import Link from "next/link";
import { FollowButton } from "@/components/social/FollowButton";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { SearchBar } from "@/components/explore/SearchBar";
import { getExploreProfiles } from "@/lib/data/profiles";
import type { Profile } from "@/types/evespace";

export async function ExploreView({ profile, query }: { profile: Profile; query: string }) {
  let profiles = await getExploreProfiles(profile);

  if (query) {
    profiles = profiles.filter(
      (person) =>
        person.displayName?.toLowerCase().includes(query) ||
        person.email?.toLowerCase().includes(query),
    );
  }

  const suggestedProfiles = profiles.slice(0, 10);

  return (
    <div className="grid gap-6">
      <SearchBar />
      {suggestedProfiles.length === 0 ? (
        <EmptyState
          title="No other users yet."
          description="When more people join Evespace, you will be able to follow them here."
        />
      ) : (
        <section className="evespace-section">
          <div className="evespace-section-header">
            <h2 className="text-lg font-semibold text-white">Suggested people</h2>
            <p className="evespace-section-count">{suggestedProfiles.length}/10</p>
          </div>
          <Card className="grid gap-2 p-2 sm:p-3">
            {suggestedProfiles.map((person) => (
              <div
                className="grid gap-3 rounded-2xl px-2 py-2.5 transition hover:bg-white/[0.055] sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                key={person.id}
              >
                <Link
                  className="flex min-w-0 items-center gap-3 transition-opacity hover:opacity-80"
                  href={`/user/${person.id}`}
                >
                  {person.avatarUrl ? (
                    <Image
                      alt={`${person.displayName ?? "User"} avatar`}
                      className="size-12 shrink-0 rounded-full border border-white/15 object-cover"
                      height={48}
                      src={person.avatarUrl}
                      unoptimized
                      width={48}
                    />
                  ) : (
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-full border border-cyan-100/25 bg-cyan-100/10 text-sm font-bold text-cyan-100">
                      {getInitials(person.displayName ?? person.email)}
                    </span>
                  )}
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-white">
                      {person.displayName ?? person.email ?? "Evespace User"}
                    </span>
                    {person.email ? (
                      <span className="block truncate text-xs text-slate-400">{person.email}</span>
                    ) : null}
                  </span>
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
  );
}

function getInitials(value?: string | null) {
  if (!value) return "EV";
  return (
    value
      .split(/[ @._-]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "EV"
  );
}
