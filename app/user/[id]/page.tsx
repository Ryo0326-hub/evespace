import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { ensureUserProfile } from "@/lib/auth/ensure-user-profile";
import { getUserSharedBoards } from "@/lib/data/boards";
import { getProfileById } from "@/lib/data/profiles";
import { getFollowCounts } from "@/lib/data/follows";
import { DashboardBoardCard } from "@/components/boards/DashboardBoardCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { FollowButton } from "@/components/social/FollowButton";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export default async function UserProfilePage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const currentUser = await ensureUserProfile();

  if (!currentUser) {
    redirect("/login");
  }

  const profile = await getProfileById(id);

  if (!profile) {
    notFound();
  }

  const [boards, followCounts] = await Promise.all([
    getUserSharedBoards(id, currentUser),
    getFollowCounts(id),
  ]);

  const supabase = getSupabaseAdminClient();
  let isFollowing = false;

  if (supabase) {
    const { data } = await supabase
      .from("user_follows")
      .select("id")
      .eq("follower_profile_id", currentUser.id)
      .eq("following_profile_id", id)
      .maybeSingle();

    isFollowing = Boolean(data);
  }

  return (
    <main className="cosmic-bg min-h-screen px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-center gap-6">
            {profile.avatarUrl ? (
              <Image
                alt={profile.displayName ?? "Profile avatar"}
                className="size-20 shrink-0 rounded-full border border-white/20"
                height={80}
                src={profile.avatarUrl}
                unoptimized
                width={80}
              />
            ) : (
              <div className="flex size-20 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 text-2xl font-semibold text-white">
                {(profile.displayName ?? "E").slice(0, 1)}
              </div>
            )}
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.35em] text-cyan-100">
                User Profile
              </p>
              <h1 className="mt-3 text-4xl font-semibold text-white">
                {profile.displayName ?? "Evespace User"}
              </h1>
              <p className="mt-3 text-sm text-slate-300">
                {followCounts.following} following · {followCounts.followers} followers
              </p>
            </div>
          </div>
          {currentUser.id !== id && (
            <div className="shrink-0">
              <FollowButton
                following={isFollowing}
                followingProfileId={id}
                returnPath={`/user/${id}`}
              />
            </div>
          )}
        </header>

        <div className="grid gap-8">
          <section className="grid gap-4">
            <h2 className="text-2xl font-semibold text-white">Shared Memory Boards</h2>
            {boards.length === 0 ? (
              <EmptyState
                description={`${profile.displayName ?? "This user"} has not shared any memory boards with you.`}
                title="No shared boards"
              />
            ) : (
              <div className="grid gap-4">
                {boards.map((board) => (
                  <DashboardBoardCard board={board} canDelete={false} key={board.id} />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
