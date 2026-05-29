/* eslint-disable @next/next/no-img-element */
import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { Card } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";
import { ShareButton } from "@/components/ui/ShareButton";
import { OfficialEventScheduleTabs } from "@/components/events/OfficialEventScheduleTabs";
import { OfficialEventMap } from "@/components/official-events/OfficialEventMap";
import { MemoryCard } from "@/components/board/MemoryCard";
import { ensureUserProfile } from "@/lib/auth/ensure-user-profile";
import { getAccessibleBoardById } from "@/lib/data/boards";
import { getOfficialEventGoodsServices } from "@/lib/data/official-event-goods";
import { getOfficialEventSponsors } from "@/lib/data/official-event-sponsors";
import { getApprovedMemoryPostsByBoard } from "@/lib/data/memory-posts";
import { getEventSchedules } from "@/lib/data/schedules";
import { getBoardTheme } from "@/lib/board-themes";
import { readGoogleMapsBrowserApiKey } from "@/lib/maps/google-maps-config.mjs";
import { cn } from "@/lib/utils";

export default async function OfficialEventDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ submitted?: string }>;
}) {
  const { id } = await params;
  const { userId } = await auth();
  const profile = userId ? await ensureUserProfile() : null;
  const event = await getAccessibleBoardById(id, profile);

  if (!event || event.boardType !== "official_event") {
    notFound();
  }

  const [schedules, goodsServices, sponsors, memoryPreview, submitted] =
    await Promise.all([
      getEventSchedules(event.id),
      getOfficialEventGoodsServices(event.id),
      getOfficialEventSponsors(event.id),
      getApprovedMemoryPostsByBoard(event.id, { limit: 3 }),
      searchParams
        ? searchParams.then((paramsValue) => paramsValue?.submitted === "1")
        : Promise.resolve(false),
    ]);
  const heroBackground = getBoardTheme(event.boardBackgroundTheme);
  const heroStyle = event.heroImageUrl
    ? { backgroundImage: `url(${event.heroImageUrl})` }
    : undefined;

  return (
    <main className="cosmic-bg evespace-page">
      <div className="evespace-shell max-w-6xl">
        {submitted ? (
          <div className="rounded-3xl border border-cyan-100/25 bg-cyan-100/[0.08] px-4 py-3 text-sm font-medium text-cyan-50">
            Your official event has been published.
          </div>
        ) : null}

        <header
          className={cn(
            "official-event-hero relative overflow-hidden rounded-[2rem] border border-cyan-100/15 p-5 shadow-2xl shadow-cyan-950/20 backdrop-blur sm:p-8",
            event.heroImageUrl ? "bg-slate-950" : heroBackground.previewClassName,
          )}
          style={heroStyle}
        >
          <div className="official-event-hero-scrim pointer-events-none absolute inset-0" />
          <div className="relative">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-cyan-100/25 bg-cyan-100/10 px-3 py-1 text-xs font-semibold text-cyan-50">
                Official Event
              </span>
              {event.isVerified ? (
                <span className="rounded-full border border-emerald-200/40 bg-emerald-300/15 px-3 py-1 text-xs font-semibold text-emerald-100">
                  Verified by EveSpace
                </span>
              ) : null}
            </div>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-6xl">
              {event.title}
            </h1>
            <p className="mt-5 max-w-3xl whitespace-pre-wrap text-sm leading-7 text-slate-300 sm:text-base">
              {event.description}
            </p>
            <div className="mt-6 grid gap-3 sm:flex sm:flex-wrap">
              <LinkButton href={`/official-events/${event.id}/board`}>
                Enter Memory Board
              </LinkButton>
              {event.officialWebsiteUrl ? (
                <LinkButton
                  href={event.officialWebsiteUrl}
                  target="_blank"
                  rel="noreferrer"
                  variant="secondary"
                >
                  Visit event website
                </LinkButton>
              ) : null}
              <ShareButton
                className="w-full sm:w-auto"
                path={`/official-events/${event.id}`}
              />
            </div>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
          <div className="grid gap-6">
            <OfficialEventScheduleTabs schedules={schedules} />

            <OfficialEventMap
              title={event.title}
              locationName={event.locationName}
              address={event.address}
              googleMapsUrl={event.googleMapsUrl}
              latitude={event.latitude}
              longitude={event.longitude}
              accessInformation={event.accessInformation}
              apiKey={readGoogleMapsBrowserApiKey()}
            />

            {goodsServices.length > 0 ? (
              <Card>
                <h2 className="evespace-card-title">Goods & Services</h2>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  {goodsServices.map((item) => (
                    <div
                      className="rounded-3xl border border-white/10 bg-white/[0.045] p-4"
                      key={item.id}
                    >
                      {item.imageUrl ? (
                        <img
                          alt={item.name}
                          className="mb-4 aspect-video w-full rounded-2xl border border-white/10 object-cover"
                          src={item.imageUrl}
                        />
                      ) : null}
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="text-base font-semibold text-white">{item.name}</h3>
                        {item.price ? (
                          <span className="rounded-full border border-cyan-100/20 bg-cyan-100/10 px-2.5 py-1 text-xs font-semibold text-cyan-50">
                            {item.price}
                          </span>
                        ) : null}
                      </div>
                      {item.description ? (
                        <p className="mt-3 text-sm leading-6 text-slate-300">
                          {item.description}
                        </p>
                      ) : null}
                      {item.externalLink ? (
                        <a
                          className="mt-4 inline-flex text-sm font-semibold text-cyan-100 hover:text-cyan-50"
                          href={item.externalLink}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Open link
                        </a>
                      ) : null}
                    </div>
                  ))}
                </div>
              </Card>
            ) : null}

            {sponsors.length > 0 ? (
              <Card>
                <h2 className="evespace-card-title">Sponsors</h2>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  {sponsors.map((sponsor) => (
                    <div
                      className="rounded-3xl border border-white/10 bg-white/[0.045] p-4"
                      key={sponsor.id}
                    >
                      {sponsor.logoUrl ? (
                        <img
                          alt={sponsor.name}
                          className="mb-4 aspect-video w-full rounded-2xl border border-white/10 bg-slate-950/70 object-contain p-3"
                          src={sponsor.logoUrl}
                        />
                      ) : null}
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="text-base font-semibold text-white">{sponsor.name}</h3>
                        {sponsor.tier ? (
                          <span className="rounded-full border border-cyan-100/20 bg-cyan-100/10 px-2.5 py-1 text-xs font-semibold text-cyan-50">
                            {sponsor.tier}
                          </span>
                        ) : null}
                      </div>
                      {sponsor.description ? (
                        <p className="mt-3 text-sm leading-6 text-slate-300">
                          {sponsor.description}
                        </p>
                      ) : null}
                      {sponsor.websiteUrl ? (
                        <a
                          className="mt-4 inline-flex text-sm font-semibold text-cyan-100 hover:text-cyan-50"
                          href={sponsor.websiteUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Visit sponsor
                        </a>
                      ) : null}
                    </div>
                  ))}
                </div>
              </Card>
            ) : null}
          </div>

          <Card>
            <h2 className="evespace-card-title">Memory Board</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Official event posts can include up to 3 stickers.
            </p>
            <div className="mt-5 grid gap-4">
              {memoryPreview.slice(0, 3).map((post) => (
                <MemoryCard key={post.id} post={post} />
              ))}
              {memoryPreview.length === 0 ? (
                <p className="text-sm text-slate-300">
                  No memories yet. Be the first to post one.
                </p>
              ) : null}
            </div>
            <LinkButton
              className="mt-5 w-full"
              href={`/official-events/${event.id}/board`}
              variant="secondary"
            >
              View Full Board
            </LinkButton>
          </Card>
        </div>
      </div>
    </main>
  );
}
