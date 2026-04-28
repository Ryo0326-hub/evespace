import { GalaxyLanding } from "@/components/galaxy/GalaxyLanding";
import { getPublicEvents } from "@/lib/data/events";

export default async function Home() {
  const events = await getPublicEvents();

  return <GalaxyLanding events={events} />;
}
