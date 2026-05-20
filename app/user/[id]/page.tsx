import { notFound, redirect } from "next/navigation";
import { ensureUserProfile } from "@/lib/auth/ensure-user-profile";
import { getUserSharedBoards } from "@/lib/data/boards";
import { getManagedEvents } from "@/lib/data/events";
import { getProfileById } from "@/lib/data/profiles";
import { getFollowCounts, getFollowRelationshipStatus } from "@/lib/data/follows";
import { DashboardBoardCard } from "@/components/boards/DashboardBoardCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { FollowButton } from "@/components/social/FollowButton";
import { UserPlanet } from "@/components/profile/UserPlanet";

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

  const [boards, managedEvents, followCounts, followStatus] = await Promise.all([
    getUserSharedBoards(id, currentUser),
    getManagedEvents(profile),
    getFollowCounts(id),
    getFollowRelationshipStatus(currentUser.id, id),
  ]);
  const planetEvents =
    currentUser.id === id
      ? managedEvents
      : managedEvents.filter(
          (event) =>
            event.visibility === "public" && event.verificationStatus === "verified",
        );

  return (
    <main className="cosmic-bg evespace-page overflow-hidden">
      <div className="evespace-shell max-w-7xl">
        <UserPlanet
          actionSlot={
            currentUser.id !== id ? (
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <FollowButton
                  followingProfileId={id}
                  returnPath={`/user/${id}`}
                  status={followStatus}
                />
              </div>
            ) : undefined
          }
          events={planetEvents}
          meta={`${followCounts.following} following · ${followCounts.followers} followers`}
          mode={currentUser.id === id ? "self" : "public"}
          profile={profile}
        />

        <div className="grid gap-8">
          <section className="evespace-section">
            <h2 className="evespace-section-title">Shared Memory Boards</h2>
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
