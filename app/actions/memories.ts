"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ensureUserProfile } from "@/lib/auth/ensure-user-profile";
import { requireEventAdmin } from "@/lib/auth/permissions";
import { getEventBySlug } from "@/lib/data/events";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { acceptedImageTypes, maxUploadSizeBytes } from "@/lib/constants";
import type { FrameStyle, MemoryPostStatus, StickyNoteStyle } from "@/types/evespace";

export async function createMemoryPostAction(
  eventSlug: string,
  formData: FormData,
) {
  const profile = await ensureUserProfile();
  if (!profile) {
    redirect("/login");
  }

  const event = await getEventBySlug(eventSlug);
  const photo = formData.get("photo");
  const supabase = getSupabaseAdminClient();

  if (!event || !supabase) {
    throw new Error("Memory posting is not configured.");
  }

  if (!(photo instanceof File) || photo.size === 0) {
    throw new Error("Choose a photo before posting.");
  }

  if (!acceptedImageTypes.includes(photo.type)) {
    throw new Error("Use a JPG, PNG, or WebP image.");
  }

  if (photo.size > maxUploadSizeBytes) {
    throw new Error("Image must be 5MB or smaller.");
  }

  const safeName = photo.name.replace(/[^a-zA-Z0-9._-]/g, "-");
  const storagePath = `${event.id}/${profile.clerkUserId}/${Date.now()}-${safeName}`;
  const bytes = Buffer.from(await photo.arrayBuffer());
  const { error: uploadError } = await supabase.storage
    .from("memory-photos")
    .upload(storagePath, bytes, {
      contentType: photo.type,
      upsert: false,
    });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("memory-photos").getPublicUrl(storagePath);
  const status = event.moderationMode === "post_first" ? "approved" : "pending";

  const { error } = await supabase.from("memory_posts").insert({
    event_id: event.id,
    profile_id: profile.id,
    clerk_user_id: profile.clerkUserId,
    author_display_name:
      clean(formData.get("authorDisplayName")) ||
      profile.displayName ||
      profile.email ||
      "Anonymous",
    image_url: publicUrl,
    storage_path: storagePath,
    caption: clean(formData.get("caption")),
    frame_style: readFrameStyle(formData),
    sticky_note_style: readStickyNoteStyle(formData),
    status,
    rotation: Math.round((Math.random() * 4 - 2) * 10) / 10,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/events/${event.slug}`);
  revalidatePath(`/events/${event.slug}/board`);
  redirect(
    `/events/${event.slug}/board?posted=${
      status === "pending" ? "pending" : "approved"
    }`,
  );
}

export async function moderatePostAction(formData: FormData) {
  const postId = String(formData.get("postId") ?? "");
  const intent = String(formData.get("intent") ?? "") as MemoryPostStatus;

  if (!["approved", "rejected", "removed"].includes(intent)) {
    return;
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    throw new Error("Supabase service role is not configured.");
  }

  const { data: post, error: postError } = await supabase
    .from("memory_posts")
    .select("event_id")
    .eq("id", postId)
    .single();

  if (postError) {
    throw new Error(postError.message);
  }

  await requireEventAdmin(String(post.event_id));

  const { error } = await supabase
    .from("memory_posts")
    .update({ status: intent, updated_at: new Date().toISOString() })
    .eq("id", postId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard");
}

function readFrameStyle(formData: FormData): FrameStyle {
  const value = String(formData.get("frameStyle") ?? "none");

  if (
    value === "polaroid" ||
    value === "soft_rounded" ||
    value === "film" ||
    value === "festival" ||
    value === "space_glow"
  ) {
    return value;
  }

  return "none";
}

function readStickyNoteStyle(formData: FormData): StickyNoteStyle {
  const value = String(formData.get("stickyNoteStyle") ?? "default");

  if (value === "yellow" || value === "pink" || value === "blue" || value === "glass") {
    return value;
  }

  return "default";
}

function clean(value: FormDataEntryValue | null) {
  const next = String(value ?? "").trim();
  return next.length > 0 ? next : null;
}
