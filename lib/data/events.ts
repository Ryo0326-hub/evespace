import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { mockEvents } from "@/lib/mock-data";
import { generateStarCoordinate, slugify } from "@/lib/utils";
import { mapEvent } from "@/lib/data/mappers";
import type { Event, EventInput, Profile } from "@/types/evespace";

export async function getPublicEvents(): Promise<Event[]> {
  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    return mockEvents;
  }

  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("visibility", "public")
    .order("start_time", { ascending: true, nullsFirst: false });

  if (error) {
    console.error("Failed to load public events", error);
    return mockEvents;
  }

  return data.map(mapEvent);
}

export async function getAllAdminEvents(): Promise<Event[]> {
  const supabase = getSupabaseAdminClient() ?? getSupabaseServerClient();

  if (!supabase) {
    return mockEvents;
  }

  const { data, error } = await supabase
    .from("events")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load admin events", error);
    return [];
  }

  return data.map(mapEvent);
}

export async function getManagedEvents(clerkUserId: string): Promise<Event[]> {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("event_admins")
    .select("events(*)")
    .eq("clerk_user_id", clerkUserId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load managed events", error);
    return [];
  }

  return data
    .flatMap((row) => {
      const events = row.events;
      return Array.isArray(events) ? events : events ? [events] : [];
    })
    .map((event) => mapEvent(event as unknown as Record<string, unknown>));
}

export async function getEventBySlug(slug: string): Promise<Event | null> {
  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    return mockEvents.find((event) => event.slug === slug) ?? null;
  }

  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error) {
    console.error("Failed to load event by slug", error);
    return mockEvents.find((event) => event.slug === slug) ?? null;
  }

  return mapEvent(data);
}

export async function getEventById(eventId: string): Promise<Event | null> {
  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    return mockEvents.find((event) => event.id === eventId) ?? null;
  }

  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("id", eventId)
    .single();

  if (error) {
    console.error("Failed to load event by id", error);
    return null;
  }

  return mapEvent(data);
}

export async function createEvent(input: EventInput, profile?: Profile | null) {
  const supabase = getSupabaseAdminClient() ?? getSupabaseServerClient();

  if (!supabase) {
    return {
      data: null,
      error: "Supabase is not configured. Add environment variables before saving events.",
    };
  }

  const star = generateStarCoordinate(input.slug || input.title);

  const { data, error } = await supabase
    .from("events")
    .insert({
      title: input.title,
      slug: input.slug || slugify(input.title),
      description: input.description ?? null,
      category: input.category ?? null,
      start_time: input.startTime || null,
      end_time: input.endTime || null,
      location_name: input.locationName ?? null,
      address: input.address ?? null,
      google_maps_url: input.googleMapsUrl ?? null,
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
      selling_goods: input.sellingGoods ?? false,
      goods_description: input.goodsDescription ?? null,
      board_background_theme: input.boardBackgroundTheme ?? "space",
      moderation_mode: input.moderationMode ?? "pre_approval",
      visibility: input.visibility ?? "public",
      star_x: input.starX ?? star.x,
      star_y: input.starY ?? star.y,
      star_size: input.starSize ?? 1,
      star_brightness: input.starBrightness ?? 1,
      created_by_profile_id: profile?.id ?? null,
      created_by_clerk_user_id: profile?.clerkUserId ?? null,
      verification_status: input.verificationStatus ?? "unverified",
      verification_requested_at:
        input.verificationStatus === "pending_review"
          ? new Date().toISOString()
          : null,
      official_website_url: input.officialWebsiteUrl ?? null,
      official_social_url: input.officialSocialUrl ?? null,
      organizer_email: input.organizerEmail ?? null,
    })
    .select("*")
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  if (profile) {
    await supabase.from("event_admins").insert({
      event_id: data.id,
      profile_id: profile.id,
      clerk_user_id: profile.clerkUserId,
      role: "owner",
    });
  }

  return { data: mapEvent(data), error: null };
}

export async function updateEvent(eventId: string, input: EventInput) {
  const supabase = getSupabaseAdminClient() ?? getSupabaseServerClient();

  if (!supabase) {
    return {
      data: null,
      error: "Supabase is not configured. Add environment variables before saving events.",
    };
  }

  const { data, error } = await supabase
    .from("events")
    .update({
      title: input.title,
      slug: input.slug || slugify(input.title),
      description: input.description ?? null,
      category: input.category ?? null,
      start_time: input.startTime || null,
      end_time: input.endTime || null,
      location_name: input.locationName ?? null,
      address: input.address ?? null,
      google_maps_url: input.googleMapsUrl ?? null,
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
      selling_goods: input.sellingGoods ?? false,
      goods_description: input.goodsDescription ?? null,
      board_background_theme: input.boardBackgroundTheme ?? "space",
      moderation_mode: input.moderationMode ?? "pre_approval",
      visibility: input.visibility ?? "public",
      star_x: input.starX,
      star_y: input.starY,
      star_size: input.starSize ?? 1,
      star_brightness: input.starBrightness ?? 1,
      official_website_url: input.officialWebsiteUrl ?? null,
      official_social_url: input.officialSocialUrl ?? null,
      organizer_email: input.organizerEmail ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", eventId)
    .select("*")
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: mapEvent(data), error: null };
}
