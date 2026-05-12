import { GalaxyLanding } from "@/components/galaxy/GalaxyLanding";
import { ensureUserProfile } from "@/lib/auth/ensure-user-profile";
import { getGalaxyBoardsForProfile, getPublicGalaxyBoards } from "@/lib/data/boards";

/** Avoid caching signed-out galaxy payload so refresh after Sign-in picks up cookies. */
export const dynamic = "force-dynamic";

export default async function Home() {
  const profile = await ensureUserProfile();
  const events = profile
    ? await getGalaxyBoardsForProfile(profile)
    : await getPublicGalaxyBoards();

  return <GalaxyLanding events={events} personalized={Boolean(profile)} />;
}
