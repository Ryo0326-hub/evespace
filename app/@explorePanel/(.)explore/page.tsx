import { redirect } from "next/navigation";
import { ExploreView } from "@/components/explore/ExploreView";
import { NavPanel } from "@/components/navigation/NavPanel";
import { ensureUserProfile } from "@/lib/auth/ensure-user-profile";

export default async function ExplorePanelPage(props: {
  searchParams?: Promise<{ q?: string }>;
}) {
  const searchParams = await props.searchParams;
  const profile = await ensureUserProfile();
  if (!profile) redirect("/login");

  return (
    <NavPanel side="explore" title="Explore">
      <ExploreView profile={profile} query={searchParams?.q?.toLowerCase() ?? ""} />
    </NavPanel>
  );
}
