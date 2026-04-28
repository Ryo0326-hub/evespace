"use server";

import { revalidatePath } from "next/cache";
import { ensureUserProfile } from "@/lib/auth/ensure-user-profile";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { createFollowNotifications } from "@/lib/data/notifications";
import { mapProfile } from "@/lib/data/mappers";

export async function followUserAction(formData: FormData) {
  const profile = await ensureUserProfile();
  const followingProfileId = String(formData.get("followingProfileId") ?? "");
  const returnPath = String(formData.get("returnPath") ?? "/dashboard");

  if (!profile || !followingProfileId || followingProfileId === profile.id) {
    return;
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    throw new Error("Supabase service role is not configured.");
  }

  const { data: followingProfile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", followingProfileId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!followingProfile?.clerk_user_id) {
    return;
  }

  const { data: existingFollow } = await supabase
    .from("user_follows")
    .select("id")
    .eq("follower_profile_id", profile.id)
    .eq("following_profile_id", followingProfile.id)
    .maybeSingle();

  if (existingFollow) {
    revalidatePath(returnPath);
    revalidatePath("/dashboard");
    return;
  }

  const { error: followError } = await supabase.from("user_follows").insert(
    {
      follower_profile_id: profile.id,
      following_profile_id: followingProfile.id,
      follower_clerk_user_id: profile.clerkUserId,
      following_clerk_user_id: followingProfile.clerk_user_id,
    },
  );

  if (followError) {
    throw new Error(followError.message);
  }

  await createFollowNotifications({
    follower: profile,
    following: mapProfile(followingProfile),
  });

  revalidatePath(returnPath);
  revalidatePath("/dashboard");
  revalidatePath("/notifications");
}

export async function unfollowUserAction(formData: FormData) {
  const profile = await ensureUserProfile();
  const followingProfileId = String(formData.get("followingProfileId") ?? "");
  const returnPath = String(formData.get("returnPath") ?? "/dashboard");

  if (!profile || !followingProfileId) {
    return;
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    throw new Error("Supabase service role is not configured.");
  }

  await supabase
    .from("user_follows")
    .delete()
    .eq("follower_profile_id", profile.id)
    .eq("following_profile_id", followingProfileId);

  revalidatePath(returnPath);
  revalidatePath("/dashboard");
}
