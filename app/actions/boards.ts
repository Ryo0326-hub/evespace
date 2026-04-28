"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ensureUserProfile } from "@/lib/auth/ensure-user-profile";
import {
  canManageBoard,
  createPrivateBoard,
  deleteBoard,
  getBoardById,
  updateBoard,
} from "@/lib/data/boards";
import { slugify } from "@/lib/utils";
import type { BoardBackgroundTheme, BoardInput, BoardSharingScope } from "@/types/evespace";

export async function createPrivateBoardAction(formData: FormData) {
  const profile = await ensureUserProfile();
  if (!profile) {
    redirect("/login");
  }

  const result = await createPrivateBoard(readPrivateBoardInput(formData), profile);

  if (result.data) {
    revalidatePath("/dashboard");
    revalidatePath("/boards");
    redirect(`/boards/${result.data.id}`);
  }

  redirect(`/boards/new?error=${encodeURIComponent(result.error ?? "Save failed")}`);
}

export async function updatePrivateBoardAction(formData: FormData) {
  const profile = await ensureUserProfile();
  if (!profile) {
    redirect("/login");
  }

  const boardId = String(formData.get("boardId") ?? "");
  const board = await getBoardById(boardId);

  if (!board || !(await canManageBoard(boardId, profile))) {
    throw new Error("You cannot edit this board.");
  }

  const result = await updateBoard(boardId, readPrivateBoardInput(formData));

  if (result.data) {
    revalidatePath("/dashboard");
    revalidatePath("/boards");
    revalidatePath(`/boards/${boardId}`);
    redirect(`/boards/${boardId}?saved=1`);
  }

  redirect(`/boards/${boardId}/edit?error=${encodeURIComponent(result.error ?? "Save failed")}`);
}

export async function deletePrivateBoardAction(formData: FormData) {
  const profile = await ensureUserProfile();
  if (!profile) {
    redirect("/login");
  }

  const boardId = String(formData.get("boardId") ?? "");
  const board = await getBoardById(boardId);
  const isOwner =
    board?.ownerProfileId === profile.id || board?.ownerClerkUserId === profile.clerkUserId;

  if (
    !board ||
    board.boardType !== "private_memory" ||
    !isOwner ||
    !(await canManageBoard(boardId, profile))
  ) {
    throw new Error("You cannot delete this board.");
  }

  const result = await deleteBoard(boardId);

  if (result.error) {
    throw new Error(result.error);
  }

  revalidatePath("/dashboard");
  revalidatePath("/boards");
  revalidatePath("/");
  redirect("/dashboard");
}

function readPrivateBoardInput(formData: FormData): BoardInput {
  const title = String(formData.get("title") ?? "").trim();

  return {
    title,
    slug: slugify(String(formData.get("slug") || title)),
    description: clean(formData.get("description")),
    startTime: clean(formData.get("startTime")),
    endTime: clean(formData.get("endTime")),
    locationName: clean(formData.get("locationName")),
    boardBackgroundTheme: readBoardBackgroundTheme(formData),
    sharingScope: readSharingScope(formData),
    visibility: "private",
    verificationStatus: "not_applicable",
    moderationMode: "post_first",
  };
}

function readBoardBackgroundTheme(formData: FormData): BoardBackgroundTheme {
  const value = String(formData.get("boardBackgroundTheme") ?? "soft_cream");

  if (
    value === "pale_blue" ||
    value === "pale_pink" ||
    value === "pale_green" ||
    value === "pale_lavender"
  ) {
    return value;
  }

  return "soft_cream";
}

function readSharingScope(formData: FormData): BoardSharingScope {
  return formData.get("sharingScope") === "followers" ? "followers" : "owner_only";
}

function clean(value: FormDataEntryValue | null) {
  const next = String(value ?? "").trim();
  return next.length > 0 ? next : null;
}
