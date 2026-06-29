import { redirect } from "next/navigation";
import { ensureUserProfile } from "@/lib/auth/ensure-user-profile";

export default async function NewHostedOfficialEventPage() {
  const profile = await ensureUserProfile();

  if (!profile) {
    redirect("/login");
  }

  redirect("/premium?next=/official-events/new");
}
