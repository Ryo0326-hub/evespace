import { mapProfile } from "@/lib/data/mappers";
import { orderSuggestedExploreProfiles } from "@/lib/data/profile-suggestions.mjs";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type { FollowRelationshipStatus, Profile } from "@/types/evespace";

export type ExploreProfile = Profile & {
  followStatus: FollowRelationshipStatus;
};

export async function getExploreProfiles(profile: Profile): Promise<ExploreProfile[]> {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return [];
  }

  const [
    { data: profiles, error: profilesError },
    { data: follows },
    { data: requests },
    { data: blocks },
    { data: blockedBy },
  ] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("*")
        .neq("id", profile.id)
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("user_follows")
        .select("following_profile_id")
        .eq("follower_profile_id", profile.id),
      supabase
        .from("user_follow_requests")
        .select("requested_profile_id")
        .eq("requester_profile_id", profile.id)
        .eq("status", "pending"),
      supabase
        .from("user_blocks")
        .select("blocked_profile_id")
        .eq("blocker_profile_id", profile.id),
      supabase
        .from("user_blocks")
        .select("blocker_profile_id")
        .eq("blocked_profile_id", profile.id),
    ]);

  if (profilesError) {
    logProfileDataError("Failed to load explore profiles", profilesError);
    return [];
  }

  const followingIds = new Set(
    (follows ?? []).map((follow) => String(follow.following_profile_id)),
  );
  const requestedIds = new Set(
    (requests ?? []).map((request) => String(request.requested_profile_id)),
  );
  const blockedIds = new Set(
    (blocks ?? []).map((block) => String(block.blocked_profile_id)),
  );
  const blockedByIds = new Set(
    (blockedBy ?? []).map((block) => String(block.blocker_profile_id)),
  );

  const exploreProfiles = profiles.map((row) => {
    const nextProfile = mapProfile(row);

    let followStatus: FollowRelationshipStatus = "none";

    if (blockedIds.has(nextProfile.id)) {
      followStatus = "blocked";
    } else if (blockedByIds.has(nextProfile.id)) {
      followStatus = "blocked_by";
    } else if (followingIds.has(nextProfile.id)) {
      followStatus = "following";
    } else if (requestedIds.has(nextProfile.id)) {
      followStatus = "requested";
    }

    return {
      ...nextProfile,
      followStatus,
    };
  });

  return orderSuggestedExploreProfiles(exploreProfiles);
}

export async function getProfileById(profileId: string): Promise<Profile | null> {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", profileId)
    .maybeSingle();

  if (error || !data) {
    if (error) {
      logProfileDataError("Failed to load profile by id", error);
    }
    return null;
  }

  return mapProfile(data);
}

function logProfileDataError(message: string, error: unknown) {
  const next = error as { code?: string; message?: string } | null;

  if (
    next?.code === "PGRST205" ||
    next?.message?.includes("Could not find the table 'public.profiles'")
  ) {
    console.warn("Evespace profiles schema is not available yet.");
    return;
  }

  console.warn(message, error);
}
