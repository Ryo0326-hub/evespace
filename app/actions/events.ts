"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireBoardAdmin, requirePlatformAdmin } from "@/lib/auth/permissions";
import {
  createEvent,
  getEventById,
  getManagedEvents,
  updateEvent,
} from "@/lib/data/events";
import {
  removeOfficialEventHeroImage,
  uploadOfficialEventHeroImage,
} from "@/lib/data/official-event-hero-images";
import {
  createBoardCreatedNotification,
  createFriendBoardCreatedNotifications,
  createPlanetLevelUpNotification,
} from "@/lib/data/notifications";
import { replaceScheduleItems, upsertScheduleItems } from "@/lib/data/schedules";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { resolveEventLocationInput } from "@/lib/maps/event-location";
import { generateStarCoordinate, slugify } from "@/lib/utils";
import { getPlanetLevelUp } from "@/lib/planet/planet-levels";
import { DEFAULT_BOARD_THEME, toBoardThemeId } from "@/lib/board-themes";
import type {
  BoardBackgroundTheme,
  EventInput,
  EventVerificationStatus,
  ModerationMode,
} from "@/types/evespace";

export async function createEventAction(formData: FormData) {
  const profile = await requirePlatformAdmin();

  const previousEventCount = (await getManagedEvents(profile)).length;
  const baseInput = readEventInput(formData);
  let heroImage: Awaited<ReturnType<typeof uploadOfficialEventHeroImage>>;

  try {
    heroImage = await uploadOfficialEventHeroImage({
      eventKey: baseInput.slug,
      file: formData.get("heroImage"),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Banner image upload failed.";
    redirect(`/admin/official-events/new?error=${encodeURIComponent(message)}`);
  }

  const input = await resolveEventLocationInput({
    ...baseInput,
    heroImageUrl: heroImage?.publicUrl,
    heroImageStorageBucket: heroImage?.storageBucket,
    heroImageStoragePath: heroImage?.storagePath,
  });
  const result = await createEvent(input, profile);

  if (result.data) {
    await upsertScheduleItems(result.data.id, readScheduleText(formData));
    await createBoardCreatedNotification({ board: result.data, profile });
    await createFriendBoardCreatedNotifications({ actor: profile, board: result.data });

    const levelUp = getPlanetLevelUp(previousEventCount, previousEventCount + 1);
    if (levelUp) {
      await createPlanetLevelUpNotification({ level: levelUp, profile });
    }

    revalidatePath("/");
    revalidatePath("/dashboard");
    revalidatePath("/profile");
    revalidatePath("/notifications");
    revalidatePath("/admin/official-events");
    redirect(`/admin/official-events/${result.data.id}/edit`);
  }

  if (heroImage) {
    await removeOfficialEventHeroImage({
      storageBucket: heroImage.storageBucket,
      storagePath: heroImage.storagePath,
    });
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

  const existingEvent = await getEventById(eventId);

  if (!existingEvent) {
    redirect(`/admin/official-events/${eventId}/edit?error=${encodeURIComponent("Event not found")}`);
  }

  const baseInput = readEventInput(formData);
  let heroImage: Awaited<ReturnType<typeof uploadOfficialEventHeroImage>>;

  try {
    heroImage = await uploadOfficialEventHeroImage({
      eventKey: baseInput.slug || eventId,
      file: formData.get("heroImage"),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Banner image upload failed.";
    redirect(`/admin/official-events/${eventId}/edit?error=${encodeURIComponent(message)}`);
  }

  const clearHeroImage = formData.get("clearHeroImage") === "on" && !heroImage;
  const input = await resolveEventLocationInput({
    ...baseInput,
    ...(heroImage
      ? {
          heroImageUrl: heroImage.publicUrl,
          heroImageStorageBucket: heroImage.storageBucket,
          heroImageStoragePath: heroImage.storagePath,
        }
      : clearHeroImage
        ? {
            heroImageUrl: null,
            heroImageStorageBucket: null,
            heroImageStoragePath: null,
          }
        : {}),
  });
  const result = await updateEvent(eventId, input);

  if (result.data) {
    if ((heroImage || clearHeroImage) && existingEvent.heroImageStoragePath) {
      await removeOfficialEventHeroImage({
        storageBucket: existingEvent.heroImageStorageBucket,
        storagePath: existingEvent.heroImageStoragePath,
      });
    }

    await replaceScheduleItems(eventId, readScheduleText(formData));
    revalidatePath("/");
    revalidatePath("/dashboard");
    revalidatePath("/admin/official-events");
    revalidatePath(`/events/${result.data.slug}`);
    revalidatePath(`/official-events/${result.data.id}`);
    redirect(`/admin/official-events/${eventId}/edit?saved=1`);
  }

  if (heroImage) {
    await removeOfficialEventHeroImage({
      storageBucket: heroImage.storageBucket,
      storagePath: heroImage.storagePath,
    });
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
    startTime: readOptionalDateTime(formData, "start"),
    endTime: readOptionalDateTime(formData, "end"),
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

function readOptionalDateTime(formData: FormData, prefix: "start" | "end") {
  const date = clean(formData.get(`${prefix}Date`));
  const time = clean(formData.get(`${prefix}TimeOfDay`));

  if (!date) {
    return null;
  }

  return time ? `${date}T${time}` : date;
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
  return toBoardThemeId(
    String(formData.get("boardBackgroundTheme") ?? DEFAULT_BOARD_THEME),
  );
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
