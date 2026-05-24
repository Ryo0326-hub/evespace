import "server-only";

import { eventSponsorLogosBucket } from "@/lib/constants";
import { mapOfficialEventSponsor } from "@/lib/data/mappers";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { OfficialEventSponsor } from "@/types/evespace";

const MAX_SPONSOR_LOGO_BYTES = 2 * 1024 * 1024;
const SPONSOR_LOGO_FETCH_TIMEOUT_MS = 8_000;
const SUPPORTED_SPONSOR_LOGO_TYPES = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/gif", "gif"],
  ["image/svg+xml", "svg"],
]);

type SupabaseAdminClient = NonNullable<ReturnType<typeof getSupabaseAdminClient>>;

export type OfficialEventSponsorInput = {
  name: string;
  description?: string | null;
  tier?: string | null;
  logoUrl?: string | null;
  websiteUrl?: string | null;
  sortOrder?: number;
};

export type CopiedSponsorLogo = {
  publicUrl: string;
  storageBucket: string;
  storagePath: string;
};

export async function getOfficialEventSponsors(
  boardId: string,
): Promise<OfficialEventSponsor[]> {
  const supabase = getSupabaseAdminClient() ?? getSupabaseServerClient();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("official_event_sponsors")
    .select("*")
    .eq("board_id", boardId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Failed to load official event sponsors", error);
    return [];
  }

  return data.map(mapOfficialEventSponsor);
}

export async function replaceOfficialEventSponsors(
  boardId: string,
  sponsors: OfficialEventSponsorInput[],
) {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return;
  }

  await supabase
    .from("official_event_sponsors")
    .delete()
    .eq("board_id", boardId);

  const payload = await Promise.all(
    sponsors
      .filter((sponsor) => sponsor.name.trim().length > 0)
      .map(async (sponsor, index) => {
        const copiedLogo = sponsor.logoUrl
          ? await copySponsorLogoToStorage({
              boardId,
              sourceUrl: sponsor.logoUrl,
              sponsorName: sponsor.name,
              supabase,
            }).catch(() => null)
          : null;

        return {
          board_id: boardId,
          name: sponsor.name.trim(),
          description: sponsor.description ?? null,
          tier: sponsor.tier ?? null,
          logo_url: copiedLogo?.publicUrl ?? sponsor.logoUrl ?? null,
          logo_storage_bucket: copiedLogo?.storageBucket ?? null,
          logo_storage_path: copiedLogo?.storagePath ?? null,
          website_url: sponsor.websiteUrl ?? null,
          sort_order: sponsor.sortOrder ?? index,
        };
      }),
  );

  if (payload.length === 0) {
    return;
  }

  const { error } = await supabase
    .from("official_event_sponsors")
    .insert(payload);

  if (error) {
    throw new Error(error.message);
  }
}

export async function copySponsorLogoToStorage({
  boardId,
  sourceUrl,
  sponsorName,
  supabase,
}: {
  boardId: string;
  sourceUrl: string;
  sponsorName: string;
  supabase: SupabaseAdminClient;
}): Promise<CopiedSponsorLogo> {
  if (!isPublicHttpUrl(sourceUrl)) {
    throw new Error("Sponsor logo must be a public URL.");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SPONSOR_LOGO_FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(sourceUrl, {
      headers: {
        Accept: "image/avif,image/webp,image/png,image/jpeg,image/gif,image/svg+xml;q=0.9,*/*;q=0.4",
        "User-Agent": "EveSpaceSponsorLogoImporter/1.0",
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error("Sponsor logo could not be downloaded.");
    }

    const mimeType = normalizeImageMimeType(
      response.headers.get("content-type"),
      sourceUrl,
    );

    if (!mimeType) {
      throw new Error("Sponsor logo must be an image.");
    }

    const bytes = Buffer.from(await response.arrayBuffer());

    if (bytes.byteLength > MAX_SPONSOR_LOGO_BYTES) {
      throw new Error("Sponsor logo is too large.");
    }

    const safeName = sponsorName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "sponsor";
    const storagePath = `${boardId}/${Date.now()}-${safeName}.${SUPPORTED_SPONSOR_LOGO_TYPES.get(mimeType)}`;
    const { error } = await supabase.storage
      .from(eventSponsorLogosBucket)
      .upload(storagePath, bytes, {
        contentType: mimeType,
        upsert: false,
      });

    if (error) {
      throw new Error(error.message);
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(eventSponsorLogosBucket).getPublicUrl(storagePath);

    return {
      publicUrl,
      storageBucket: eventSponsorLogosBucket,
      storagePath,
    };
  } finally {
    clearTimeout(timeout);
  }
}

function normalizeImageMimeType(contentType: string | null, sourceUrl: string) {
  const mimeType = String(contentType ?? "")
    .split(";")[0]
    .trim()
    .toLowerCase();

  if (SUPPORTED_SPONSOR_LOGO_TYPES.has(mimeType)) {
    return mimeType;
  }

  const pathname = new URL(sourceUrl).pathname.toLowerCase();

  if (pathname.endsWith(".jpg") || pathname.endsWith(".jpeg")) {
    return "image/jpeg";
  }

  if (pathname.endsWith(".png")) {
    return "image/png";
  }

  if (pathname.endsWith(".webp")) {
    return "image/webp";
  }

  if (pathname.endsWith(".gif")) {
    return "image/gif";
  }

  if (pathname.endsWith(".svg")) {
    return "image/svg+xml";
  }

  return null;
}

function isPublicHttpUrl(value: string) {
  try {
    const url = new URL(value);

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return false;
    }

    const hostname = url.hostname.toLowerCase();
    return !(
      hostname === "localhost" ||
      hostname.endsWith(".localhost") ||
      hostname === "0.0.0.0" ||
      hostname.startsWith("127.") ||
      hostname.startsWith("10.") ||
      hostname.startsWith("192.168.") ||
      /^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname)
    );
  } catch {
    return false;
  }
}
