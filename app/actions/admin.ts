"use server";

import { revalidatePath } from "next/cache";
import { requirePlatformAdmin } from "@/lib/auth/permissions";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function verifyEventAction(eventId: string) {
  const profile = await requirePlatformAdmin();
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    throw new Error("Supabase service role is not configured.");
  }

  const { error } = await supabase
    .from("events")
    .update({
      verification_status: "verified",
      verification_reviewed_at: new Date().toISOString(),
      verification_reviewed_by: profile.clerkUserId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", eventId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard");
}

export async function rejectEventVerificationAction(eventId: string, notes: string) {
  const profile = await requirePlatformAdmin();
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    throw new Error("Supabase service role is not configured.");
  }

  const { error } = await supabase
    .from("events")
    .update({
      verification_status: "rejected",
      verification_reviewed_at: new Date().toISOString(),
      verification_reviewed_by: profile.clerkUserId,
      verification_notes: notes,
      updated_at: new Date().toISOString(),
    })
    .eq("id", eventId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard");
}
