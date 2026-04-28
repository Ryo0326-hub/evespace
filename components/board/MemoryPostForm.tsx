"use client";

import { useMemo, useState } from "react";
import { FrameSelector } from "@/components/board/FrameSelector";
import { MemoryCard } from "@/components/board/MemoryCard";
import { StickyNoteSelector } from "@/components/board/StickyNoteSelector";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { acceptedImageTypes, maxUploadSizeBytes } from "@/lib/constants";
import type { Event, FrameStyle, MemoryPost, StickyNoteStyle } from "@/types/evespace";

export function MemoryPostForm({
  action,
  event,
}: {
  action: (formData: FormData) => Promise<void>;
  event: Event;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [authorDisplayName, setAuthorDisplayName] = useState("");
  const [caption, setCaption] = useState("");
  const [frameStyle, setFrameStyle] = useState<FrameStyle>("polaroid");
  const [stickyNoteStyle, setStickyNoteStyle] = useState<StickyNoteStyle>("yellow");

  const previewPost = useMemo<MemoryPost>(
    () => ({
      id: "preview",
      eventId: event.id,
      userId: null,
      profileId: null,
      clerkUserId: null,
      authorDisplayName: authorDisplayName || "You",
      imageUrl:
        previewUrl ||
        "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=900&q=80",
      storagePath: null,
      caption: caption || "Your note will appear here.",
      frameStyle,
      stickyNoteStyle,
      stickerId: null,
      boardX: null,
      boardY: null,
      rotation: -1,
      status: "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }),
    [authorDisplayName, caption, event.id, frameStyle, previewUrl, stickyNoteStyle],
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
      <Card>
        <form action={action} className="grid gap-6">
          <input name="frameStyle" type="hidden" value={frameStyle} />
          <input name="stickyNoteStyle" type="hidden" value={stickyNoteStyle} />
          <Field label="Upload photo" hint="JPG, PNG, or WebP. Max 5MB.">
            <Input
              name="photo"
              type="file"
              accept={acceptedImageTypes.join(",")}
              onChange={(event) => {
                const nextFile = event.target.files?.[0] ?? null;
                setFile(nextFile);
                setPreviewUrl(nextFile ? URL.createObjectURL(nextFile) : null);
              }}
            />
          </Field>

          <Field label="Display name">
            <Input
              name="authorDisplayName"
              value={authorDisplayName}
              onChange={(event) => setAuthorDisplayName(event.target.value)}
              placeholder="Anonymous"
            />
          </Field>

          <Field label="Sticky note">
            <Textarea
              name="caption"
              value={caption}
              onChange={(event) => setCaption(event.target.value)}
              placeholder="Leave a memory..."
              maxLength={280}
            />
          </Field>

          <div className="grid gap-3">
            <p className="text-sm font-medium text-slate-200">Frame style</p>
            <FrameSelector value={frameStyle} onChange={setFrameStyle} />
          </div>

          <div className="grid gap-3">
            <p className="text-sm font-medium text-slate-200">Sticky note style</p>
            <StickyNoteSelector
              value={stickyNoteStyle}
              onChange={setStickyNoteStyle}
            />
          </div>

          <p className="text-xs leading-5 text-slate-400">
            Uploads are saved securely to Supabase Storage. Max size:{" "}
            {Math.round(maxUploadSizeBytes / 1024 / 1024)}MB.
          </p>

          <Button className="w-full sm:w-auto" type="submit" disabled={!file}>
            Post Memory
          </Button>
        </form>
      </Card>

      <aside className="mx-auto w-full max-w-[26rem] lg:max-w-none">
        <p className="mb-3 text-sm font-medium text-slate-300">Preview</p>
        <MemoryCard post={previewPost} />
      </aside>
    </div>
  );
}
