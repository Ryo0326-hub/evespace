"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import type { OfficialEventSharingScope } from "@/types/evespace";

type ScheduleRow = {
  id: string;
};

type GoodsRow = {
  id: string;
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      className="w-full border-cyan-100/60 bg-cyan-100 text-slate-950 shadow-[0_0_28px_rgba(103,232,249,0.32)] hover:border-white hover:bg-white sm:w-auto"
      disabled={pending}
      type="submit"
    >
      {pending ? "Submitting..." : "Submit official event"}
    </Button>
  );
}

export function OfficialEventHostForm({
  action,
}: {
  action: (formData: FormData) => Promise<void>;
}) {
  const [scheduleRows, setScheduleRows] = useState<ScheduleRow[]>([]);
  const [goodsRows, setGoodsRows] = useState<GoodsRow[]>([]);
  const [sharingScope, setSharingScope] =
    useState<OfficialEventSharingScope>("public");

  function addScheduleRow() {
    setScheduleRows((rows) => [...rows, { id: crypto.randomUUID() }]);
  }

  function addGoodsRow() {
    setGoodsRows((rows) => [...rows, { id: crypto.randomUUID() }]);
  }

  return (
    <form action={action} className="grid gap-5">
      <Card className="overflow-hidden border-cyan-100/15 bg-slate-950/70 p-0">
        <div className="border-b border-white/10 bg-cyan-200/[0.04] px-4 py-4 sm:px-6">
          <p className="evespace-section-kicker">
            Event Signal
          </p>
          <h2 className="evespace-section-title mt-2">
            Basic event information
          </h2>
        </div>
        <div className="grid gap-5 p-4 sm:p-6">
          <Field label="Event name *" hint="3-100 characters">
            <Input
              name="title"
              minLength={3}
              maxLength={100}
              required
              placeholder="Tokyo Summer Culture Festival"
            />
          </Field>
          <Field label="Event information *" hint="20-5000 characters">
            <Textarea
              className="min-h-44"
              name="description"
              minLength={20}
              maxLength={5000}
              required
              placeholder="Describe who this event is for, what visitors can expect, and why people should join."
            />
          </Field>
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Category">
              <Input name="category" placeholder="Festival, meetup, school event..." />
            </Field>
            <Field label="Event website">
              <Input
                name="officialWebsiteUrl"
                type="url"
                placeholder="https://example.com"
              />
            </Field>
          </div>
        </div>
      </Card>

      <Card className="grid gap-5 border-cyan-100/15 bg-slate-950/55">
        <div>
          <p className="evespace-section-kicker">
            Coordinates
          </p>
          <h2 className="evespace-section-title mt-2">
            Location and access
          </h2>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Location name">
            <Input name="locationName" placeholder="Main campus quad" />
          </Field>
          <Field label="Location address">
            <Input name="address" placeholder="1 Event Way, Tokyo" />
          </Field>
        </div>
        <Field label="Google Maps URL">
          <Input name="googleMapsUrl" type="url" placeholder="https://maps.google.com/..." />
        </Field>
        <Field label="Access information" hint="Optional, max 3000 characters">
          <Textarea
            name="accessInformation"
            maxLength={3000}
            placeholder="Tickets, gate instructions, parking, ID requirements, accessibility notes..."
          />
        </Field>
      </Card>

      <Card className="grid gap-5 border-cyan-100/15 bg-slate-950/55">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="evespace-section-kicker">
              Timeline
            </p>
            <h2 className="evespace-section-title mt-2">Schedule</h2>
          </div>
          <Button type="button" variant="secondary" onClick={addScheduleRow}>
            Add schedule item
          </Button>
        </div>
        {scheduleRows.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-white/15 bg-white/[0.04] px-4 py-4 text-sm text-slate-300">
            No schedule items yet. You can submit the event without a schedule.
          </p>
        ) : (
          <div className="grid gap-4">
            {scheduleRows.map((row, index) => (
              <div
                className="grid gap-4 rounded-3xl border border-white/10 bg-white/[0.045] p-4"
                key={row.id}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-cyan-50">
                    Schedule Item {index + 1}
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() =>
                      setScheduleRows((rows) => rows.filter((item) => item.id !== row.id))
                    }
                  >
                    Remove
                  </Button>
                </div>
                <Field label="Title">
                  <Input name="scheduleTitle" maxLength={150} placeholder="Opening Ceremony" />
                </Field>
                <div className="grid gap-4 md:grid-cols-3">
                  <Field label="Start time">
                    <Input name="scheduleStartTime" type="datetime-local" />
                  </Field>
                  <Field label="End time">
                    <Input name="scheduleEndTime" type="datetime-local" />
                  </Field>
                  <Field label="Location">
                    <Input name="scheduleLocation" maxLength={200} placeholder="Main Stage" />
                  </Field>
                </div>
                <Field label="Description">
                  <Textarea
                    name="scheduleDescription"
                    maxLength={1000}
                    placeholder="Optional schedule detail"
                  />
                </Field>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="grid gap-5 border-cyan-100/15 bg-slate-950/55">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="evespace-section-kicker">
              Market Layer
            </p>
            <h2 className="evespace-section-title mt-2">
              Goods and services
            </h2>
          </div>
          <Button type="button" variant="secondary" onClick={addGoodsRow}>
            Add item
          </Button>
        </div>
        {goodsRows.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-white/15 bg-white/[0.04] px-4 py-4 text-sm text-slate-300">
            Add vendor booths, merch, food stalls, sponsor tables, or paid activities if useful.
          </p>
        ) : (
          <div className="grid gap-4">
            {goodsRows.map((row, index) => (
              <div
                className="grid gap-4 rounded-3xl border border-white/10 bg-white/[0.045] p-4"
                key={row.id}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-cyan-50">
                    Item {index + 1}
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() =>
                      setGoodsRows((rows) => rows.filter((item) => item.id !== row.id))
                    }
                  >
                    Remove
                  </Button>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Item name">
                    <Input name="goodsName" maxLength={150} placeholder="EveSpace Sticker Pack" />
                  </Field>
                  <Field label="Price">
                    <Input name="goodsPrice" maxLength={50} placeholder="$5" />
                  </Field>
                </div>
                <Field label="Description">
                  <Textarea
                    name="goodsDescriptionItem"
                    maxLength={1000}
                    placeholder="Optional item details"
                  />
                </Field>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Image URL">
                    <Input name="goodsImageUrl" type="url" placeholder="https://..." />
                  </Field>
                  <Field label="External link">
                    <Input name="goodsExternalLink" type="url" placeholder="https://..." />
                  </Field>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="grid gap-5 border-cyan-100/15 bg-slate-950/55">
        <div>
          <p className="evespace-section-kicker">
            Memory Board Gate
          </p>
          <h2 className="evespace-section-title mt-2">
            Sharing scope
          </h2>
        </div>
        <Field label="Who can view and post memories?">
          <Select
            name="officialSharingScope"
            value={sharingScope}
            onChange={(event) =>
              setSharingScope(event.target.value as OfficialEventSharingScope)
            }
          >
            <option value="public">Public</option>
            <option value="selected_people">Selected people</option>
            <option value="organization">Organization</option>
          </Select>
        </Field>
        <input name="postingPermission" type="hidden" value="signed_in_users" />
        {sharingScope === "selected_people" ? (
          <Field
            label="Allowed emails"
            hint="One email per line. Hosts and EveSpace admins can always access."
          >
            <Textarea name="allowedEmails" placeholder="friend@example.com" />
          </Field>
        ) : null}
        {sharingScope === "organization" ? (
          <Field
            label="Allowed organization domains"
            hint="One domain per line, without @. Example: uwaterloo.ca"
          >
            <Textarea name="allowedOrganizationDomains" placeholder="uwaterloo.ca" />
          </Field>
        ) : null}
        <div className="rounded-3xl border border-cyan-100/20 bg-cyan-100/[0.06] px-4 py-4 text-sm leading-6 text-cyan-50">
          Official events can be verified by EveSpace. Verified events display a
          verified label in search results and on the event page. Official event
          posts can include up to 3 stickers.
        </div>
      </Card>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-6 text-slate-400">
          Your official event will be submitted for EveSpace review.
        </p>
        <SubmitButton />
      </div>
    </form>
  );
}
