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
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return false;
  }

  const { data, error } = await supabase
    .from("event_admins")
    .select("id")
    .eq("event_id", eventId)
    .eq("clerk_user_id", clerkUserId)
    .maybeSingle();

  if (error) {
    return false;
  }

  return Boolean(data);
}

export async function requireEventAdmin(eventId: string) {
  const clerkUserId = await requireAuth();

  if (!(await isEventAdmin(eventId, clerkUserId))) {
    throw new Error("You are not an admin for this event.");
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
