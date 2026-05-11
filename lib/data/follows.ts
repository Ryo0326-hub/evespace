import { mapProfile } from "@/lib/data/mappers";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type {
  FollowCounts,
  FollowRelationshipStatus,
  FollowRequest,
  Profile,
} from "@/types/evespace";

export async function getFollowCounts(profileId: string): Promise<FollowCounts> {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return { followers: 0, following: 0 };
  }

  const [followers, following] = await Promise.all([
    supabase
      .from("user_follows")
      .select("id", { count: "exact", head: true })
      .eq("following_profile_id", profileId),
    supabase
      .from("user_follows")
      .select("id", { count: "exact", head: true })
      .eq("follower_profile_id", profileId),
  ]);

  return {
    followers: followers.count ?? 0,
    following: following.count ?? 0,
  };
}

export async function isFollowing(
  followerProfileId: string,
  followingProfileId: string,
) {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return false;
  }

  const { data } = await supabase
    .from("user_follows")
    .select("id")
    .eq("follower_profile_id", followerProfileId)
    .eq("following_profile_id", followingProfileId)
    .maybeSingle();

  return Boolean(data);
}

export async function getFollowRelationshipStatus(
  viewerProfileId: string,
  targetProfileId: string,
): Promise<FollowRelationshipStatus> {
  if (viewerProfileId === targetProfileId) {
    return "none";
  }

  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return "none";
  }

  const [{ data: blocked }, { data: blockedBy }, { data: follow }, { data: request }] =
    await Promise.all([
      supabase
        .from("user_blocks")
        .select("id")
        .eq("blocker_profile_id", viewerProfileId)
        .eq("blocked_profile_id", targetProfileId)
        .maybeSingle(),
      supabase
        .from("user_blocks")
        .select("id")
        .eq("blocker_profile_id", targetProfileId)
        .eq("blocked_profile_id", viewerProfileId)
        .maybeSingle(),
      supabase
        .from("user_follows")
        .select("id")
        .eq("follower_profile_id", viewerProfileId)
        .eq("following_profile_id", targetProfileId)
        .maybeSingle(),
      supabase
        .from("user_follow_requests")
        .select("id")
        .eq("requester_profile_id", viewerProfileId)
        .eq("requested_profile_id", targetProfileId)
        .eq("status", "pending")
        .maybeSingle(),
    ]);

  if (blocked) {
    return "blocked";
  }

  if (blockedBy) {
    return "blocked_by";
  }

  if (follow) {
    return "following";
  }

  if (request) {
    return "requested";
  }

  return "none";
}

export async function getIncomingFollowRequests(
  profileId: string,
): Promise<FollowRequest[]> {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("user_follow_requests")
    .select("*, requester:requester_profile_id(*)")
    .eq("requested_profile_id", profileId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) {
    logFollowDataError("Failed to load follow requests", error);
    return [];
  }

  return data.flatMap((row) => {
    const requester = Array.isArray(row.requester) ? row.requester[0] : row.requester;

    if (!requester) {
      return [];
    }

    return [
      {
        id: String(row.id),
        requester: mapProfile(requester as Record<string, unknown>),
        requestedProfileId: String(row.requested_profile_id),
        status:
          row.status === "accepted" || row.status === "denied" ? row.status : "pending",
        createdAt: String(row.created_at),
      },
    ];
  });
}

export async function getFollowingProfiles(profileId: string): Promise<Profile[]> {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("user_follows")
    .select("profiles:following_profile_id(*)")
    .eq("follower_profile_id", profileId)
    .order("created_at", { ascending: false });

  if (error) {
    logFollowDataError("Failed to load following profiles", error);
    return [];
  }

  return data
    .flatMap((row) => {
      const profiles = row.profiles;
      return Array.isArray(profiles) ? profiles : profiles ? [profiles] : [];
    })
    .map((profile) => mapProfile(profile as unknown as Record<string, unknown>));
}

export async function getFollowerProfiles(profileId: string): Promise<Profile[]> {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("user_follows")
    .select("profiles:follower_profile_id(*)")
    .eq("following_profile_id", profileId)
    .order("created_at", { ascending: false });

  if (error) {
    logFollowDataError("Failed to load follower profiles", error);
    return [];
  }

  return data
    .flatMap((row) => {
      const profiles = row.profiles;
      return Array.isArray(profiles) ? profiles : profiles ? [profiles] : [];
    })
    .map((profile) => mapProfile(profile as unknown as Record<string, unknown>));
}

export async function getBlockedProfiles(profileId: string): Promise<Profile[]> {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("user_blocks")
    .select("profiles:blocked_profile_id(*)")
    .eq("blocker_profile_id", profileId)
    .order("created_at", { ascending: false });

  if (error) {
    logFollowDataError("Failed to load blocked profiles", error);
    return [];
  }

  return data
    .flatMap((row) => {
      const profiles = row.profiles;
      return Array.isArray(profiles) ? profiles : profiles ? [profiles] : [];
    })
    .map((profile) => mapProfile(profile as unknown as Record<string, unknown>));
}

let hasWarnedAboutMissingFollowSchema = false;

function logFollowDataError(message: string, error: unknown) {
  const next = error as { code?: string; message?: string } | null;

  if (
    next?.code === "PGRST205" ||
    next?.message?.includes("Could not find the table 'public.user_follows'") ||
    next?.message?.includes("Could not find the table 'public.user_follow_requests'") ||
    next?.message?.includes("Could not find the table 'public.user_blocks'")
  ) {
    if (!hasWarnedAboutMissingFollowSchema) {
      hasWarnedAboutMissingFollowSchema = true;
      console.warn(
        "Evespace follow schema is not available yet. Run supabase/migrations/0003_boards_refinement.sql in Supabase, then refresh the app.",
      );
    }

    return;
  }

  console.warn(message, error);
}
