"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useFormStatus } from "react-dom";
import Image from "next/image";
import {
  PhotoDoodleEditor,
  type PhotoDoodleEditorHandle,
} from "@/components/board/PhotoDoodleEditor";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, Textarea } from "@/components/ui/Field";
import { acceptedImageTypes, maxUploadSizeBytes } from "@/lib/constants";
import {
  defaultMemoryPaperStyle,
  defaultMemoryPenStyle,
  memoryPaperStyleOptions,
  memoryPenStyleOptions,
} from "@/lib/memory-post-style.mjs";
import { cn } from "@/lib/utils";
import type { MemoryPenStyle, StickyNoteStyle } from "@/types/evespace";

type MemoryPaperStyle = Extract<StickyNoteStyle, "sky" | "mint" | "lavender">;

function getPaperClassName(style: MemoryPaperStyle) {
  return (
    memoryPaperStyleOptions.find((option) => option.id === style)?.className ??
    "memory-paper-mint"
  );
}

function getPenClassName(style: MemoryPenStyle) {
  return (
    memoryPenStyleOptions.find((option) => option.id === style)?.className ??
    "memory-pen-classic"
  );
}

function MemoryPostSubmitButton({
  hasPhoto,
  message,
  preparing,
}: {
  hasPhoto: boolean;
  message: string;
  preparing: boolean;
}) {
  const { pending } = useFormStatus();
  const busy = pending || preparing;
  const ready = message.trim().length > 0 || hasPhoto;

  return (
    <Button
      className={cn(
        "memory-scrapbook-submit w-full rounded-full border-2 px-5 py-3 text-sm font-black shadow-none sm:w-auto",
        !ready && !busy && "disabled:opacity-55",
        busy && "cursor-wait opacity-80",
      )}
      disabled={!ready || busy}
      type="submit"
    >
      {preparing ? "Preparing photo..." : pending ? "Posting..." : "Post Memory"}
    </Button>
  );
}

export function MemoryPostForm({
  action,
  officialEvent = false,
}: {
  action: (formData: FormData) => Promise<void>;
  officialEvent?: boolean;
}) {
  const formRef = useRef<HTMLFormElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const previewUrlRef = useRef<string | null>(null);
  const doodleEditorRef = useRef<PhotoDoodleEditorHandle | null>(null);
  const allowPreparedSubmitRef = useRef(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [hasDoodles, setHasDoodles] = useState(false);
  const [isPreparingPhoto, setIsPreparingPhoto] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [message, setMessage] = useState("");
  const [stickyNoteStyle, setStickyNoteStyle] = useState<MemoryPaperStyle>(
    defaultMemoryPaperStyle as MemoryPaperStyle,
  );
  const [memoryPenStyle, setMemoryPenStyle] = useState<MemoryPenStyle>(
    defaultMemoryPenStyle as MemoryPenStyle,
  );
  const [createdAt] = useState(() => new Date().toISOString());
  const paperClassName = getPaperClassName(stickyNoteStyle);
  const penClassName = getPenClassName(memoryPenStyle);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (allowPreparedSubmitRef.current) {
      allowPreparedSubmitRef.current = false;
      return;
    }

    if (!message.trim() && !file) {
      event.preventDefault();
      return;
    }

    if (!doodleEditorRef.current?.hasDoodles()) {
      return;
    }

    event.preventDefault();
    setSubmitError("");
    setIsPreparingPhoto(true);

    let shouldSubmit = false;

    try {
      const editedFile = await doodleEditorRef.current.prepareEditedFile();

      if (!editedFile) {
        shouldSubmit = true;
      } else if (editedFile.size > maxUploadSizeBytes) {
        setSubmitError("The doodled photo is too large. Try a smaller original image.");
      } else if (!fileInputRef.current || typeof DataTransfer === "undefined") {
        setSubmitError("This browser could not attach the doodled photo.");
      } else {
        const transfer = new DataTransfer();
        transfer.items.add(editedFile);
        fileInputRef.current.files = transfer.files;
        shouldSubmit = true;
      }
    } catch {
      setSubmitError("The doodled photo could not be prepared.");
    } finally {
      setIsPreparingPhoto(false);
    }

    if (shouldSubmit) {
      allowPreparedSubmitRef.current = true;
      formRef.current?.requestSubmit();
    }
  }

  function handleFileChange(nextFile: File | null) {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }

    const nextPreviewUrl = nextFile ? URL.createObjectURL(nextFile) : null;
    previewUrlRef.current = nextPreviewUrl;
    setFile(nextFile);
    setPreviewUrl(nextPreviewUrl);
    setHasDoodles(false);
    setSubmitError("");
  }

  return (
    <div className="memory-post-create-shell mx-auto w-full min-w-0 overflow-hidden">
      <Card className="memory-post-create-card w-full min-w-0 overflow-hidden p-4 shadow-none max-[360px]:p-3 sm:p-5 lg:p-6">
        <form
          action={action}
          className="grid gap-5"
          onSubmit={handleSubmit}
          ref={formRef}
        >
          <input name="stickyNoteStyle" type="hidden" value={stickyNoteStyle} />
          <input name="memoryPenStyle" type="hidden" value={memoryPenStyle} />

          <div className="grid gap-3 lg:grid-cols-2">
            <section className="memory-scrapbook-section grid gap-3 rounded-[1.25rem] border-2 border-dashed p-3 sm:p-4">
              <h3 className="text-lg font-black text-[#2b1d17]">
                Pick Your Paper Color
              </h3>
              <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Paper color">
                {memoryPaperStyleOptions.map((option) => (
                  <button
                    aria-pressed={stickyNoteStyle === option.id}
                    className={cn(
                      "memory-paper-choice min-h-12 rounded-[1rem] border-2 px-3 text-sm font-black transition",
                      option.className,
                      stickyNoteStyle === option.id && "is-selected",
                    )}
                    key={option.id}
                    onClick={() => setStickyNoteStyle(option.id as MemoryPaperStyle)}
                    type="button"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </section>

            <section className="memory-scrapbook-section grid gap-3 rounded-[1.25rem] border-2 border-dashed p-3 sm:p-4">
              <h3 className="text-lg font-black text-[#2b1d17]">
                Choose Your Pen
              </h3>
              <div className="grid gap-2 sm:grid-cols-3" role="radiogroup" aria-label="Pen style">
                {memoryPenStyleOptions.map((option) => (
                  <button
                    aria-pressed={memoryPenStyle === option.id}
                    className={cn(
                      "memory-pen-choice min-h-16 rounded-[1rem] border-2 px-3 py-2 text-left transition",
                      memoryPenStyle === option.id && "is-selected",
                    )}
                    key={option.id}
                    onClick={() => setMemoryPenStyle(option.id as MemoryPenStyle)}
                    type="button"
                  >
                    <span className={cn("block text-sm text-[#2b1d17]", option.className)}>
                      {option.label}
                    </span>
                    <span className="mt-1 block text-xs font-semibold text-[#725a4d]">
                      {option.description}
                    </span>
                  </button>
                ))}
              </div>
            </section>
          </div>

          <Field label="Message">
            <Textarea
              className={cn(
                "memory-message-paper min-h-[13rem] resize-y rounded-[0.95rem] border-2 px-4 py-4 text-base outline-none transition sm:min-h-[15rem]",
                paperClassName,
                penClassName,
              )}
              maxLength={1200}
              name="message"
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Message (optional)"
              value={message}
            />
          </Field>

          <section className="memory-scrapbook-section grid gap-3 rounded-[1.25rem] border-2 border-dashed p-3 sm:p-4">
            <Field
              label="Optional Photo"
              hint={`JPG, PNG, or WebP. Max ${Math.round(maxUploadSizeBytes / 1024 / 1024)}MB.`}
            >
              <label className="memory-upload-dropzone flex cursor-pointer items-center gap-3 rounded-[1rem] border-2 border-dashed px-3 py-3 transition sm:gap-4 sm:px-4">
                <span className="memory-upload-icon-frame flex h-14 w-14 shrink-0 items-center justify-center rounded-[0.9rem]">
                  <Image
                    alt=""
                    aria-hidden="true"
                    className="h-11 w-11 object-contain"
                    height={44}
                    src="/memory-board-actions/upload.png"
                    width={44}
                  />
                </span>
                <span className="grid min-w-0 flex-1 gap-1">
                  <span className="text-sm font-black text-[#2b1d17]">
                    {file ? "Photo selected" : "Upload a photo"}
                  </span>
                  <span className="memory-upload-meta truncate text-xs font-semibold">
                    {file ? file.name : "No photo selected"}
                  </span>
                </span>
                <span className="memory-upload-button shrink-0 rounded-full px-3 py-2 text-xs font-black">
                  Choose
                </span>
                <input
                  accept={acceptedImageTypes.join(",")}
                  className="sr-only"
                  name="photo"
                  onChange={(event) => {
                    handleFileChange(event.target.files?.[0] ?? null);
                  }}
                  ref={fileInputRef}
                  type="file"
                />
              </label>
            </Field>

            {file ? (
              <div className="grid gap-2">
                <div>
                  <p className="text-sm font-black text-[#2b1d17]">Doodle on photo</p>
                  <p className="mt-1 text-xs font-semibold text-[#725a4d]">
                    {hasDoodles ? "Doodles will be saved into the uploaded image." : "Optional"}
                  </p>
                </div>
                <PhotoDoodleEditor
                  authorDisplayName="You"
                  caption={message}
                  createdAt={createdAt}
                  file={file}
                  imageUrl={previewUrl}
                  onDoodleStateChange={setHasDoodles}
                  ref={doodleEditorRef}
                />
              </div>
            ) : null}
          </section>

          <p className="text-xs leading-5 text-[#725a4d]">
            {officialEvent
              ? "Official event posts can still use up to 3 stickers on the board."
              : "Stickers can still be added from the memory board after posting."}
          </p>

          {submitError ? (
            <p className="rounded-[1rem] border-2 border-rose-300/60 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-900">
              {submitError}
            </p>
          ) : null}

          <MemoryPostSubmitButton
            hasPhoto={Boolean(file)}
            message={message}
            preparing={isPreparingPhoto}
          />
        </form>
      </Card>
    </div>
  );
}
