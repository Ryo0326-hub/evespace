"use server";

import { revalidatePath } from "next/cache";
import { ensureUserProfile } from "@/lib/auth/ensure-user-profile";
import {
  createFollowNotifications,
  createFollowRequestedNotification,
} from "@/lib/data/notifications";
import { mapProfile } from "@/lib/data/mappers";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

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

  const [{ data: existingFollow }, { data: blocked }, { data: blockedBy }] =
    await Promise.all([
      supabase
        .from("user_follows")
        .select("id")
        .eq("follower_profile_id", profile.id)
        .eq("following_profile_id", followingProfile.id)
        .maybeSingle(),
      supabase
        .from("user_blocks")
        .select("id")
        .eq("blocker_profile_id", profile.id)
        .eq("blocked_profile_id", followingProfile.id)
        .maybeSingle(),
      supabase
        .from("user_blocks")
        .select("id")
        .eq("blocker_profile_id", followingProfile.id)
        .eq("blocked_profile_id", profile.id)
        .maybeSingle(),
    ]);

  if (existingFollow || blocked || blockedBy) {
    revalidateFollowPaths(returnPath);
    return;
  }


  const { data: request, error: requestError } = await supabase
    .from("user_follow_requests")
    .upsert(
      {
        requester_profile_id: profile.id,
        requested_profile_id: followingProfile.id,
        requester_clerk_user_id: profile.clerkUserId,
        requested_clerk_user_id: followingProfile.clerk_user_id,
        status: "pending",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "requester_profile_id,requested_profile_id" },
    )
    .select("*")
    .single();

  if (requestError) {
    throw new Error(requestError.message);
  }

  await createFollowRequestedNotification({
    request,
    requested: mapProfile(followingProfile),
    requester: profile,
  });

  revalidateFollowPaths(returnPath);
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

  revalidateFollowPaths(returnPath);
}

export async function acceptFollowRequestAction(formData: FormData) {
  const profile = await ensureUserProfile();
  const requestId = String(formData.get("requestId") ?? "");
  const returnPath = String(formData.get("returnPath") ?? "/dashboard/friends");

  if (!profile || !requestId) {
    return;
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    throw new Error("Supabase service role is not configured.");
  }

  const { data: request, error } = await supabase
    .from("user_follow_requests")
    .select("*, requester:requester_profile_id(*)")
    .eq("id", requestId)
    .eq("requested_profile_id", profile.id)
    .eq("status", "pending")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!request) {
    revalidateFollowPaths(returnPath);
    return;
  }

  const requester = Array.isArray(request.requester)
    ? request.requester[0]
    : request.requester;

  const { error: followError } = await supabase.from("user_follows").upsert(
    {
      follower_profile_id: request.requester_profile_id,
      following_profile_id: profile.id,
      follower_clerk_user_id: request.requester_clerk_user_id,
      following_clerk_user_id: profile.clerkUserId,
    },
    { onConflict: "follower_profile_id,following_profile_id" },
  );

  if (followError) {
    throw new Error(followError.message);
  }

  const acceptedAt = new Date().toISOString();
  const { error: updateError } = await supabase
    .from("user_follow_requests")
    .update({ status: "accepted", updated_at: acceptedAt })
    .eq("id", requestId);

  if (updateError) {
    throw new Error(updateError.message);
  }

  if (requester) {
    await createFollowNotifications({
      acceptedAt,
      follower: mapProfile(requester as Record<string, unknown>),
      following: profile,
    });
  }

  revalidateFollowPaths(returnPath);
  revalidatePath("/notifications");
}

export async function denyFollowRequestAction(formData: FormData) {
  const profile = await ensureUserProfile();
  const requestId = String(formData.get("requestId") ?? "");
  const returnPath = String(formData.get("returnPath") ?? "/dashboard/friends");

  if (!profile || !requestId) {
    return;
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    throw new Error("Supabase service role is not configured.");
  }

  const { error } = await supabase
    .from("user_follow_requests")
    .update({ status: "denied", updated_at: new Date().toISOString() })
    .eq("id", requestId)
    .eq("requested_profile_id", profile.id)
    .eq("status", "pending");

  if (error) {
    throw new Error(error.message);
  }

  revalidateFollowPaths(returnPath);
  revalidatePath("/notifications");
}

export async function removeFollowerAction(formData: FormData) {
  const profile = await ensureUserProfile();
  const followerProfileId = String(formData.get("followerProfileId") ?? "");
  const returnPath = String(formData.get("returnPath") ?? "/dashboard/friends");

  if (!profile || !followerProfileId) {
    return;
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    throw new Error("Supabase service role is not configured.");
  }

  await supabase
    .from("user_follows")
    .delete()
    .eq("follower_profile_id", followerProfileId)
    .eq("following_profile_id", profile.id);

  revalidateFollowPaths(returnPath);
}

export async function blockUserAction(formData: FormData) {
  const profile = await ensureUserProfile();
  const blockedProfileId = String(formData.get("blockedProfileId") ?? "");
  const returnPath = String(formData.get("returnPath") ?? "/dashboard/friends");

  if (!profile || !blockedProfileId || blockedProfileId === profile.id) {
    return;
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    throw new Error("Supabase service role is not configured.");
  }

  const { data: blockedProfile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", blockedProfileId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!blockedProfile?.clerk_user_id) {
    return;
  }

  const { error: blockError } = await supabase.from("user_blocks").upsert(
    {
      blocker_profile_id: profile.id,
      blocked_profile_id: blockedProfile.id,
      blocker_clerk_user_id: profile.clerkUserId,
      blocked_clerk_user_id: blockedProfile.clerk_user_id,
    },
    { onConflict: "blocker_profile_id,blocked_profile_id" },
  );

  if (blockError) {
    throw new Error(blockError.message);
  }

  await Promise.all([
    supabase
      .from("user_follows")
      .delete()
      .eq("follower_profile_id", profile.id)
      .eq("following_profile_id", blockedProfile.id),
    supabase
      .from("user_follows")
      .delete()
      .eq("follower_profile_id", blockedProfile.id)
      .eq("following_profile_id", profile.id),
    supabase
      .from("user_follow_requests")
      .update({ status: "denied", updated_at: new Date().toISOString() })
      .or(
        `and(requester_profile_id.eq.${profile.id},requested_profile_id.eq.${blockedProfile.id}),and(requester_profile_id.eq.${blockedProfile.id},requested_profile_id.eq.${profile.id})`,
      ),
  ]);

  revalidateFollowPaths(returnPath);
}

export async function reportUserAction(formData: FormData) {
  const profile = await ensureUserProfile();
  const reportedProfileId = String(formData.get("reportedProfileId") ?? "");
  const reason = clean(String(formData.get("reason") ?? ""));
  const returnPath = String(formData.get("returnPath") ?? "/dashboard/friends");

  if (!profile || !reportedProfileId || reportedProfileId === profile.id) {
    return;
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    throw new Error("Supabase service role is not configured.");
  }

  const { data: reportedProfile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", reportedProfileId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!reportedProfile?.clerk_user_id) {
    return;
  }

  const { error: reportError } = await supabase.from("user_reports").insert({
    reporter_profile_id: profile.id,
    reported_profile_id: reportedProfile.id,
    reporter_clerk_user_id: profile.clerkUserId,
    reported_clerk_user_id: reportedProfile.clerk_user_id,
    reason,
  });

  if (reportError) {
    throw new Error(reportError.message);
  }

  revalidateFollowPaths(returnPath);
}

export async function unblockUserAction(formData: FormData) {
  const profile = await ensureUserProfile();
  const blockedProfileId = String(formData.get("blockedProfileId") ?? "");
  const returnPath = String(formData.get("returnPath") ?? "/dashboard/friends");

  if (!profile || !blockedProfileId) {
    return;
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    throw new Error("Supabase service role is not configured.");
  }

  await supabase
    .from("user_blocks")
    .delete()
    .eq("blocker_profile_id", profile.id)
    .eq("blocked_profile_id", blockedProfileId);

  revalidateFollowPaths(returnPath);
}

function revalidateFollowPaths(returnPath: string) {
  revalidatePath(returnPath);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/friends");
  revalidatePath("/explore");
}

function clean(value: string) {
  const next = value.trim();
  return next.length > 0 ? next.slice(0, 500) : null;
}
