"use client";

import { useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { MemoryCard } from "@/components/board/MemoryCard";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { acceptedImageTypes, maxUploadSizeBytes } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { Board, MemoryPost } from "@/types/evespace";

function MemoryPostSubmitButton({ fileSelected }: { fileSelected: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button
      className={cn(
        "w-full sm:w-auto",
        pending &&
          "cursor-wait border-slate-500 bg-slate-500 text-white hover:border-slate-500 hover:bg-slate-500",
      )}
      disabled={!fileSelected || pending}
      type="submit"
    >
      {pending ? "Posting…" : "Post Memory"}
    </Button>
  );
}

export function MemoryPostForm({
  action,
  board,
}: {
  action: (formData: FormData) => Promise<void>;
  board: Board;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [authorDisplayName, setAuthorDisplayName] = useState("");
  const [caption, setCaption] = useState("");

  const previewPost = useMemo<MemoryPost>(
    () => ({
      id: "preview",
      boardId: board.id,
      eventId: board.id,
      userId: null,
      profileId: null,
      clerkUserId: null,
      authorDisplayName: authorDisplayName || "You",
      imageUrl:
        previewUrl ||
        "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=900&q=80",
      storagePath: null,
      caption: caption || "Your note will appear here.",
      stickers: [],
      overlayStickers: [],
      frameStyle: "none",
      stickyNoteStyle: "default",
      stickerId: null,
      boardX: null,
      boardY: null,
      rotation: -1,
      status: "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }),
    [authorDisplayName, board.id, caption, previewUrl],
  );

  return (
    <div className="grid w-full max-w-full min-w-0 gap-6 overflow-hidden lg:grid-cols-[minmax(0,1fr)_24rem]">
      <Card className="w-full min-w-0">
        <form action={action} className="grid gap-6">
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

          <Field label="Caption">
            <Textarea
              name="caption"
              value={caption}
              onChange={(event) => setCaption(event.target.value)}
              placeholder="Leave a memory..."
              maxLength={280}
            />
          </Field>

          <p className="text-xs leading-5 text-slate-400">
            Uploads are saved securely to Supabase Storage. Max size:{" "}
            {Math.round(maxUploadSizeBytes / 1024 / 1024)}MB.
            Add stickers from the memory board after posting.
          </p>

          <MemoryPostSubmitButton fileSelected={Boolean(file)} />
        </form>
      </Card>

      <aside className="mx-auto w-full max-w-full min-w-0 sm:max-w-[26rem] lg:max-w-none">
        <p className="mb-3 text-sm font-medium text-slate-300">Preview</p>
        <div className="mx-auto w-full max-w-[min(26rem,100%)]">
          <MemoryCard post={previewPost} />
        </div>
      </aside>
    </div>
  );
}
