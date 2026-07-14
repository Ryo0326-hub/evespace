import {
  blockUserAction,
  followUserAction,
  reportUserAction,
  unfollowUserAction,
} from "@/app/actions/follows";
import { Button } from "@/components/ui/Button";
import { NotificationActionObserver } from "@/components/notifications/NotificationActionObserver";
import type { FollowRelationshipStatus } from "@/types/evespace";

type FollowButtonTone = "default" | "board";

export function FollowButton({
  status,
  followingProfileId,
  returnPath,
  tone = "default",
}: {
  status: FollowRelationshipStatus;
  followingProfileId: string;
  returnPath: string;
  tone?: FollowButtonTone;
}) {
  const boardTone = tone === "board";
  const buttonBase = boardTone
    ? "min-h-9 px-4 py-2 text-xs shadow-none"
    : "";

  if (status === "blocked_by") {
    return (
      <p
        className={
          boardTone
            ? "rounded-full border border-slate-200 bg-slate-100 px-4 py-2 text-xs font-bold text-slate-600"
            : "rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-slate-300"
        }
      >
        Unavailable
      </p>
    );
  }

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-2">
      {status === "requested" ? (
        <Button
          className={
            boardTone
              ? `${buttonBase} border-slate-300 bg-white text-slate-600`
              : buttonBase
          }
          disabled
          type="button"
          variant="secondary"
        >
          Requested
        </Button>
      ) : status === "blocked" ? (
        <Button
          className={
            boardTone
              ? `${buttonBase} border-rose-300 bg-rose-100 text-rose-800`
              : buttonBase
          }
          disabled
          type="button"
          variant="danger"
        >
          Blocked
        </Button>
      ) : (
        <form action={status === "following" ? unfollowUserAction : followUserAction}>
          <input name="followingProfileId" type="hidden" value={followingProfileId} />
          <input name="returnPath" type="hidden" value={returnPath} />
          <Button
            className={
              boardTone
                ? status === "following"
                  ? `${buttonBase} border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-100 hover:text-slate-950`
                  : `${buttonBase} border-cyan-500/50 bg-cyan-100 text-slate-950 shadow-[0_0_16px_rgba(8,145,178,0.16)] hover:border-cyan-500 hover:bg-cyan-200 hover:text-slate-950`
                : buttonBase
            }
            type="submit"
            variant={status === "following" ? "secondary" : "primary"}
          >
            {status === "following" ? "Unfollow" : "Request follow"}
          </Button>
          {status === "none" ? <NotificationActionObserver /> : null}
        </form>
      )}

      {status !== "blocked" ? (
        <form action={blockUserAction}>
          <input name="blockedProfileId" type="hidden" value={followingProfileId} />
          <input name="returnPath" type="hidden" value={returnPath} />
          <Button
            className={
              boardTone
                ? `${buttonBase} border-rose-300 bg-rose-100 text-rose-800 hover:border-rose-400 hover:bg-rose-200 hover:text-rose-950`
                : buttonBase
            }
            type="submit"
            variant="danger"
          >
            Block
          </Button>
        </form>
      ) : null}

      <form action={reportUserAction}>
        <input name="reportedProfileId" type="hidden" value={followingProfileId} />
        <input name="returnPath" type="hidden" value={returnPath} />
        <input name="reason" type="hidden" value="Reported from profile controls." />
        <Button
          className={
            boardTone
              ? `${buttonBase} border-slate-300 bg-slate-100 text-slate-700 hover:border-cyan-500/50 hover:bg-cyan-50 hover:text-slate-950`
              : buttonBase
          }
          type="submit"
          variant="ghost"
        >
          Report
        </Button>
      </form>
    </div>
  );
}
