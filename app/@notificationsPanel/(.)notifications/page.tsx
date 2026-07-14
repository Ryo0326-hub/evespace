import { redirect } from "next/navigation";
import { NavPanel } from "@/components/navigation/NavPanel";
import { NotificationsView } from "@/components/notifications/NotificationsView";
import { ensureUserProfile } from "@/lib/auth/ensure-user-profile";
import { getNotificationsForProfile } from "@/lib/data/notifications";

export default async function NotificationsPanelPage() {
  const profile = await ensureUserProfile();
  if (!profile) redirect("/login");

  const notifications = await getNotificationsForProfile(profile);

  return (
    <NavPanel side="notifications" title="Notifications">
      <NotificationsView notifications={notifications} />
    </NavPanel>
  );
}
