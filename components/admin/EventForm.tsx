import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { BOARD_THEME_OPTIONS, DEFAULT_BOARD_THEME, getBoardTheme } from "@/lib/board-themes";
import { moderationModes } from "@/lib/constants";
import type { Event } from "@/types/evespace";

export function EventForm({
  event,
  action,
  scheduleText = "",
}: {
  event?: Event | null;
  action: (formData: FormData) => Promise<void>;
  scheduleText?: string;
}) {
  return (
    <Card>
      <form action={action} className="grid gap-5">
        {event ? <input name="eventId" type="hidden" value={event.id} /> : null}
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Event title">
            <Input name="title" required defaultValue={event?.title ?? ""} />
          </Field>
          <Field label="Event slug">
            <Input
              name="slug"
              required
              defaultValue={event?.slug ?? ""}
              placeholder="icu-festival-2026"
            />
          </Field>
        </div>

        <Field label="Description">
          <Textarea name="description" defaultValue={event?.description ?? ""} />
        </Field>

        <div className="grid gap-5 md:grid-cols-3">
          <Field label="Category">
            <Input name="category" defaultValue={event?.category ?? ""} />
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Start date">
              <Input
                name="startDate"
                type="date"
                defaultValue={toDateValue(event?.startTime)}
              />
            </Field>
            <Field label="Add start time">
              <Input
                name="startTimeOfDay"
                type="time"
                defaultValue={toTimeValue(event?.startTime)}
                placeholder="Optional"
              />
            </Field>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="End date">
              <Input
                name="endDate"
                type="date"
                defaultValue={toDateValue(event?.endTime)}
              />
            </Field>
            <Field label="Add end time">
              <Input
                name="endTimeOfDay"
                type="time"
                defaultValue={toTimeValue(event?.endTime)}
                placeholder="Optional"
              />
            </Field>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Location name">
            <Input name="locationName" defaultValue={event?.locationName ?? ""} />
          </Field>
          <Field label="Address">
            <Input name="address" defaultValue={event?.address ?? ""} />
          </Field>
        </div>

        <Field label="Google Maps URL">
          <Input
            name="googleMapsUrl"
            type="url"
            defaultValue={event?.googleMapsUrl ?? ""}
          />
        </Field>

        <div className="grid gap-5 md:grid-cols-3">
          <Field label="Official website URL">
            <Input
              name="officialWebsiteUrl"
              type="url"
              defaultValue={event?.officialWebsiteUrl ?? ""}
            />
          </Field>
          <Field label="Official social URL">
            <Input
              name="officialSocialUrl"
              type="url"
              defaultValue={event?.officialSocialUrl ?? ""}
            />
          </Field>
          <Field label="Organizer email">
            <Input
              name="organizerEmail"
              type="email"
              defaultValue={event?.organizerEmail ?? ""}
            />
          </Field>
        </div>

        {event ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 text-sm text-slate-300">
            Verification status:{" "}
            <span className="font-semibold text-cyan-100">
              {event.verificationStatus.replace("_", " ")}
            </span>
          </div>
        ) : null}

        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Banner theme">
            <Select
              name="boardBackgroundTheme"
              defaultValue={event?.boardBackgroundTheme ?? DEFAULT_BOARD_THEME}
            >
              {BOARD_THEME_OPTIONS.map((theme) => (
                <option key={theme} value={theme}>
                  {getBoardTheme(theme).label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Moderation mode">
            <Select
              name="moderationMode"
              defaultValue={event?.moderationMode ?? "pre_approval"}
            >
              {moderationModes.map((mode) => (
                <option key={mode} value={mode}>
                  {mode.replace("_", " ")}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <div className="grid gap-4 rounded-3xl border border-white/10 bg-white/[0.045] p-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {BOARD_THEME_OPTIONS.map((theme) => {
              const background = getBoardTheme(theme);

              return (
                <div key={theme}>
                  <div
                    className={[
                      "aspect-[16/7] rounded-2xl border border-white/10",
                      background.previewClassName,
                    ].join(" ")}
                  />
                  <p className="mt-2 text-xs font-semibold text-slate-300">
                    {background.label}
                  </p>
                </div>
              );
            })}
          </div>
          {event?.heroImageUrl ? (
            <div>
              <p className="mb-2 text-sm font-semibold text-cyan-50">
                Current uploaded banner
              </p>
              <div
                aria-label={`${event.title} banner`}
                className="aspect-[16/5] rounded-3xl border border-white/10 bg-cover bg-center"
                role="img"
                style={{ backgroundImage: `url(${event.heroImageUrl})` }}
              />
            </div>
          ) : null}
          <Field label="Upload banner image" hint="JPG, PNG, or WebP under 5 MB">
            <Input
              accept="image/jpeg,image/png,image/webp"
              name="heroImage"
              type="file"
            />
          </Field>
          {event?.heroImageUrl ? (
            <label className="flex items-center gap-3 text-sm text-slate-200">
              <input
                name="clearHeroImage"
                type="checkbox"
                className="size-4 rounded border-white/20 bg-white/10"
              />
              Clear uploaded banner image
            </label>
          ) : null}
        </div>

        <Field label="Goods description">
          <Textarea
            name="goodsDescription"
            defaultValue={event?.goodsDescription ?? ""}
            placeholder="Leave blank if no goods are sold."
          />
        </Field>

        <label className="flex items-center gap-3 text-sm text-slate-200">
          <input
            name="sellingGoods"
            type="checkbox"
            defaultChecked={event?.sellingGoods ?? false}
            className="size-4 rounded border-white/20 bg-white/10"
          />
          Selling goods or merchandise
        </label>

        <label className="flex items-center gap-3 text-sm text-slate-200">
          <input
            name="submitVerification"
            type="checkbox"
            defaultChecked={event?.verificationStatus === "pending_review"}
            disabled={event?.verificationStatus === "verified"}
            className="size-4 rounded border-white/20 bg-white/10"
          />
          Submit for verification review
        </label>

        <Field
          label="Schedule items"
          hint="One item per line: 10:00 Opening Ceremony | Main Stage | Optional description"
        >
          <Textarea name="scheduleText" defaultValue={scheduleText} />
        </Field>

        <Button type="submit">{event ? "Save Event" : "Create Event Star"}</Button>
      </form>
    </Card>
  );
}

function toDateValue(value?: string | null) {
  if (!value) {
    return "";
  }

  return value.slice(0, 10);
}

function toTimeValue(value?: string | null) {
  if (!value) {
    return "";
  }

  const time = value.slice(11, 16);
  return time === "00:00" ? "" : time;
}
