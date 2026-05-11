"use client";

import { useActionState, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  createMemoryCommentAction,
  type CreateMemoryCommentState,
} from "@/app/actions/memories";
import {
  buildMemoryCommentThreads,
  countThreadComments,
  getCollapsedThreadPreview,
} from "@/lib/comments/memory-comment-threads.mjs";
import { formatDate } from "@/lib/utils";
import type { MemoryPostComment } from "@/types/evespace";

const initialState: CreateMemoryCommentState = {
  error: null,
  ok: false,
};

type CommentAction = (
  prevState: CreateMemoryCommentState,
  formData: FormData,
) => Promise<CreateMemoryCommentState>;

type MemoryCommentThread = {
  comment: MemoryPostComment;
  replies: MemoryPostComment[];
};

function CommentSubmitButton({
  label = "Comment",
  pendingLabel = "Posting",
}: {
  label?: string;
  pendingLabel?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      className="inline-flex min-h-9 shrink-0 items-center justify-center rounded-full border border-black bg-black px-4 py-2 text-xs font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
      disabled={pending}
      type="submit"
    >
      {pending ? pendingLabel : label}
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
  const [expanded, setExpanded] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const action = createMemoryCommentAction.bind(null, boardId, postId, returnPath);
  const threads = useMemo(
    () => buildMemoryCommentThreads(comments) as MemoryCommentThread[],
    [comments],
  );
  const totalComments = countThreadComments(threads);
  const previewThread = getCollapsedThreadPreview(threads) as MemoryCommentThread | null;
  const commentsRegionId = `comments-${postId}`;
  const closeReplyForm = useCallback(() => {
    setReplyingTo(null);
  }, []);

  return (
    <section className="relative z-10 mt-2 border-t border-black/10 px-1 pt-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-slate-600">
          Comments
        </h2>
        <button
          aria-controls={commentsRegionId}
          aria-expanded={expanded}
          className="rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-bold text-slate-700 transition hover:border-black/25 hover:text-black"
          onClick={() => setExpanded((current) => !current)}
          type="button"
        >
          {expanded
            ? "Hide"
            : totalComments > 1
              ? `View all ${totalComments}`
              : totalComments === 1
                ? "Open comment"
              : "Add comment"}
        </button>
      </div>

      {!expanded && previewThread ? (
        <div className="mt-3">
          <CommentBubble comment={previewThread.comment} />
          {previewThread.replies.length > 0 ? (
            <p className="mt-1 pl-3 text-xs font-semibold text-slate-500">
              {previewThread.replies.length}{" "}
              {previewThread.replies.length === 1 ? "reply" : "replies"} hidden
            </p>
          ) : null}
        </div>
      ) : null}

      {!expanded && totalComments === 0 ? (
        <p className="mt-3 text-sm text-slate-500">
          No comments yet.
        </p>
      ) : null}

      <div className={expanded ? "mt-3 grid gap-3" : "hidden"} id={commentsRegionId}>
        {threads.length > 0 ? (
          <div className="grid gap-3">
            {threads.map((thread) => (
              <CommentThread
                action={action}
                key={thread.comment.id}
                onPostedReply={closeReplyForm}
                replyingTo={replyingTo}
                setReplyingTo={setReplyingTo}
                thread={thread}
                viewerSignedIn={viewerSignedIn}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">No comments yet.</p>
        )}

        {viewerSignedIn ? (
          <CommentForm action={action} />
        ) : (
          <p className="rounded-xl border border-dashed border-black/20 px-3 py-2 text-sm text-slate-600">
            Sign in to comment.
          </p>
        )}
      </div>
    </section>
  );
}

function CommentThread({
  action,
  onPostedReply,
  replyingTo,
  setReplyingTo,
  thread,
  viewerSignedIn,
}: {
  action: CommentAction;
  onPostedReply: () => void;
  replyingTo: string | null;
  setReplyingTo: (commentId: string | null) => void;
  thread: MemoryCommentThread;
  viewerSignedIn: boolean;
}) {
  const isReplying = replyingTo === thread.comment.id;

  return (
    <article className="grid gap-2">
      <CommentBubble comment={thread.comment} />
      <div className="flex flex-wrap items-center gap-3 pl-3">
        {viewerSignedIn ? (
          <button
            className="text-xs font-bold text-slate-600 transition hover:text-black"
            onClick={() => setReplyingTo(isReplying ? null : thread.comment.id)}
            type="button"
          >
            {isReplying ? "Cancel reply" : "Reply"}
          </button>
        ) : null}
        {thread.replies.length > 0 ? (
          <span className="text-xs font-semibold text-slate-500">
            {thread.replies.length}{" "}
            {thread.replies.length === 1 ? "reply" : "replies"}
          </span>
        ) : null}
      </div>

      {isReplying ? (
        <div className="pl-4">
          <CommentForm
            action={action}
            onPosted={onPostedReply}
            parentCommentId={thread.comment.id}
            placeholder={`Reply to ${thread.comment.authorDisplayName ?? "this comment"}...`}
            submitLabel="Reply"
            successText="Reply posted."
          />
        </div>
      ) : null}

      {thread.replies.length > 0 ? (
        <div className="ml-4 grid gap-2 border-l border-black/10 pl-3">
          {thread.replies.map((reply) => (
            <CommentBubble comment={reply} isReply key={reply.id} />
          ))}
        </div>
      ) : null}
    </article>
  );
}

function CommentBubble({
  comment,
  isReply = false,
}: {
  comment: MemoryPostComment;
  isReply?: boolean;
}) {
  return (
    <div
      className={
        isReply
          ? "rounded-xl bg-white/70 px-3 py-2.5"
          : "rounded-xl bg-slate-100 px-3 py-2.5"
      }
    >
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
    </div>
  );
}

function CommentForm({
  action,
  onPosted,
  parentCommentId,
  placeholder = "Write a comment...",
  submitLabel = "Comment",
  successText = "Comment posted.",
}: {
  action: CommentAction;
  onPosted?: () => void;
  parentCommentId?: string;
  placeholder?: string;
  submitLabel?: string;
  successText?: string;
}) {
  const formRef = useRef<HTMLFormElement | null>(null);
  const [state, formAction] = useActionState(action, initialState);

  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
      onPosted?.();
    }
  }, [onPosted, state.ok]);

  return (
    <form action={formAction} className="grid gap-2" ref={formRef}>
      {parentCommentId ? (
        <input name="parentCommentId" type="hidden" value={parentCommentId} />
      ) : null}
      <textarea
        className="min-h-20 resize-none rounded-xl border border-black/20 bg-white px-3 py-2 text-sm text-black outline-none transition placeholder:text-slate-400 focus:border-black focus:ring-2 focus:ring-cyan-200"
        maxLength={500}
        name="body"
        placeholder={placeholder}
        required
      />
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-slate-500">
          {state.error ?? (state.ok ? successText : "Be kind and keep it short.")}
        </p>
        <CommentSubmitButton label={submitLabel} pendingLabel="Posting" />
      </div>
    </form>
  );
}
