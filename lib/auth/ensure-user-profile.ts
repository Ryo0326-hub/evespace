import "server-only";

import { auth, currentUser } from "@clerk/nextjs/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { mapProfile } from "@/lib/data/mappers";
import type { Profile } from "@/types/evespace";

export async function ensureUserProfile(): Promise<Profile | null> {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    throw new Error("Supabase service role is not configured.");
  }

  const { data: existingProfile, error: existingError } = await supabase
    .from("profiles")
    .select("*")
    .eq("clerk_user_id", userId)
    .maybeSingle();

  if (existingError) {
    throw new Error(existingError.message);
  }

  const clerkUser = await currentUser();
  const primaryEmail =
    clerkUser?.emailAddresses.find(
      (email) => email.id === clerkUser.primaryEmailAddressId,
    )?.emailAddress ?? clerkUser?.emailAddresses[0]?.emailAddress ?? null;
  const displayName =
    [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(" ") ||
    clerkUser?.username ||
    primaryEmail?.split("@")[0] ||
    "Evespace User";

  if (existingProfile) {
    const { data, error } = await supabase
      .from("profiles")
      .update({
        display_name: displayName,
        avatar_url: clerkUser?.imageUrl ?? null,
        email: primaryEmail,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingProfile.id)
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return mapProfile(data);
  }

  const { data, error } = await supabase
    .from("profiles")
    .insert({
      clerk_user_id: userId,
      display_name: displayName,
      avatar_url: clerkUser?.imageUrl ?? null,
      email: primaryEmail,
      role: "user",
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapProfile(data);
}
