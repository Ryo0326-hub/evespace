/* eslint-disable @next/next/no-img-element */
import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { Card } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";
import { ShareButton } from "@/components/ui/ShareButton";
import { EventScheduleList } from "@/components/events/EventScheduleList";
import { MemoryCard } from "@/components/board/MemoryCard";
import { ensureUserProfile } from "@/lib/auth/ensure-user-profile";
import {
  canPostToBoard,
  getAccessibleBoardById,
} from "@/lib/data/boards";
import { getOfficialEventGoodsServices } from "@/lib/data/official-event-goods";
import { getApprovedMemoryPostsByBoard } from "@/lib/data/memory-posts";
import { getEventSchedules } from "@/lib/data/schedules";
import { compactDateLocation, formatDateTime } from "@/lib/utils";

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

  const [schedules, goodsServices, memoryPreview, canPost, submitted] =
    await Promise.all([
      getEventSchedules(event.id),
      getOfficialEventGoodsServices(event.id),
      getApprovedMemoryPostsByBoard(event.id, { limit: 3 }),
      canPostToBoard(event, profile),
      searchParams
        ? searchParams.then((paramsValue) => paramsValue?.submitted === "1")
        : Promise.resolve(false),
    ]);

  return (
    <main className="cosmic-bg min-h-screen px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
      <div className="mx-auto grid max-w-6xl gap-6 sm:gap-8">
        <nav className="flex items-center justify-start">
          <LinkButton className="w-full sm:w-auto" href="/" variant="ghost">
            Back to Galaxy
          </LinkButton>
        </nav>

        {submitted ? (
          <div className="rounded-3xl border border-cyan-100/25 bg-cyan-100/[0.08] px-4 py-3 text-sm font-medium text-cyan-50">
            Your official event has been submitted. EveSpace can verify it later
            to display the verified label.
          </div>
        ) : null}

        <header className="relative overflow-hidden rounded-[2rem] border border-cyan-100/15 bg-slate-950/72 p-5 shadow-2xl shadow-cyan-950/20 backdrop-blur sm:p-8 lg:grid lg:grid-cols-[1.25fr_0.75fr] lg:gap-8">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(103,232,249,0.16),transparent_34%),radial-gradient(circle_at_82%_12%,rgba(168,85,247,0.13),transparent_30%)]" />
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
              {canPost ? (
                <LinkButton
                  href={`/official-events/${event.id}/post`}
                  variant="secondary"
                >
                  Post a Memory
                </LinkButton>
              ) : !profile ? (
                <LinkButton href="/login" variant="secondary">
                  Sign in to Post
                </LinkButton>
              ) : null}
              {event.officialWebsiteUrl ? (
                <LinkButton href={event.officialWebsiteUrl} variant="secondary">
                  Visit event website
                </LinkButton>
              ) : null}
              <ShareButton
                className="w-full sm:w-auto"
                path={`/official-events/${event.id}`}
              />
            </div>
          </div>

          <Card className="relative mt-6 bg-slate-950/45 lg:mt-0">
            <p className="text-sm text-slate-400">When and where</p>
            <p className="mt-3 text-lg font-semibold text-white">
              {formatDateTime(event.startTime)}
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              {compactDateLocation(event.startTime, event.locationName)}
            </p>
            {event.address ? (
              <p className="mt-2 text-sm leading-6 text-slate-400">{event.address}</p>
            ) : null}
            {event.googleMapsUrl ? (
              <a
                className="mt-5 inline-flex text-sm font-semibold text-cyan-100 hover:text-cyan-50"
                href={event.googleMapsUrl}
                target="_blank"
                rel="noreferrer"
              >
                Open in Google Maps
              </a>
            ) : null}
          </Card>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
          <div className="grid gap-6">
            <EventScheduleList schedules={schedules} />

            {event.accessInformation ? (
              <Card>
                <h2 className="text-xl font-semibold text-white">Access Information</h2>
                <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-300">
                  {event.accessInformation}
                </p>
              </Card>
            ) : null}

            {goodsServices.length > 0 ? (
              <Card>
                <h2 className="text-xl font-semibold text-white">Goods & Services</h2>
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
          </div>

          <Card>
            <h2 className="text-xl font-semibold text-white">Memory Board</h2>
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
