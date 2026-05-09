import {
  blockUserAction,
  followUserAction,
  reportUserAction,
  unfollowUserAction,
} from "@/app/actions/follows";
import { Button } from "@/components/ui/Button";
import type { FollowRelationshipStatus } from "@/types/evespace";

export function FollowButton({
  status,
  followingProfileId,
  returnPath,
}: {
  status: FollowRelationshipStatus;
  followingProfileId: string;
  returnPath: string;
}) {
  if (status === "blocked_by") {
    return (
      <p className="rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-slate-300">
        Unavailable
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {status === "requested" ? (
        <Button disabled type="button" variant="secondary">
          Requested
        </Button>
      ) : status === "blocked" ? (
        <Button disabled type="button" variant="danger">
          Blocked
        </Button>
      ) : (
        <form action={status === "following" ? unfollowUserAction : followUserAction}>
          <input name="followingProfileId" type="hidden" value={followingProfileId} />
          <input name="returnPath" type="hidden" value={returnPath} />
          <Button type="submit" variant={status === "following" ? "secondary" : "primary"}>
            {status === "following" ? "Unfollow" : "Request follow"}
          </Button>
        </form>
      )}

      {status !== "blocked" ? (
        <form action={blockUserAction}>
          <input name="blockedProfileId" type="hidden" value={followingProfileId} />
          <input name="returnPath" type="hidden" value={returnPath} />
          <Button type="submit" variant="danger">
            Block
          </Button>
        </form>
      ) : null}

      <form action={reportUserAction}>
        <input name="reportedProfileId" type="hidden" value={followingProfileId} />
        <input name="returnPath" type="hidden" value={returnPath} />
        <input name="reason" type="hidden" value="Reported from profile controls." />
        <Button type="submit" variant="ghost">
          Report
        </Button>
      </form>
    </div>
  );
}
