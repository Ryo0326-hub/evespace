"use client";

import { createBrowserClient } from "@supabase/ssr";
import {
  hasSupabaseConfig,
  supabasePublishableKey,
  supabaseUrl,
} from "@/lib/supabase/config";

export function getSupabaseBrowserClient() {
  if (!hasSupabaseConfig) {
    return null;
  }

  return createBrowserClient(supabaseUrl, supabasePublishableKey);
}
