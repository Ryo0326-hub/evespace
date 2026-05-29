"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ensureUserProfile } from "@/lib/auth/ensure-user-profile";
import {
  createOfficialBoard,
  deleteBoard,
  getBoardById,
} from "@/lib/data/boards";
import {
  removeOfficialEventHeroImage,
  uploadOfficialEventHeroImage,
} from "@/lib/data/official-event-hero-images";
import { replaceOfficialEventGoodsServices } from "@/lib/data/official-event-goods";
import { replaceOfficialEventSponsors } from "@/lib/data/official-event-sponsors";
import { upsertScheduleItems } from "@/lib/data/schedules";
import { DEFAULT_BOARD_THEME, toBoardThemeId } from "@/lib/board-themes";
import { resolveEventLocationInput } from "@/lib/maps/event-location";
import { getPremiumStatus } from "@/lib/premium/premium-utils.mjs";
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

  if (!getPremiumStatus(profile).isPremium) {
    redirect("/premium?next=/official-events/new");
  }

  const input = readHostedOfficialEventInput(formData);
  const scheduleItems = readScheduleItems(formData);
  let goodsServices: ReturnType<typeof readGoodsServices>;
  let sponsors: ReturnType<typeof readSponsors>;

  try {
    goodsServices = readGoodsServices(formData);
    sponsors = readSponsors(formData);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid event details.";
    redirect(`/official-events/new?error=${encodeURIComponent(message)}`);
  }

  const validationError =
    validateOfficialEventInput(input) ??
    validateScheduleItems(scheduleItems) ??
    validateGoodsServices(goodsServices) ??
    validateSponsors(sponsors);

  if (validationError) {
    redirect(`/official-events/new?error=${encodeURIComponent(validationError)}`);
  }

  let heroImage: Awaited<ReturnType<typeof uploadOfficialEventHeroImage>>;

  try {
    heroImage = await uploadOfficialEventHeroImage({
      eventKey: input.slug,
      file: formData.get("heroImage"),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Banner image upload failed.";
    redirect(`/official-events/new?error=${encodeURIComponent(message)}`);
  }

  const result = await createOfficialBoard(
    await resolveEventLocationInput({
      ...input,
      heroImageUrl: heroImage?.publicUrl,
      heroImageStorageBucket: heroImage?.storageBucket,
      heroImageStoragePath: heroImage?.storagePath,
    }),
    profile,
  );

  if (!result.data) {
    if (heroImage) {
      await removeOfficialEventHeroImage({
        storageBucket: heroImage.storageBucket,
        storagePath: heroImage.storagePath,
      });
    }

    redirect(
      `/official-events/new?error=${encodeURIComponent(
        result.error ?? "Save failed",
      )}`,
    );
  }

  await upsertScheduleItems(result.data.id, scheduleItems);
  await replaceOfficialEventGoodsServices(result.data.id, goodsServices);
  await replaceOfficialEventSponsors(result.data.id, sponsors);

  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath("/admin/official-events");
  revalidatePath("/explore");
  redirect(`/official-events/${result.data.id}?submitted=1`);
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
    boardBackgroundTheme: readBoardTheme(formData),
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
    verificationStatus: "verified",
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

function validateSponsors(items: ReturnType<typeof readSponsors>) {
  for (const item of items) {
    if (item.name.length > 150) {
      return "Sponsor names must be 150 characters or fewer.";
    }

    if ((item.description?.length ?? 0) > 1000) {
      return "Sponsor descriptions must be 1000 characters or fewer.";
    }

    if ((item.tier?.length ?? 0) > 80) {
      return "Sponsor tiers must be 80 characters or fewer.";
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

function readSponsors(formData: FormData) {
  const names = formData.getAll("sponsorName");
  const descriptions = formData.getAll("sponsorDescription");
  const tiers = formData.getAll("sponsorTier");
  const logoUrls = formData.getAll("sponsorLogoUrl");
  const websiteUrls = formData.getAll("sponsorWebsiteUrl");

  return names.flatMap((rawName, index) => {
    const name = clean(rawName);

    if (!name) {
      return [];
    }

    const logoUrl = clean(logoUrls[index] ?? null);
    const websiteUrl = clean(websiteUrls[index] ?? null);

    if ((logoUrl && !isValidUrl(logoUrl)) || (websiteUrl && !isValidUrl(websiteUrl))) {
      throw new Error("Sponsor links must be valid URLs.");
    }

    return [
      {
        name,
        description: clean(descriptions[index] ?? null),
        tier: clean(tiers[index] ?? null),
        logoUrl,
        websiteUrl,
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

function readBoardTheme(formData: FormData): BoardBackgroundTheme {
  return toBoardThemeId(
    String(formData.get("boardBackgroundTheme") ?? DEFAULT_BOARD_THEME),
  );
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
