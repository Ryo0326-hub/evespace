"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireBoardAdmin, requirePlatformAdmin } from "@/lib/auth/permissions";
import { createEvent, updateEvent } from "@/lib/data/events";
import { replaceScheduleItems, upsertScheduleItems } from "@/lib/data/schedules";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { generateStarCoordinate, slugify } from "@/lib/utils";
import type {
  BoardBackgroundTheme,
  EventInput,
  EventVerificationStatus,
  ModerationMode,
} from "@/types/evespace";

export async function createEventAction(formData: FormData) {
  const profile = await requirePlatformAdmin();

  const input = readEventInput(formData);
  const result = await createEvent(input, profile);

  if (result.data) {
    await upsertScheduleItems(result.data.id, readScheduleText(formData));
    revalidatePath("/");
    revalidatePath("/dashboard");
    revalidatePath("/admin/official-events");
    redirect(`/admin/official-events/${result.data.id}/edit`);
  }

  redirect(
    `/admin/official-events/new?error=${encodeURIComponent(
      result.error ?? "Save failed",
    )}`,
  );
}

export async function updateEventAction(formData: FormData) {
  const eventId = String(formData.get("eventId") ?? "");
  await requireBoardAdmin(eventId);

  const input = readEventInput(formData);
  const result = await updateEvent(eventId, input);

  if (result.data) {
    await replaceScheduleItems(eventId, readScheduleText(formData));
    revalidatePath("/");
    revalidatePath("/dashboard");
    revalidatePath("/admin/official-events");
    revalidatePath(`/events/${result.data.slug}`);
    redirect(`/admin/official-events/${eventId}/edit?saved=1`);
  }

  redirect(
    `/admin/official-events/${eventId}/edit?error=${encodeURIComponent(
      result.error ?? "Save failed",
    )}`,
  );
}

export async function submitEventVerificationAction(formData: FormData) {
  const eventId = String(formData.get("eventId") ?? "");
  await requireBoardAdmin(eventId);

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    throw new Error("Supabase service role is not configured.");
  }

  const { error } = await supabase
    .from("boards")
    .update({
      verification_status: "pending_review",
      verification_requested_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", eventId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard");
  revalidatePath("/admin/official-events");
  redirect(`/admin/official-events/${eventId}/edit?verification=pending`);
}

function readEventInput(formData: FormData): EventInput {
  const title = String(formData.get("title") ?? "").trim();
  const slug = slugify(String(formData.get("slug") || title));
  const star = generateStarCoordinate(slug);

  return {
    title,
    slug,
    description: clean(formData.get("description")),
    category: clean(formData.get("category")),
    startTime: clean(formData.get("startTime")),
    endTime: clean(formData.get("endTime")),
    locationName: clean(formData.get("locationName")),
    address: clean(formData.get("address")),
    googleMapsUrl: clean(formData.get("googleMapsUrl")),
    sellingGoods: formData.get("sellingGoods") === "on",
    goodsDescription: clean(formData.get("goodsDescription")),
    boardBackgroundTheme: readBoardTheme(formData),
    moderationMode: readModerationMode(formData),
    visibility: "public",
    sharingScope: "public",
    starX: star.x,
    starY: star.y,
    starSize: 1,
    starBrightness: 1,
    officialWebsiteUrl: clean(formData.get("officialWebsiteUrl")),
    officialSocialUrl: clean(formData.get("officialSocialUrl")),
    organizerEmail: clean(formData.get("organizerEmail")),
    verificationStatus: readVerificationStatus(formData),
  };
}

function readScheduleText(formData: FormData) {
  const raw = String(formData.get("scheduleText") ?? "");

  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const [timeAndTitle, locationName, description] = line
        .split("|")
        .map((part) => part.trim());
      const [time, ...titleParts] = timeAndTitle.split(" ");
      const title = titleParts.join(" ") || timeAndTitle;

      return {
        title,
        description: description || null,
        locationName: locationName || null,
        startTime: time.includes(":") ? `1970-01-01T${time}:00` : null,
        sortOrder: index,
      };
    });
}

function readBoardTheme(formData: FormData): BoardBackgroundTheme {
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

function readModerationMode(formData: FormData): ModerationMode {
  return formData.get("moderationMode") === "post_first"
    ? "post_first"
    : "pre_approval";
}

function readVerificationStatus(formData: FormData): EventVerificationStatus {
  return formData.get("submitVerification") === "on"
    ? "pending_review"
    : "unverified";
}

function clean(value: FormDataEntryValue | null) {
  const next = String(value ?? "").trim();
  return next.length > 0 ? next : null;
}
