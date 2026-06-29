"use client";

import { useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { Card } from "@/components/ui/Card";
import { Field, Textarea } from "@/components/ui/Field";
import {
  defaultMemoryPaperStyle,
  defaultMemoryPenStyle,
  memoryPaperStyleOptions,
  memoryPenStyleOptions,
} from "@/lib/memory-post-style.mjs";
import { cn } from "@/lib/utils";
import type {
  MemoryPenStyle,
  MemoryPost,
  StickyNoteStyle,
} from "@/types/evespace";

type MemoryPaperStyle = Extract<StickyNoteStyle, "sky" | "mint" | "lavender">;

function getPaperClassName(style: StickyNoteStyle) {
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

export function MemoryPostEditForm({
  action,
  post,
}: {
  action: (formData: FormData) => void | Promise<void>;
  post: MemoryPost;
}) {
  const initialPaperStyle = useMemo(
    () =>
      memoryPaperStyleOptions.some((option) => option.id === post.stickyNoteStyle)
        ? (post.stickyNoteStyle as MemoryPaperStyle)
        : (defaultMemoryPaperStyle as MemoryPaperStyle),
    [post.stickyNoteStyle],
  );
  const initialPenStyle = useMemo(
    () =>
      memoryPenStyleOptions.some((option) => option.id === post.memoryPenStyle)
        ? post.memoryPenStyle
        : (defaultMemoryPenStyle as MemoryPenStyle),
    [post.memoryPenStyle],
  );
  const [message, setMessage] = useState(post.caption ?? "");
  const [stickyNoteStyle, setStickyNoteStyle] =
    useState<MemoryPaperStyle>(initialPaperStyle);
  const [memoryPenStyle, setMemoryPenStyle] =
    useState<MemoryPenStyle>(initialPenStyle);
  const paperClassName = getPaperClassName(stickyNoteStyle);
  const penClassName = getPenClassName(memoryPenStyle);

  return (
    <div className="memory-post-create-shell mx-auto w-full min-w-0 overflow-hidden">
      <Card className="memory-post-create-card memory-post-edit-card w-full min-w-0 overflow-hidden p-4 shadow-none max-[360px]:p-3 sm:p-5 lg:p-6">
        <form action={action} className="grid gap-5">
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
              placeholder="Message"
              required
              value={message}
            />
          </Field>

          <p className="text-xs leading-5 text-[#725a4d]">
            Existing photo, comments, stickers, and doodles stay with this memory.
          </p>

          <MemoryPostEditSubmitButton message={message} />
        </form>
      </Card>
    </div>
  );
}

function MemoryPostEditSubmitButton({ message }: { message: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      className="memory-scrapbook-submit inline-flex min-h-12 w-full items-center justify-center rounded-full px-5 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-55 sm:w-auto sm:justify-self-start"
      disabled={pending || message.trim().length === 0}
      type="submit"
    >
      {pending ? "Saving..." : "Save memory"}
    </button>
  );
}
