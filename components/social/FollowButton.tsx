import {
  followUserAction,
  unfollowUserAction,
} from "@/app/actions/follows";
import { Button } from "@/components/ui/Button";

export function FollowButton({
  following,
  followingProfileId,
  returnPath,
}: {
  following: boolean;
  followingProfileId: string;
  returnPath: string;
}) {
  return (
    <form action={following ? unfollowUserAction : followUserAction}>
      <input name="followingProfileId" type="hidden" value={followingProfileId} />
      <input name="returnPath" type="hidden" value={returnPath} />
      <Button type="submit" variant={following ? "secondary" : "primary"}>
        {following ? "Unfollow" : "Follow"}
      </Button>
    </form>
  );
}
