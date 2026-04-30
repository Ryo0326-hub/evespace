import { mapProfile } from "@/lib/data/mappers";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Profile } from "@/types/evespace";

export type ExploreProfile = Profile & {
  isFollowing: boolean;
};

export async function getExploreProfiles(profile: Profile): Promise<ExploreProfile[]> {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return [];
  }

  const [{ data: profiles, error: profilesError }, { data: follows }] =
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
    ]);

  if (profilesError) {
    logProfileDataError("Failed to load explore profiles", profilesError);
    return [];
  }

  const followingIds = new Set(
    (follows ?? []).map((follow) => String(follow.following_profile_id)),
  );

  return profiles.map((row) => {
    const nextProfile = mapProfile(row);

    return {
      ...nextProfile,
      isFollowing: followingIds.has(nextProfile.id),
    };
  });
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
