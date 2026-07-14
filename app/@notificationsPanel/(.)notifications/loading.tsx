import { NavPanel } from "@/components/navigation/NavPanel";
import { NavPanelLoading } from "@/components/navigation/NavPanelLoading";

export default function LoadingNotificationsPanel() {
  return (
    <NavPanel side="notifications" title="Notifications">
      <NavPanelLoading />
    </NavPanel>
  );
}
