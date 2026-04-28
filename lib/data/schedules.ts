import { mapSchedule } from "@/lib/data/mappers";
import { mockSchedules } from "@/lib/mock-data";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { EventSchedule } from "@/types/evespace";

export async function getEventSchedules(eventId: string): Promise<EventSchedule[]> {
  const supabase = getSupabaseAdminClient() ?? getSupabaseServerClient();

  if (!supabase) {
    return mockSchedules
      .filter((schedule) => schedule.eventId === eventId)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  const { data, error } = await supabase
    .from("event_schedules")
    .select("*")
    .eq("event_id", eventId)
    .order("sort_order", { ascending: true })
    .order("start_time", { ascending: true, nullsFirst: false });

  if (error) {
    console.error("Failed to load schedules", error);
    return [];
  }

  return data.map(mapSchedule);
}

export async function upsertScheduleItems(
  eventId: string,
  items: Array<{
    title: string;
    description?: string | null;
    locationName?: string | null;
    startTime?: string | null;
    endTime?: string | null;
    sortOrder?: number;
  }>,
) {
  const supabase = getSupabaseAdminClient() ?? getSupabaseServerClient();

  if (!supabase || items.length === 0) {
    return;
  }

  await supabase.from("event_schedules").insert(
    items.map((item, index) => ({
      event_id: eventId,
      title: item.title,
      description: item.description ?? null,
      location_name: item.locationName ?? null,
      start_time: item.startTime || null,
      end_time: item.endTime || null,
      sort_order: item.sortOrder ?? index,
    })),
  );
}

export async function replaceScheduleItems(
  eventId: string,
  items: Parameters<typeof upsertScheduleItems>[1],
) {
  const supabase = getSupabaseAdminClient() ?? getSupabaseServerClient();

  if (!supabase) {
    return;
  }

  await supabase.from("event_schedules").delete().eq("event_id", eventId);
  await upsertScheduleItems(eventId, items);
}
