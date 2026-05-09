"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useFormStatus } from "react-dom";
import {
  PhotoDoodleEditor,
  type PhotoDoodleEditorHandle,
} from "@/components/board/PhotoDoodleEditor";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { acceptedImageTypes, maxUploadSizeBytes } from "@/lib/constants";
import { cn } from "@/lib/utils";

function MemoryPostSubmitButton({
  fileSelected,
  preparing,
}: {
  fileSelected: boolean;
  preparing: boolean;
}) {
  const { pending } = useFormStatus();
  const busy = pending || preparing;

  return (
    <Button
      className={cn(
        "w-full sm:w-auto",
        busy &&
          "cursor-wait border-slate-500 bg-slate-500 text-white hover:border-slate-500 hover:bg-slate-500",
      )}
      disabled={!fileSelected || busy}
      type="submit"
    >
      {preparing ? "Preparing photo…" : pending ? "Posting…" : "Post Memory"}
    </Button>
  );
}

export function MemoryPostForm({
  action,
}: {
  action: (formData: FormData) => Promise<void>;
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
  const [authorDisplayName, setAuthorDisplayName] = useState("");
  const [caption, setCaption] = useState("");
  const [createdAt] = useState(() => new Date().toISOString());

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
    <div className="w-full max-w-3xl min-w-0 overflow-hidden">
      <Card className="w-full min-w-0 overflow-hidden p-4 max-[360px]:p-3 sm:p-5">
        <form action={action} className="grid gap-6" onSubmit={handleSubmit} ref={formRef}>
          <Field label="Upload photo" hint="JPG, PNG, or WebP. Max 5MB.">
            <Input
              className="w-full min-w-0 max-w-full text-[0.8rem] file:mr-3 file:max-w-[8rem] file:truncate"
              ref={fileInputRef}
              name="photo"
              type="file"
              accept={acceptedImageTypes.join(",")}
              onChange={(event) => {
                handleFileChange(event.target.files?.[0] ?? null);
              }}
            />
          </Field>

          <div className="grid gap-2">
            <div>
              <p className="text-sm font-medium text-slate-200">Doodle on photo</p>
              <p className="mt-1 text-xs text-slate-400">
                {hasDoodles ? "Doodles will be saved into the uploaded image." : "Optional"}
              </p>
            </div>
            <PhotoDoodleEditor
              authorDisplayName={authorDisplayName || "You"}
              caption={caption}
              createdAt={createdAt}
              file={file}
              imageUrl={previewUrl}
              onDoodleStateChange={setHasDoodles}
              ref={doodleEditorRef}
            />
          </div>

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
            Stickers can still be added from the memory board after posting.
          </p>
          {submitError ? (
            <p className="rounded-2xl border border-rose-300/20 bg-rose-400/10 px-4 py-3 text-sm font-medium text-rose-100">
              {submitError}
            </p>
          ) : null}

          <MemoryPostSubmitButton
            fileSelected={Boolean(file)}
            preparing={isPreparingPhoto}
          />
        </form>
      </Card>
    </div>
  );
}
