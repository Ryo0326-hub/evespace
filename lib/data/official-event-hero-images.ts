import "server-only";

import { eventCoversBucket } from "@/lib/constants";
import {
  buildOfficialEventHeroImageStoragePath,
  isSupportedOfficialEventHeroImage,
} from "@/lib/official-events/hero-image-utils.mjs";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export type UploadedOfficialEventHeroImage = {
  publicUrl: string;
  storageBucket: string;
  storagePath: string;
};

export async function uploadOfficialEventHeroImage({
  eventKey,
  file,
}: {
  eventKey: string;
  file: FormDataEntryValue | null;
}): Promise<UploadedOfficialEventHeroImage | null> {
  if (!(file instanceof File) || file.size === 0) {
    return null;
  }

  if (!isSupportedOfficialEventHeroImage(file.name, file.type, file.size)) {
    throw new Error("Use a JPG, PNG, or WebP banner image under 5 MB.");
  }

  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    throw new Error("Supabase service role is not configured.");
  }

  const storagePath = buildOfficialEventHeroImageStoragePath({
    eventKey,
    fileName: file.name,
    mimeType: file.type,
  });
  const bytes = Buffer.from(await file.arrayBuffer());
  const { error } = await supabase.storage
    .from(eventCoversBucket)
    .upload(storagePath, bytes, {
      contentType: file.type || "image/jpeg",
      upsert: false,
    });

  if (error) {
    throw new Error(error.message);
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(eventCoversBucket).getPublicUrl(storagePath);

  return {
    publicUrl,
    storageBucket: eventCoversBucket,
    storagePath,
  };
}

export async function removeOfficialEventHeroImage({
  storageBucket,
  storagePath,
}: {
  storageBucket?: string | null;
  storagePath?: string | null;
}) {
  if (!storageBucket || !storagePath) {
    return;
  }

  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return;
  }

  await supabase.storage.from(storageBucket).remove([storagePath]);
}
