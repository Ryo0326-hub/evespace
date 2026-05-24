"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { formatTime } from "@/lib/utils";
import type { EventSchedule } from "@/types/evespace";

type ScheduleGroup = {
  date: string | null;
  label: string;
  tabLabel: string;
  items: EventSchedule[];
};

export function OfficialEventScheduleTabs({
  schedules,
}: {
  schedules: EventSchedule[];
}) {
  const groups = useMemo(() => groupSchedulesByDay(schedules), [schedules]);
  const [activeIndex, setActiveIndex] = useState(0);
  const activeGroup = groups[Math.min(activeIndex, groups.length - 1)] ?? groups[0];
  const datedGroups = groups.filter((group) => group.date);
  const shouldShowTabs = datedGroups.length > 1;

  return (
    <Card>
      <h2 className="evespace-card-title">Schedule</h2>
      {schedules.length === 0 ? (
        <p className="mt-4 text-sm text-slate-300">Schedule will be announced soon.</p>
      ) : shouldShowTabs ? (
        <div className="mt-5 grid gap-5">
          <div
            aria-label="Schedule days"
            className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap"
            role="tablist"
          >
            {groups.map((group, index) => (
              <button
                aria-selected={activeGroup?.label === group.label}
                className={[
                  "min-h-16 rounded-full border px-4 py-3 text-left transition",
                  activeGroup?.label === group.label
                    ? "border-cyan-100 bg-cyan-200 text-slate-950 shadow-[0_0_30px_rgba(103,232,249,0.28)]"
                    : "border-white/15 bg-white/[0.06] text-cyan-50 hover:border-cyan-100/50 hover:bg-white/[0.1]",
                ].join(" ")}
                key={group.label}
                onClick={() => setActiveIndex(index)}
                role="tab"
                type="button"
              >
                <span className="block text-sm font-semibold">{group.tabLabel}</span>
                <span className="block text-xs font-medium opacity-80">{group.label}</span>
              </button>
            ))}
          </div>
          {activeGroup ? <ScheduleItemsList schedules={activeGroup.items} /> : null}
        </div>
      ) : (
        <div className="mt-5">
          <ScheduleItemsList schedules={groups.flatMap((group) => group.items)} />
        </div>
      )}
    </Card>
  );
}

function ScheduleItemsList({ schedules }: { schedules: EventSchedule[] }) {
  return (
    <ol className="grid gap-4">
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
  );
}

function groupSchedulesByDay(schedules: EventSchedule[]): ScheduleGroup[] {
  const groups = new Map<string, EventSchedule[]>();
  const unscheduled: EventSchedule[] = [];

  for (const schedule of [...schedules].sort(compareSchedules)) {
    const date = readScheduleDate(schedule.startTime) ?? readScheduleDate(schedule.endTime);

    if (!date) {
      unscheduled.push(schedule);
      continue;
    }

    if (!groups.has(date)) {
      groups.set(date, []);
    }

    groups.get(date)?.push(schedule);
  }

  const datedGroups: ScheduleGroup[] = [...groups.entries()]
    .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
    .map(([date, items], index) => ({
      date,
      label: formatScheduleDateLabel(date),
      tabLabel: `Day ${index + 1}`,
      items,
    }));

  if (unscheduled.length > 0) {
    datedGroups.push({
      date: null,
      label: "Unscheduled",
      tabLabel: "TBA",
      items: unscheduled,
    });
  }

  return datedGroups;
}

function compareSchedules(a: EventSchedule, b: EventSchedule) {
  const aTime = a.startTime ?? a.endTime ?? "";
  const bTime = b.startTime ?? b.endTime ?? "";

  if (aTime && bTime && aTime !== bTime) {
    return aTime.localeCompare(bTime);
  }

  return a.sortOrder - b.sortOrder;
}

function readScheduleDate(value: string | null) {
  if (!value) {
    return null;
  }

  const directDate = value.match(/^(\d{4}-\d{2}-\d{2})/)?.[1];

  if (directDate) {
    return directDate;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().slice(0, 10);
}

function formatScheduleDateLabel(date: string) {
  const [year, month, day] = date.split("-").map(Number);

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}
