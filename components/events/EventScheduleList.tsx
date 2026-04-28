import { Card } from "@/components/ui/Card";
import { formatTime } from "@/lib/utils";
import type { EventSchedule } from "@/types/evespace";

export function EventScheduleList({ schedules }: { schedules: EventSchedule[] }) {
  return (
    <Card>
      <h2 className="text-xl font-semibold text-white">Schedule</h2>
      {schedules.length > 0 ? (
        <ol className="mt-5 grid gap-4">
          {schedules.map((item) => (
            <li
              key={item.id}
              className="grid gap-2 rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:grid-cols-[8rem_1fr]"
            >
              <time className="text-sm font-semibold text-cyan-100">
                {formatTime(item.startTime)}
              </time>
              <div>
                <p className="font-semibold text-white">{item.title}</p>
                {item.locationName ? (
                  <p className="text-sm text-slate-400">{item.locationName}</p>
                ) : null}
                {item.description ? (
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    {item.description}
                  </p>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <p className="mt-4 text-sm text-slate-300">Schedule will be announced soon.</p>
      )}
    </Card>
  );
}
