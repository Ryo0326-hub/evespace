import "server-only";

import { createClient } from "@supabase/supabase-js";
import {
  hasSupabaseAdminConfig,
  supabaseServiceRoleKey,
  supabaseUrl,
} from "@/lib/supabase/config";

export function getSupabaseAdminClient() {
  if (!hasSupabaseAdminConfig) {
    return null;
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
