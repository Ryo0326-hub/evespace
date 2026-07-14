"use server";

import { revalidatePath } from "next/cache";
import { requireSiteOwner } from "@/lib/auth/site-owner";
import { getBoardById } from "@/lib/data/boards";
import {
  createEventVerificationNotification,
  createFriendBoardCreatedNotifications,
} from "@/lib/data/notifications";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function verifyEventAction(eventId: string) {
  const profile = await requireSiteOwner();
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    throw new Error("Supabase service role is not configured.");
  }

  const reviewedAt = new Date().toISOString();
  const { error } = await supabase
    .from("boards")
    .update({
      verification_status: "verified",
      verification_reviewed_at: reviewedAt,
      verification_reviewed_by: profile.clerkUserId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", eventId);

  if (error) {
    throw new Error(error.message);
  }

  const board = await getBoardById(eventId);
  if (board) {
    await createEventVerificationNotification({
      actor: profile,
      board,
      occurredAt: reviewedAt,
      status: "verified",
    });
    await createFriendBoardCreatedNotifications({ board });
  }

  revalidatePath("/");
  revalidatePath("/explore");
  revalidatePath("/dashboard");
  revalidatePath("/admin/official-events");
  revalidatePath("/admin/verification");
  revalidatePath("/notifications");
  revalidatePath(`/official-events/${eventId}`);
}

export async function rejectEventVerificationAction(eventId: string, notes: string) {
  const profile = await requireSiteOwner();
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    throw new Error("Supabase service role is not configured.");
  }

  const reviewedAt = new Date().toISOString();
  const { error } = await supabase
    .from("boards")
    .update({
      verification_status: "rejected",
      verification_reviewed_at: reviewedAt,
      verification_reviewed_by: profile.clerkUserId,
      verification_notes: notes,
      updated_at: new Date().toISOString(),
    })
    .eq("id", eventId);

  if (error) {
    throw new Error(error.message);
  }

  const board = await getBoardById(eventId);
  if (board) {
    await createEventVerificationNotification({
      actor: profile,
      board,
      notes,
      occurredAt: reviewedAt,
      status: "rejected",
    });
  }

  revalidatePath("/");
  revalidatePath("/explore");
  revalidatePath("/dashboard");
  revalidatePath("/admin/official-events");
  revalidatePath("/admin/verification");
  revalidatePath("/notifications");
  revalidatePath(`/official-events/${eventId}`);
}
