import { Show, SignInButton } from "@clerk/nextjs";
import { Card } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";
import { ShareButton } from "@/components/ui/ShareButton";
import { EventScheduleList } from "@/components/events/EventScheduleList";
import { EventVerificationBadge } from "@/components/events/EventVerificationBadge";
import { MemoryCard } from "@/components/board/MemoryCard";
import { compactDateLocation, formatDateTime } from "@/lib/utils";
import type { Event, EventSchedule, MemoryPost } from "@/types/evespace";

export function EventDetail({
  event,
  schedules,
  memoryPreview,
}: {
  event: Event;
  schedules: EventSchedule[];
  memoryPreview: MemoryPost[];
}) {
  return (
    <main className="cosmic-bg evespace-page">
      <div className="evespace-shell max-w-6xl">
        <nav className="flex items-center justify-start">
          <LinkButton className="w-full sm:w-auto" href="/" variant="ghost">
            Back to Galaxy
          </LinkButton>
        </nav>

        <header className="grid gap-5 rounded-[1.7rem] border border-white/10 bg-white/[0.06] p-4 shadow-2xl shadow-black/30 backdrop-blur sm:gap-6 sm:rounded-[2rem] sm:p-8 lg:grid-cols-[1.3fr_0.7fr]">
          <div>
            {event.category ? (
              <p className="text-xs font-medium uppercase tracking-[0.28em] text-cyan-100 sm:text-sm sm:tracking-[0.35em]">
                {event.category}
              </p>
            ) : null}
            <div className="mt-3">
              <EventVerificationBadge status={event.verificationStatus} />
            </div>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
              {event.title}
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:mt-5 sm:text-lg sm:leading-8">
              {event.description || "Every star holds memories waiting to be shared."}
            </p>
            <div className="mt-6 grid gap-3 sm:flex sm:flex-wrap">
              <LinkButton className="w-full sm:w-auto" href={`/events/${event.slug}/board`}>
                Enter Memory Board
              </LinkButton>
              <Show when="signed-in">
                <LinkButton
                  className="w-full sm:w-auto"
                  href={`/events/${event.slug}/post`}
                  variant="secondary"
                >
                  Post a Memory
                </LinkButton>
                <LinkButton
                  className="w-full sm:w-auto"
                  href={`/events/${event.slug}/manage`}
                  variant="secondary"
                >
                  Manage Event
                </LinkButton>
              </Show>
              <Show when="signed-out">
                <span className="event-detail-sign-in-trigger">
                  <SignInButton mode="modal">Post a Memory</SignInButton>
                </span>
                <span className="event-detail-sign-in-trigger">
                  <SignInButton mode="modal">Manage Event</SignInButton>
                </span>
              </Show>
              <ShareButton className="w-full sm:w-auto" path={`/events/${event.slug}`} />
            </div>
          </div>

          <Card className="bg-slate-950/40">
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
            <Card>
              <h2 className="evespace-card-title">Goods</h2>
              <p className="mt-4 text-sm leading-6 text-slate-300">
                {event.sellingGoods
                  ? event.goodsDescription ||
                    "Goods and merchandise details will be shared by the organizer."
                  : "This event has not listed goods or merchandise sales."}
              </p>
            </Card>
          </div>

          <Card>
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="evespace-card-title">Recent Memories</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Approved notes from this event board.
                </p>
              </div>
            </div>
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
              href={`/events/${event.slug}/board`}
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
