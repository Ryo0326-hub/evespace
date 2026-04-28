import "server-only";

import { auth } from "@clerk/nextjs/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { ensureUserProfile } from "@/lib/auth/ensure-user-profile";

export async function getCurrentClerkUserId() {
  const { userId } = await auth();
  return userId;
}

export async function requireAuth() {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Authentication required.");
  }

  return userId;
}

export async function isEventAdmin(eventId: string, clerkUserId: string) {
  return isBoardAdmin(eventId, clerkUserId);
}

export async function isBoardAdmin(boardId: string, clerkUserId: string) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return false;
  }

  const [{ data: member }, { data: profile }] = await Promise.all([
    supabase
      .from("board_members")
      .select("id")
      .eq("board_id", boardId)
      .eq("clerk_user_id", clerkUserId)
      .in("role", ["owner", "admin"])
      .maybeSingle(),
    supabase
      .from("profiles")
      .select("role")
      .eq("clerk_user_id", clerkUserId)
      .maybeSingle(),
  ]);

  return (
    Boolean(member) ||
    profile?.role === "platform_admin" ||
    profile?.role === "super_admin"
  );
}

export async function requireEventAdmin(eventId: string) {
  return requireBoardAdmin(eventId);
}

export async function requireBoardAdmin(boardId: string) {
  const clerkUserId = await requireAuth();

  if (!(await isBoardAdmin(boardId, clerkUserId))) {
    throw new Error("You are not an admin for this board.");
  }

  return clerkUserId;
}

export async function isPlatformAdmin(clerkUserId: string) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return false;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("clerk_user_id", clerkUserId)
    .maybeSingle();

  if (error) {
    return false;
  }

  return data?.role === "platform_admin" || data?.role === "super_admin";
}

export async function requirePlatformAdmin() {
  const profile = await ensureUserProfile();

  if (
    !profile ||
    (profile.role !== "platform_admin" && profile.role !== "super_admin")
  ) {
    throw new Error("Platform admin access required.");
  }

  return profile;
}
