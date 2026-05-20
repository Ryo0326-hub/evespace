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
import {
  createBoardCreatedNotification,
  createFriendBoardCreatedNotifications,
} from "@/lib/data/notifications";
import { slugify } from "@/lib/utils";
import { DEFAULT_BOARD_THEME, toBoardThemeId } from "@/lib/board-themes";
import type { BoardBackgroundTheme, BoardInput, BoardSharingScope } from "@/types/evespace";

export async function createPrivateBoardAction(formData: FormData) {
  const profile = await ensureUserProfile();
  if (!profile) {
    redirect("/login");
  }

  const result = await createPrivateBoard(readPrivateBoardInput(formData), profile);

  if (result.data) {
    await createBoardCreatedNotification({ board: result.data, profile });
    await createFriendBoardCreatedNotifications({ actor: profile, board: result.data });
    revalidatePath("/dashboard");
    revalidatePath("/boards");
    revalidatePath("/notifications");
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
    startTime: readOptionalDateTime(formData, "start"),
    endTime: readOptionalDateTime(formData, "end"),
    locationName: clean(formData.get("locationName")),
    boardBackgroundTheme: readBoardBackgroundTheme(formData),
    sharingScope: readSharingScope(formData),
    visibility: "private",
    verificationStatus: "not_applicable",
    moderationMode: "post_first",
  };
}

function readOptionalDateTime(formData: FormData, prefix: "start" | "end") {
  const date = clean(formData.get(`${prefix}Date`));
  const time = clean(formData.get(`${prefix}TimeOfDay`));

  if (!date) {
    return null;
  }

  return time ? `${date}T${time}` : date;
}

function readBoardBackgroundTheme(formData: FormData): BoardBackgroundTheme {
  return toBoardThemeId(String(formData.get("boardBackgroundTheme") ?? DEFAULT_BOARD_THEME));
}

function readSharingScope(formData: FormData): BoardSharingScope {
  const value = formData.get("sharingScope");

  if (value === "followers" || value === "public") {
    return value;
  }

  return "owner_only";
}

function clean(value: FormDataEntryValue | null) {
  const next = String(value ?? "").trim();
  return next.length > 0 ? next : null;
}
