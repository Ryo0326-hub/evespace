"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import {
  createMemoryCommentAction,
  type CreateMemoryCommentState,
} from "@/app/actions/memories";
import { formatDate } from "@/lib/utils";
import type { MemoryPostComment } from "@/types/evespace";

const initialState: CreateMemoryCommentState = {
  error: null,
  ok: false,
};

function CommentSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="inline-flex min-h-9 shrink-0 items-center justify-center rounded-full border border-black bg-black px-4 py-2 text-xs font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
      disabled={pending}
      type="submit"
    >
      {pending ? "Posting" : "Comment"}
    </button>
  );
}

export function MemoryComments({
  boardId,
  comments,
  postId,
  returnPath,
  viewerSignedIn,
}: {
  boardId: string;
  comments: MemoryPostComment[];
  postId: string;
  returnPath: string;
  viewerSignedIn: boolean;
}) {
  const formRef = useRef<HTMLFormElement | null>(null);
  const action = createMemoryCommentAction.bind(null, boardId, postId, returnPath);
  const [state, formAction] = useActionState(action, initialState);

  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
    }
  }, [state.ok]);

  return (
    <section className="relative z-10 mt-2 border-t border-black/10 px-1 pt-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-slate-600">
          Comments
        </h2>
        <span className="text-xs font-semibold text-slate-500">
          {comments.length}
        </span>
      </div>

      {comments.length > 0 ? (
        <div className="mt-3 grid gap-3">
          {comments.map((comment) => (
            <article className="rounded-xl bg-slate-100 px-3 py-2.5" key={comment.id}>
              <div className="flex items-start justify-between gap-3">
                <p className="min-w-0 truncate text-xs font-bold text-black">
                  {comment.authorDisplayName ?? "Evespace Friend"}
                </p>
                <time className="shrink-0 text-[0.68rem] font-medium text-slate-500">
                  {formatDate(comment.createdAt)}
                </time>
              </div>
              <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-5 text-slate-800">
                {comment.body}
              </p>
            </article>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm text-slate-500">
          No comments yet.
        </p>
      )}

      {viewerSignedIn ? (
        <form action={formAction} className="mt-3 grid gap-2" ref={formRef}>
          <textarea
            className="min-h-20 resize-none rounded-xl border border-black/20 bg-white px-3 py-2 text-sm text-black outline-none transition placeholder:text-slate-400 focus:border-black focus:ring-2 focus:ring-cyan-200"
            maxLength={500}
            name="body"
            placeholder="Write a comment..."
            required
          />
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-slate-500">
              {state.error ?? "Be kind and keep it short."}
            </p>
            <CommentSubmitButton />
          </div>
        </form>
      ) : (
        <p className="mt-3 rounded-xl border border-dashed border-black/20 px-3 py-2 text-sm text-slate-600">
          Sign in to comment.
        </p>
      )}
    </section>
  );
}
