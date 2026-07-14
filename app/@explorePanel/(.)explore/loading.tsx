import { NavPanel } from "@/components/navigation/NavPanel";
import { NavPanelLoading } from "@/components/navigation/NavPanelLoading";

export default function LoadingExplorePanel() {
  return (
    <NavPanel side="explore" title="Explore">
      <NavPanelLoading />
    </NavPanel>
  );
}
