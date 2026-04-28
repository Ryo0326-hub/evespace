import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { boardThemes, moderationModes } from "@/lib/constants";
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
          <Field label="Start date/time">
            <Input
              name="startTime"
              type="datetime-local"
              defaultValue={toDateTimeLocal(event?.startTime)}
            />
          </Field>
          <Field label="End date/time">
            <Input
              name="endTime"
              type="datetime-local"
              defaultValue={toDateTimeLocal(event?.endTime)}
            />
          </Field>
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
          <Field label="Board background theme">
            <Select
              name="boardBackgroundTheme"
              defaultValue={event?.boardBackgroundTheme ?? "space"}
            >
              {boardThemes.map((theme) => (
                <option key={theme} value={theme}>
                  {theme.replace("_", " ")}
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

function toDateTimeLocal(value?: string | null) {
  if (!value) {
    return "";
  }

  return value.slice(0, 16);
}
