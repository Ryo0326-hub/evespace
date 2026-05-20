"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ensureUserProfile } from "@/lib/auth/ensure-user-profile";
import { createOfficialBoard } from "@/lib/data/boards";
import { replaceOfficialEventGoodsServices } from "@/lib/data/official-event-goods";
import { upsertScheduleItems } from "@/lib/data/schedules";
import { DEFAULT_BOARD_THEME } from "@/lib/board-themes";
import { slugify } from "@/lib/utils";
import type {
  BoardBackgroundTheme,
  EventInput,
  OfficialEventPostingPermission,
  OfficialEventSharingScope,
} from "@/types/evespace";

export async function createHostedOfficialEventAction(formData: FormData) {
  const profile = await ensureUserProfile();

  if (!profile) {
    redirect("/login");
  }

  const input = readHostedOfficialEventInput(formData);
  const scheduleItems = readScheduleItems(formData);
  let goodsServices: ReturnType<typeof readGoodsServices>;

  try {
    goodsServices = readGoodsServices(formData);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid goods/services.";
    redirect(`/official-events/new?error=${encodeURIComponent(message)}`);
  }

  const validationError =
    validateOfficialEventInput(input) ??
    validateScheduleItems(scheduleItems) ??
    validateGoodsServices(goodsServices);

  if (validationError) {
    redirect(`/official-events/new?error=${encodeURIComponent(validationError)}`);
  }

  const result = await createOfficialBoard(input, profile);

  if (!result.data) {
    redirect(
      `/official-events/new?error=${encodeURIComponent(
        result.error ?? "Save failed",
      )}`,
    );
  }

  await upsertScheduleItems(result.data.id, scheduleItems);
  await replaceOfficialEventGoodsServices(result.data.id, goodsServices);

  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath("/admin/official-events");
  revalidatePath("/admin/verification");
  redirect(`/official-events/${result.data.id}?submitted=1`);
}

function readHostedOfficialEventInput(formData: FormData): EventInput {
  const title = clean(formData.get("title")) ?? "";
  const officialSharingScope = readOfficialSharingScope(formData);

  return {
    title,
    slug: `${slugify(title)}-${Date.now().toString(36)}`,
    description: clean(formData.get("description")),
    category: clean(formData.get("category")),
    locationName: clean(formData.get("locationName")),
    address: clean(formData.get("address")),
    googleMapsUrl: clean(formData.get("googleMapsUrl")),
    officialWebsiteUrl: clean(formData.get("officialWebsiteUrl")),
    accessInformation: clean(formData.get("accessInformation")),
    boardBackgroundTheme: readBoardTheme(),
    moderationMode: "post_first",
    visibility: "public",
    sharingScope: "public",
    officialSharingScope,
    postingPermission: readPostingPermission(formData),
    allowedEmails:
      officialSharingScope === "selected_people"
        ? readLines(formData.get("allowedEmails")).map((email) => email.toLowerCase())
        : [],
    allowedOrganizationDomains:
      officialSharingScope === "organization"
        ? readLines(formData.get("allowedOrganizationDomains")).map((domain) =>
            domain.toLowerCase().replace(/^@/, ""),
          )
        : [],
    verificationStatus: "pending_review",
  };
}

function validateOfficialEventInput(input: EventInput) {
  const titleLength = input.title.trim().length;
  const descriptionLength = input.description?.trim().length ?? 0;

  if (titleLength < 3 || titleLength > 100) {
    return "Event name must be 3-100 characters.";
  }

  if (descriptionLength < 20 || descriptionLength > 5000) {
    return "Event information must be 20-5000 characters.";
  }

  if (input.officialWebsiteUrl && !isValidUrl(input.officialWebsiteUrl)) {
    return "Event website must be a valid URL.";
  }

  if (input.googleMapsUrl && !isValidUrl(input.googleMapsUrl)) {
    return "Google Maps URL must be a valid URL.";
  }

  if (input.locationName && input.locationName.length > 200) {
    return "Location name must be 200 characters or fewer.";
  }

  if (input.address && input.address.length > 500) {
    return "Location address must be 500 characters or fewer.";
  }

  if (input.accessInformation && input.accessInformation.length > 3000) {
    return "Access information must be 3000 characters or fewer.";
  }

  if (
    input.officialSharingScope === "organization" &&
    (input.allowedOrganizationDomains?.length ?? 0) === 0
  ) {
    return "Add at least one organization domain.";
  }

  if (
    input.officialSharingScope === "organization" &&
    !input.allowedOrganizationDomains?.every((domain) => domain.includes("."))
  ) {
    return "Organization domains must look like example.org.";
  }

  if (
    input.officialSharingScope === "selected_people" &&
    (input.allowedEmails?.length ?? 0) === 0
  ) {
    return "Add at least one allowed email.";
  }

  if (
    input.officialSharingScope === "selected_people" &&
    !input.allowedEmails?.every(isValidEmail)
  ) {
    return "Allowed people must be entered as valid email addresses.";
  }

  return null;
}

function validateScheduleItems(items: ReturnType<typeof readScheduleItems>) {
  for (const item of items) {
    if (item.title.length > 150) {
      return "Schedule item titles must be 150 characters or fewer.";
    }

    if ((item.description?.length ?? 0) > 1000) {
      return "Schedule item descriptions must be 1000 characters or fewer.";
    }

    if ((item.locationName?.length ?? 0) > 200) {
      return "Schedule item locations must be 200 characters or fewer.";
    }
  }

  return null;
}

function validateGoodsServices(items: ReturnType<typeof readGoodsServices>) {
  for (const item of items) {
    if (item.name.length > 150) {
      return "Goods and services names must be 150 characters or fewer.";
    }

    if ((item.description?.length ?? 0) > 1000) {
      return "Goods and services descriptions must be 1000 characters or fewer.";
    }

    if ((item.price?.length ?? 0) > 50) {
      return "Goods and services prices must be 50 characters or fewer.";
    }
  }

  return null;
}

function readScheduleItems(formData: FormData) {
  const titles = formData.getAll("scheduleTitle");
  const descriptions = formData.getAll("scheduleDescription");
  const startTimes = formData.getAll("scheduleStartTime");
  const endTimes = formData.getAll("scheduleEndTime");
  const locations = formData.getAll("scheduleLocation");

  return titles.flatMap((rawTitle, index) => {
    const title = clean(rawTitle);

    if (!title) {
      return [];
    }

    return [
      {
        title,
        description: clean(descriptions[index] ?? null),
        locationName: clean(locations[index] ?? null),
        startTime: clean(startTimes[index] ?? null),
        endTime: clean(endTimes[index] ?? null),
        sortOrder: index,
      },
    ];
  });
}

function readGoodsServices(formData: FormData) {
  const names = formData.getAll("goodsName");
  const descriptions = formData.getAll("goodsDescriptionItem");
  const prices = formData.getAll("goodsPrice");
  const imageUrls = formData.getAll("goodsImageUrl");
  const externalLinks = formData.getAll("goodsExternalLink");

  return names.flatMap((rawName, index) => {
    const name = clean(rawName);

    if (!name) {
      return [];
    }

    const imageUrl = clean(imageUrls[index] ?? null);
    const externalLink = clean(externalLinks[index] ?? null);

    if ((imageUrl && !isValidUrl(imageUrl)) || (externalLink && !isValidUrl(externalLink))) {
      throw new Error("Goods and services links must be valid URLs.");
    }

    return [
      {
        name,
        description: clean(descriptions[index] ?? null),
        price: clean(prices[index] ?? null),
        imageUrl,
        externalLink,
        sortOrder: index,
      },
    ];
  });
}

function readOfficialSharingScope(formData: FormData): OfficialEventSharingScope {
  const value = String(formData.get("officialSharingScope") ?? "public");

  if (value === "selected_people" || value === "organization") {
    return value;
  }

  return "public";
}

function readPostingPermission(formData: FormData): OfficialEventPostingPermission {
  return formData.get("postingPermission") === "approved_users"
    ? "approved_users"
    : "signed_in_users";
}

function readBoardTheme(): BoardBackgroundTheme {
  return DEFAULT_BOARD_THEME;
}

function readLines(value: FormDataEntryValue | null) {
  return String(value ?? "")
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function isValidUrl(value: string) {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function clean(value: FormDataEntryValue | null) {
  const next = String(value ?? "").trim();
  return next.length > 0 ? next : null;
}
