"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { markNotificationsRead } from "@/lib/data/notifications";

export async function markNotificationsReadAction() {
  const { userId } = await auth();

  if (!userId) {
    return { ok: false };
  }

  const ok = await markNotificationsRead(userId);
  if (ok) revalidatePath("/notifications");
  return { ok };
}
