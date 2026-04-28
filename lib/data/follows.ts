import { mapProfile } from "@/lib/data/mappers";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type { FollowCounts, Profile } from "@/types/evespace";

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

let hasWarnedAboutMissingFollowSchema = false;

function logFollowDataError(message: string, error: unknown) {
  const next = error as { code?: string; message?: string } | null;

  if (
    next?.code === "PGRST205" ||
    next?.message?.includes("Could not find the table 'public.user_follows'")
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
