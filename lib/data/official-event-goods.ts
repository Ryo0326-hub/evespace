import { mapOfficialEventGoodsService } from "@/lib/data/mappers";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { OfficialEventGoodsService } from "@/types/evespace";

export type OfficialEventGoodsServiceInput = {
  name: string;
  description?: string | null;
  price?: string | null;
  imageUrl?: string | null;
  externalLink?: string | null;
  sortOrder?: number;
};

export async function getOfficialEventGoodsServices(
  boardId: string,
): Promise<OfficialEventGoodsService[]> {
  const supabase = getSupabaseAdminClient() ?? getSupabaseServerClient();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("official_event_goods_services")
    .select("*")
    .eq("board_id", boardId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Failed to load official event goods/services", error);
    return [];
  }

  return data.map(mapOfficialEventGoodsService);
}

export async function replaceOfficialEventGoodsServices(
  boardId: string,
  items: OfficialEventGoodsServiceInput[],
) {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return;
  }

  await supabase
    .from("official_event_goods_services")
    .delete()
    .eq("board_id", boardId);

  const payload = items
    .filter((item) => item.name.trim().length > 0)
    .map((item, index) => ({
      board_id: boardId,
      name: item.name.trim(),
      description: item.description ?? null,
      price: item.price ?? null,
      image_url: item.imageUrl ?? null,
      external_link: item.externalLink ?? null,
      sort_order: item.sortOrder ?? index,
    }));

  if (payload.length === 0) {
    return;
  }

  const { error } = await supabase
    .from("official_event_goods_services")
    .insert(payload);

  if (error) {
    throw new Error(error.message);
  }
}
