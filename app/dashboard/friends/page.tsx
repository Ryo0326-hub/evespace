import { redirect } from "next/navigation";
import {
  acceptFollowRequestAction,
  blockUserAction,
  denyFollowRequestAction,
  removeFollowerAction,
  reportUserAction,
  unblockUserAction,
  unfollowUserAction,
} from "@/app/actions/follows";
import { FriendsBoardsFeed } from "@/components/boards/FriendsBoardsFeed";
import { Card } from "@/components/ui/Card";
import { Button, LinkButton } from "@/components/ui/Button";
import { ensureUserProfile } from "@/lib/auth/ensure-user-profile";
import { getFriendBoards } from "@/lib/data/boards";
import {
  getFollowerProfiles,
  getIncomingFollowRequests,
  getFollowingProfiles,
  getBlockedProfiles,
} from "@/lib/data/follows";
import type { FollowRequest, Profile } from "@/types/evespace";

export default async function DashboardFriendsPage() {
  const profile = await ensureUserProfile();

  if (!profile) {
    redirect("/login");
  }

  const [friendBoards, following, followers, followRequests, blockedProfiles] = await Promise.all([
    getFriendBoards(profile),
    getFollowingProfiles(profile.id),
    getFollowerProfiles(profile.id),
    getIncomingFollowRequests(profile.id),
    getBlockedProfiles(profile.id),
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

        <FollowRequestList requests={followRequests} />

        <div className="grid gap-4 md:grid-cols-2">
          <ProfileList actionMode="following" title="Following" profiles={following} />
          <ProfileList actionMode="followers" title="Followers" profiles={followers} />
        </div>

        <ProfileList actionMode="blocked" title="Blocked Users" profiles={blockedProfiles} />
      </div>
    </main>
  );
}

function FollowRequestList({ requests }: { requests: FollowRequest[] }) {
  return (
    <Card>
      <h2 className="text-xl font-semibold text-white">Follow requests</h2>
      <div className="mt-4 grid gap-3">
        {requests.map((request) => {
          const displayName =
            request.requester.displayName ?? request.requester.email ?? "Evespace User";

          return (
            <div
              className="grid gap-3 rounded-2xl border border-cyan-200/20 bg-cyan-200/[0.08] px-4 py-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
              key={request.id}
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-cyan-100">
                  {displayName} requested to follow you.
                </p>
                <p className="mt-1 text-xs text-slate-300">
                  Accept or deny this request before they can see follower-only boards.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <form action={acceptFollowRequestAction}>
                  <input name="requestId" type="hidden" value={request.id} />
                  <input name="returnPath" type="hidden" value="/dashboard/friends" />
                  <Button type="submit">Accept</Button>
                </form>
                <form action={denyFollowRequestAction}>
                  <input name="requestId" type="hidden" value={request.id} />
                  <input name="returnPath" type="hidden" value="/dashboard/friends" />
                  <Button type="submit" variant="secondary">
                    Deny
                  </Button>
                </form>
              </div>
            </div>
          );
        })}
        {requests.length === 0 ? (
          <p className="text-sm text-slate-300">
            No pending follow requests.
          </p>
        ) : null}
      </div>
    </Card>
  );
}

function ProfileList({
  actionMode,
  title,
  profiles,
}: {
  actionMode: "following" | "followers" | "blocked";
  title: string;
  profiles: Profile[];
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
            <div className="mt-3 flex flex-wrap gap-2">
              {actionMode === "blocked" ? (
                <form action={unblockUserAction}>
                  <input name="blockedProfileId" type="hidden" value={profile.id} />
                  <input name="returnPath" type="hidden" value="/dashboard/friends" />
                  <Button type="submit" variant="secondary">
                    Unblock
                  </Button>
                </form>
              ) : (
                <>
                  {actionMode === "following" ? (
                    <form action={unfollowUserAction}>
                      <input name="followingProfileId" type="hidden" value={profile.id} />
                      <input name="returnPath" type="hidden" value="/dashboard/friends" />
                      <Button type="submit" variant="secondary">
                        Unfollow
                      </Button>
                    </form>
                  ) : (
                    <form action={removeFollowerAction}>
                      <input name="followerProfileId" type="hidden" value={profile.id} />
                      <input name="returnPath" type="hidden" value="/dashboard/friends" />
                      <Button type="submit" variant="secondary">
                        Remove follower
                      </Button>
                    </form>
                  )}
                  <form action={blockUserAction}>
                    <input name="blockedProfileId" type="hidden" value={profile.id} />
                    <input name="returnPath" type="hidden" value="/dashboard/friends" />
                    <Button type="submit" variant="danger">
                      Block
                    </Button>
                  </form>
                </>
              )}
              <form action={reportUserAction}>
                <input name="reportedProfileId" type="hidden" value={profile.id} />
                <input name="returnPath" type="hidden" value="/dashboard/friends" />
                <input name="reason" type="hidden" value={`Reported from ${title}.`} />
                <Button type="submit" variant="ghost">
                  Report
                </Button>
              </form>
            </div>
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
