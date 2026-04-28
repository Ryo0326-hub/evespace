import { GalaxyLanding } from "@/components/galaxy/GalaxyLanding";
import { ensureUserProfile } from "@/lib/auth/ensure-user-profile";
import { getGalaxyBoardsForProfile } from "@/lib/data/boards";
import { getPublicEvents } from "@/lib/data/events";

/** Avoid caching signed-out galaxy payload so refresh after Sign-in picks up cookies. */
export const dynamic = "force-dynamic";

export default async function Home() {
  const profile = await ensureUserProfile();
  const events = profile
    ? await getGalaxyBoardsForProfile(profile)
    : await getPublicEvents();

  return <GalaxyLanding events={events} personalized={Boolean(profile)} />;
}
