"use client";

import {
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { BOARD_THEME_OPTIONS, DEFAULT_BOARD_THEME, getBoardTheme } from "@/lib/board-themes";
import type {
  BoardBackgroundTheme,
  OfficialEventSharingScope,
} from "@/types/evespace";

type ImportedOfficialEventDraft = {
  title: string | null;
  description: string | null;
  category: string | null;
  eventWebsiteUrl: string | null;
  locationName: string | null;
  locationAddress: string | null;
  googleMapsUrl: string | null;
  accessInformation: string | null;
  scheduleItems: {
    title: string | null;
    description: string | null;
    startTime: string | null;
    endTime: string | null;
    locationLabel: string | null;
  }[];
  goodsServices: {
    name: string | null;
    description: string | null;
    price: string | null;
    imageUrl: string | null;
    externalLink: string | null;
  }[];
  sponsors: {
    name: string | null;
    description: string | null;
    tier: string | null;
    logoUrl: string | null;
    websiteUrl: string | null;
  }[];
  warnings: string[];
};

type ScheduleRow = {
  id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  locationLabel: string;
};

type GoodsRow = {
  id: string;
  name: string;
  description: string;
  price: string;
  imageUrl: string;
  externalLink: string;
};

type SponsorRow = {
  id: string;
  name: string;
  description: string;
  tier: string;
  logoUrl: string;
  websiteUrl: string;
};

type BasicFormValues = {
  title: string;
  description: string;
  category: string;
  officialWebsiteUrl: string;
  locationName: string;
  address: string;
  googleMapsUrl: string;
  accessInformation: string;
};

type ImportState = {
  status: "idle" | "loading" | "parsed" | "error";
  message: string;
  warnings: string[];
};

const EMPTY_FORM_VALUES: BasicFormValues = {
  title: "",
  description: "",
  category: "",
  officialWebsiteUrl: "",
  locationName: "",
  address: "",
  googleMapsUrl: "",
  accessInformation: "",
};

const INITIAL_IMPORT_STATE: ImportState = {
  status: "idle",
  message: "",
  warnings: [],
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
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [values, setValues] = useState<BasicFormValues>(EMPTY_FORM_VALUES);
  const [scheduleRows, setScheduleRows] = useState<ScheduleRow[]>([]);
  const [goodsRows, setGoodsRows] = useState<GoodsRow[]>([]);
  const [sponsorRows, setSponsorRows] = useState<SponsorRow[]>([]);
  const [sharingScope, setSharingScope] =
    useState<OfficialEventSharingScope>("public");
  const [selectedHeroTheme, setSelectedHeroTheme] =
    useState<BoardBackgroundTheme>(DEFAULT_BOARD_THEME);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [isDragActive, setIsDragActive] = useState(false);
  const [pendingDraft, setPendingDraft] = useState<ImportedOfficialEventDraft | null>(null);
  const [importState, setImportState] = useState<ImportState>(INITIAL_IMPORT_STATE);

  function addScheduleRow(row?: Partial<ScheduleRow>) {
    setScheduleRows((rows) => [...rows, makeScheduleRow(row)]);
  }

  function addGoodsRow(row?: Partial<GoodsRow>) {
    setGoodsRows((rows) => [...rows, makeGoodsRow(row)]);
  }

  function addSponsorRow(row?: Partial<SponsorRow>) {
    setSponsorRows((rows) => [...rows, makeSponsorRow(row)]);
  }

  function updateValue(field: keyof BasicFormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  function updateScheduleRow(id: string, field: keyof Omit<ScheduleRow, "id">, value: string) {
    setScheduleRows((rows) =>
      rows.map((row) => (row.id === id ? { ...row, [field]: value } : row)),
    );
  }

  function updateGoodsRow(id: string, field: keyof Omit<GoodsRow, "id">, value: string) {
    setGoodsRows((rows) =>
      rows.map((row) => (row.id === id ? { ...row, [field]: value } : row)),
    );
  }

  function updateSponsorRow(id: string, field: keyof Omit<SponsorRow, "id">, value: string) {
    setSponsorRows((rows) =>
      rows.map((row) => (row.id === id ? { ...row, [field]: value } : row)),
    );
  }

  function removeScheduleRow(id: string) {
    setScheduleRows((rows) => rows.filter((row) => row.id !== id));
  }

  function removeGoodsRow(id: string) {
    setGoodsRows((rows) => rows.filter((row) => row.id !== id));
  }

  function removeSponsorRow(id: string) {
    setSponsorRows((rows) => rows.filter((row) => row.id !== id));
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file);
    setPendingDraft(null);
    setImportState(INITIAL_IMPORT_STATE);
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragActive(true);
  }

  function handleDragLeave() {
    setIsDragActive(false);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragActive(false);

    const file = event.dataTransfer.files?.[0] ?? null;
    if (file) {
      setSelectedFile(file);
      setPendingDraft(null);
      setImportState(INITIAL_IMPORT_STATE);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  async function importFromFile() {
    if (!selectedFile) {
      setImportState({
        status: "error",
        message: "Choose a PDF or image schedule first.",
        warnings: [],
      });
      return;
    }

    const formData = new FormData();
    formData.append("sourceType", "file");
    formData.append("file", selectedFile);
    await runImport(formData, `Imported ${selectedFile.name}`);
  }

  async function importFromWebsite() {
    if (!websiteUrl.trim()) {
      setImportState({
        status: "error",
        message: "Paste an event website URL first.",
        warnings: [],
      });
      return;
    }

    const formData = new FormData();
    formData.append("sourceType", "url");
    formData.append("url", websiteUrl.trim());
    await runImport(formData, "Imported website details");
  }

  async function runImport(formData: FormData, successMessage: string) {
    setPendingDraft(null);
    setImportState({
      status: "loading",
      message: "Reading the event source...",
      warnings: [],
    });

    try {
      const response = await fetch("/api/official-events/import", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json()) as {
        draft?: ImportedOfficialEventDraft;
        error?: string;
      };

      if (!response.ok || !payload.draft) {
        throw new Error(payload.error ?? "Import failed.");
      }

      if (hasDraftContent(values, scheduleRows, goodsRows, sponsorRows)) {
        setPendingDraft(payload.draft);
        setImportState({
          status: "parsed",
          message: `${successMessage}. Review it before replacing your current draft.`,
          warnings: payload.draft.warnings,
        });
        return;
      }

      applyDraft(payload.draft);
      setImportState({
        status: "parsed",
        message: `${successMessage}. The form is ready for review.`,
        warnings: payload.draft.warnings,
      });
    } catch (error) {
      setImportState({
        status: "error",
        message: error instanceof Error ? error.message : "Import failed.",
        warnings: [],
      });
    }
  }

  function applyPendingDraft() {
    if (!pendingDraft) {
      return;
    }

    applyDraft(pendingDraft);
    setImportState((current) => ({
      ...current,
      message: "Imported draft applied. Review every field before submitting.",
    }));
    setPendingDraft(null);
  }

  function applyDraft(draft: ImportedOfficialEventDraft) {
    setValues({
      title: draft.title ?? "",
      description: draft.description ?? "",
      category: draft.category ?? "",
      officialWebsiteUrl: draft.eventWebsiteUrl ?? "",
      locationName: draft.locationName ?? "",
      address: draft.locationAddress ?? "",
      googleMapsUrl: draft.googleMapsUrl ?? "",
      accessInformation: draft.accessInformation ?? "",
    });
    setScheduleRows(
      draft.scheduleItems.map((item) =>
        makeScheduleRow({
          title: item.title ?? "",
          description: item.description ?? "",
          startTime: item.startTime ?? "",
          endTime: item.endTime ?? "",
          locationLabel: item.locationLabel ?? "",
        }),
      ),
    );
    setGoodsRows(
      draft.goodsServices.map((item) =>
        makeGoodsRow({
          name: item.name ?? "",
          description: item.description ?? "",
          price: item.price ?? "",
          imageUrl: item.imageUrl ?? "",
          externalLink: item.externalLink ?? "",
        }),
      ),
    );
    setSponsorRows(
      draft.sponsors.map((item) =>
        makeSponsorRow({
          name: item.name ?? "",
          description: item.description ?? "",
          tier: item.tier ?? "",
          logoUrl: item.logoUrl ?? "",
          websiteUrl: item.websiteUrl ?? "",
        }),
      ),
    );
  }

  const importDisabled = importState.status === "loading";

  return (
    <form action={action} className="grid gap-5">
      <Card className="overflow-hidden border-cyan-100/15 bg-slate-950/70 p-0">
        <div className="border-b border-white/10 bg-cyan-200/[0.04] px-4 py-4 sm:px-6">
          <p className="evespace-section-kicker">Import Assist</p>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
            Upload a schedule or paste one public event page.
          </p>
        </div>
        <div className="grid gap-4 p-4 sm:p-6 lg:grid-cols-[1fr_0.9fr]">
          <div
            className={[
              "flex min-h-56 cursor-pointer flex-col justify-between rounded-[1.75rem] border border-dashed p-4 transition sm:p-5",
              isDragActive
                ? "border-cyan-100 bg-cyan-100/15 shadow-[0_0_36px_rgba(103,232,249,0.18)]"
                : "border-cyan-100/25 bg-white/[0.045] hover:border-cyan-100/45 hover:bg-white/[0.07]",
            ].join(" ")}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <input
              accept="application/pdf,image/jpeg,image/png,image/webp"
              className="sr-only"
              id="official-event-import-file"
              onChange={handleFileChange}
              ref={fileInputRef}
              type="file"
            />
            <span>
              <span className="block text-sm font-semibold text-cyan-50">
                Schedule file import
              </span>
              <span className="mt-2 block text-sm leading-6 text-slate-300">
                PDF, JPG, PNG, or WebP under 10 MB.
              </span>
            </span>
            <label
              className="mt-8 cursor-pointer rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-slate-200"
              htmlFor="official-event-import-file"
            >
              {selectedFile ? selectedFile.name : "Choose or drag a schedule file"}
            </label>
            <Button
              className="mt-3 w-full"
              disabled={importDisabled}
              onClick={importFromFile}
              type="button"
              variant="secondary"
            >
              Import file
            </Button>
          </div>

          <div className="grid gap-4 rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-4 sm:p-5">
            <div>
              <p className="text-sm font-semibold text-cyan-50">
                Website import
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Paste one public event page.
              </p>
            </div>
            <Input
              inputMode="url"
              onChange={(event) => {
                setWebsiteUrl(event.target.value);
                setPendingDraft(null);
                setImportState(INITIAL_IMPORT_STATE);
              }}
              placeholder="https://example.com/event"
              type="url"
              value={websiteUrl}
            />
            <Button
              className="w-full"
              disabled={importDisabled}
              onClick={importFromWebsite}
              type="button"
              variant="secondary"
            >
              Import website
            </Button>
          </div>
        </div>

        {importState.status !== "idle" ? (
          <div className="border-t border-white/10 px-4 py-4 sm:px-6">
            <div
              className={[
                "rounded-3xl border px-4 py-4 text-sm leading-6",
                importState.status === "error"
                  ? "border-rose-300/30 bg-rose-400/10 text-rose-100"
                  : importState.status === "loading"
                    ? "border-cyan-100/25 bg-cyan-100/[0.06] text-cyan-50"
                    : "border-emerald-200/25 bg-emerald-300/[0.08] text-emerald-50",
              ].join(" ")}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="font-medium">{importState.message}</p>
                {pendingDraft ? (
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button
                      className="border-cyan-100/50 bg-cyan-100 text-slate-950 hover:bg-white"
                      onClick={applyPendingDraft}
                      type="button"
                    >
                      Replace draft
                    </Button>
                    <Button
                      onClick={() => {
                        setPendingDraft(null);
                        setImportState(INITIAL_IMPORT_STATE);
                      }}
                      type="button"
                      variant="ghost"
                    >
                      Keep current
                    </Button>
                  </div>
                ) : null}
              </div>
              {importState.warnings.length > 0 ? (
                <ul className="mt-3 grid gap-1 text-xs text-slate-200">
                  {importState.warnings.map((warning) => (
                    <li key={warning}>Review: {warning}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>
        ) : null}
      </Card>

      <Card className="overflow-hidden border-cyan-100/15 bg-slate-950/70 p-0">
        <div className="border-b border-white/10 bg-cyan-200/[0.04] px-4 py-4 sm:px-6">
          <p className="evespace-section-kicker">Event Signal</p>
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
              onChange={(event) => updateValue("title", event.target.value)}
              placeholder="Tokyo Summer Culture Festival"
              required
              value={values.title}
            />
          </Field>
          <Field label="Event information *" hint="20-5000 characters">
            <Textarea
              className="min-h-44"
              name="description"
              minLength={20}
              maxLength={5000}
              onChange={(event) => updateValue("description", event.target.value)}
              placeholder="Describe who this event is for, what visitors can expect, and why people should join."
              required
              value={values.description}
            />
          </Field>
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Category">
              <Input
                name="category"
                onChange={(event) => updateValue("category", event.target.value)}
                placeholder="Festival, meetup, school event..."
                value={values.category}
              />
            </Field>
            <Field label="Event website">
              <Input
                name="officialWebsiteUrl"
                onChange={(event) => updateValue("officialWebsiteUrl", event.target.value)}
                placeholder="https://example.com"
                type="url"
                value={values.officialWebsiteUrl}
              />
            </Field>
          </div>
        </div>
      </Card>

      <Card className="grid gap-5 border-cyan-100/15 bg-slate-950/55">
        <div>
          <p className="evespace-section-kicker">Hero Block</p>
          <h2 className="evespace-section-title mt-2">Banner background</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {BOARD_THEME_OPTIONS.map((theme) => {
            const background = getBoardTheme(theme);
            const selected = selectedHeroTheme === theme;

            return (
              <label
                className={[
                  "group cursor-pointer rounded-3xl border p-3 transition",
                  selected
                    ? "border-cyan-100 bg-cyan-100/[0.08] shadow-[0_0_24px_rgba(103,232,249,0.16)]"
                    : "border-white/10 bg-white/[0.045] hover:border-cyan-100/35",
                ].join(" ")}
                key={theme}
              >
                <input
                  checked={selected}
                  className="sr-only"
                  name="boardBackgroundTheme"
                  onChange={() => setSelectedHeroTheme(theme)}
                  type="radio"
                  value={theme}
                />
                <span
                  className={[
                    "block aspect-[16/7] rounded-2xl border border-white/10",
                    background.previewClassName,
                  ].join(" ")}
                />
                <span className="mt-3 block text-sm font-semibold text-cyan-50">
                  {background.label}
                </span>
              </label>
            );
          })}
        </div>
        <Field label="Upload banner image" hint="JPG, PNG, or WebP under 5 MB">
          <Input
            accept="image/jpeg,image/png,image/webp"
            name="heroImage"
            type="file"
          />
        </Field>
      </Card>

      <Card className="grid gap-5 border-cyan-100/15 bg-slate-950/55">
        <div>
          <p className="evespace-section-kicker">Coordinates</p>
          <h2 className="evespace-section-title mt-2">
            Location and access
          </h2>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Location name">
            <Input
              name="locationName"
              onChange={(event) => updateValue("locationName", event.target.value)}
              placeholder="Main campus quad"
              value={values.locationName}
            />
          </Field>
          <Field label="Location address">
            <Input
              name="address"
              onChange={(event) => updateValue("address", event.target.value)}
              placeholder="1 Event Way, Tokyo"
              value={values.address}
            />
          </Field>
        </div>
        <Field label="Google Maps URL">
          <Input
            name="googleMapsUrl"
            onChange={(event) => updateValue("googleMapsUrl", event.target.value)}
            placeholder="https://maps.google.com/..."
            type="url"
            value={values.googleMapsUrl}
          />
        </Field>
        <Field label="Access information" hint="Optional, max 3000 characters">
          <Textarea
            name="accessInformation"
            maxLength={3000}
            onChange={(event) => updateValue("accessInformation", event.target.value)}
            placeholder="Tickets, gate instructions, parking, ID requirements, accessibility notes..."
            value={values.accessInformation}
          />
        </Field>
      </Card>

      <Card className="grid gap-5 border-cyan-100/15 bg-slate-950/55">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="evespace-section-kicker">Timeline</p>
            <h2 className="evespace-section-title mt-2">Schedule</h2>
          </div>
          <Button type="button" variant="secondary" onClick={() => addScheduleRow()}>
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
                    onClick={() => removeScheduleRow(row.id)}
                  >
                    Remove
                  </Button>
                </div>
                <Field label="Title">
                  <Input
                    name="scheduleTitle"
                    maxLength={150}
                    onChange={(event) => updateScheduleRow(row.id, "title", event.target.value)}
                    placeholder="Opening Ceremony"
                    value={row.title}
                  />
                </Field>
                <div className="grid gap-4 md:grid-cols-3">
                  <Field label="Start time">
                    <Input
                      name="scheduleStartTime"
                      onChange={(event) =>
                        updateScheduleRow(row.id, "startTime", event.target.value)
                      }
                      type="datetime-local"
                      value={row.startTime}
                    />
                  </Field>
                  <Field label="End time">
                    <Input
                      name="scheduleEndTime"
                      onChange={(event) => updateScheduleRow(row.id, "endTime", event.target.value)}
                      type="datetime-local"
                      value={row.endTime}
                    />
                  </Field>
                  <Field label="Location">
                    <Input
                      name="scheduleLocation"
                      maxLength={200}
                      onChange={(event) =>
                        updateScheduleRow(row.id, "locationLabel", event.target.value)
                      }
                      placeholder="Main Stage"
                      value={row.locationLabel}
                    />
                  </Field>
                </div>
                <Field label="Description">
                  <Textarea
                    name="scheduleDescription"
                    maxLength={1000}
                    onChange={(event) =>
                      updateScheduleRow(row.id, "description", event.target.value)
                    }
                    placeholder="Optional schedule detail"
                    value={row.description}
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
            <p className="evespace-section-kicker">Market Layer</p>
            <h2 className="evespace-section-title mt-2">
              Goods and services
            </h2>
          </div>
          <Button type="button" variant="secondary" onClick={() => addGoodsRow()}>
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
                    onClick={() => removeGoodsRow(row.id)}
                  >
                    Remove
                  </Button>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Item name">
                    <Input
                      name="goodsName"
                      maxLength={150}
                      onChange={(event) => updateGoodsRow(row.id, "name", event.target.value)}
                      placeholder="EveSpace Sticker Pack"
                      value={row.name}
                    />
                  </Field>
                  <Field label="Price">
                    <Input
                      name="goodsPrice"
                      maxLength={50}
                      onChange={(event) => updateGoodsRow(row.id, "price", event.target.value)}
                      placeholder="$5"
                      value={row.price}
                    />
                  </Field>
                </div>
                <Field label="Description">
                  <Textarea
                    name="goodsDescriptionItem"
                    maxLength={1000}
                    onChange={(event) =>
                      updateGoodsRow(row.id, "description", event.target.value)
                    }
                    placeholder="Optional item details"
                    value={row.description}
                  />
                </Field>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Image URL">
                    <Input
                      name="goodsImageUrl"
                      onChange={(event) => updateGoodsRow(row.id, "imageUrl", event.target.value)}
                      placeholder="https://..."
                      type="url"
                      value={row.imageUrl}
                    />
                  </Field>
                  <Field label="External link">
                    <Input
                      name="goodsExternalLink"
                      onChange={(event) =>
                        updateGoodsRow(row.id, "externalLink", event.target.value)
                      }
                      placeholder="https://..."
                      type="url"
                      value={row.externalLink}
                    />
                  </Field>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="grid gap-5 border-cyan-100/15 bg-slate-950/55">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="evespace-section-kicker">Supporters</p>
            <h2 className="evespace-section-title mt-2">Sponsors</h2>
          </div>
          <Button type="button" variant="secondary" onClick={() => addSponsorRow()}>
            Add sponsor
          </Button>
        </div>
        {sponsorRows.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-white/15 bg-white/[0.04] px-4 py-4 text-sm text-slate-300">
            Add sponsor names, tiers, logos, or links if useful.
          </p>
        ) : (
          <div className="grid gap-4">
            {sponsorRows.map((row, index) => (
              <div
                className="grid gap-4 rounded-3xl border border-white/10 bg-white/[0.045] p-4"
                key={row.id}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-cyan-50">
                    Sponsor {index + 1}
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => removeSponsorRow(row.id)}
                  >
                    Remove
                  </Button>
                </div>
                <div className="grid gap-4 md:grid-cols-[7rem_1fr]">
                  <div
                    aria-label={row.logoUrl ? `${row.name || "Sponsor"} logo preview` : "Sponsor logo preview"}
                    className="aspect-square rounded-3xl border border-white/10 bg-slate-950/70 bg-contain bg-center bg-no-repeat"
                    style={row.logoUrl ? { backgroundImage: `url(${row.logoUrl})` } : undefined}
                  />
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Sponsor name">
                      <Input
                        name="sponsorName"
                        maxLength={150}
                        onChange={(event) => updateSponsorRow(row.id, "name", event.target.value)}
                        placeholder="Acme Studio"
                        value={row.name}
                      />
                    </Field>
                    <Field label="Tier">
                      <Input
                        name="sponsorTier"
                        maxLength={80}
                        onChange={(event) => updateSponsorRow(row.id, "tier", event.target.value)}
                        placeholder="Gold, partner, supporter..."
                        value={row.tier}
                      />
                    </Field>
                  </div>
                </div>
                <Field label="Description">
                  <Textarea
                    name="sponsorDescription"
                    maxLength={1000}
                    onChange={(event) =>
                      updateSponsorRow(row.id, "description", event.target.value)
                    }
                    placeholder="Optional sponsor details"
                    value={row.description}
                  />
                </Field>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Logo URL">
                    <Input
                      name="sponsorLogoUrl"
                      onChange={(event) => updateSponsorRow(row.id, "logoUrl", event.target.value)}
                      placeholder="https://..."
                      type="url"
                      value={row.logoUrl}
                    />
                  </Field>
                  <Field label="Website">
                    <Input
                      name="sponsorWebsiteUrl"
                      onChange={(event) =>
                        updateSponsorRow(row.id, "websiteUrl", event.target.value)
                      }
                      placeholder="https://..."
                      type="url"
                      value={row.websiteUrl}
                    />
                  </Field>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="grid gap-5 border-cyan-100/15 bg-slate-950/55">
        <div>
          <p className="evespace-section-kicker">Memory Board Gate</p>
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
          Official event posts can include up to 3 stickers.
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

function makeScheduleRow(row: Partial<ScheduleRow> = {}): ScheduleRow {
  return {
    id: row.id ?? makeClientId("schedule"),
    title: row.title ?? "",
    description: row.description ?? "",
    startTime: row.startTime ?? "",
    endTime: row.endTime ?? "",
    locationLabel: row.locationLabel ?? "",
  };
}

function makeGoodsRow(row: Partial<GoodsRow> = {}): GoodsRow {
  return {
    id: row.id ?? makeClientId("goods"),
    name: row.name ?? "",
    description: row.description ?? "",
    price: row.price ?? "",
    imageUrl: row.imageUrl ?? "",
    externalLink: row.externalLink ?? "",
  };
}

function makeSponsorRow(row: Partial<SponsorRow> = {}): SponsorRow {
  return {
    id: row.id ?? makeClientId("sponsor"),
    name: row.name ?? "",
    description: row.description ?? "",
    tier: row.tier ?? "",
    logoUrl: row.logoUrl ?? "",
    websiteUrl: row.websiteUrl ?? "",
  };
}

function makeClientId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function hasDraftContent(
  values: BasicFormValues,
  scheduleRows: ScheduleRow[],
  goodsRows: GoodsRow[],
  sponsorRows: SponsorRow[],
) {
  return (
    Object.values(values).some((value) => value.trim().length > 0) ||
    scheduleRows.some((row) =>
      [row.title, row.description, row.startTime, row.endTime, row.locationLabel].some(
        (value) => value.trim().length > 0,
      ),
    ) ||
    goodsRows.some((row) =>
      [row.name, row.description, row.price, row.imageUrl, row.externalLink].some(
        (value) => value.trim().length > 0,
      ),
    ) ||
    sponsorRows.some((row) =>
      [row.name, row.description, row.tier, row.logoUrl, row.websiteUrl].some(
        (value) => value.trim().length > 0,
      ),
    )
  );
}
