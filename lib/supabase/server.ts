import { createClient } from "@supabase/supabase-js";
import {
  hasSupabaseConfig,
  supabasePublishableKey,
  supabaseUrl,
} from "@/lib/supabase/config";

export function getSupabaseServerClient() {
  if (!hasSupabaseConfig) {
    return null;
  }

  return createClient(supabaseUrl, supabasePublishableKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
