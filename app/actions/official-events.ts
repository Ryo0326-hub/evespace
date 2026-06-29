"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ensureUserProfile } from "@/lib/auth/ensure-user-profile";
import { deleteBoard, getBoardById } from "@/lib/data/boards";

export async function createHostedOfficialEventAction() {
  const profile = await ensureUserProfile();

  if (!profile) {
    redirect("/login");
  }

  redirect("/premium?next=/official-events/new");
}

export async function deleteHostedOfficialEventAction(formData: FormData) {
  const profile = await ensureUserProfile();

  if (!profile) {
    redirect("/login");
  }

  const boardId = String(formData.get("boardId") ?? "");
  const board = await getBoardById(boardId);
  const isOwner =
    board?.ownerProfileId === profile.id || board?.ownerClerkUserId === profile.clerkUserId;

  if (!board || board.boardType !== "official_event" || !isOwner) {
    throw new Error("You cannot delete this official event page.");
  }

  const result = await deleteBoard(board.id);

  if (result.error) {
    throw new Error(result.error);
  }

  revalidatePath("/");
  revalidatePath("/explore");
  revalidatePath("/dashboard");
  revalidatePath("/admin/official-events");
  revalidatePath(`/official-events/${board.id}`);
  revalidatePath(`/events/${board.slug}`);
  redirect("/dashboard");
}
