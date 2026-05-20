"use client";

import { useActionState, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
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
      className="memory-board-cute-button inline-flex min-h-9 w-full shrink-0 items-center justify-center rounded-full px-4 py-2 text-xs font-black transition disabled:cursor-not-allowed disabled:opacity-50 min-[380px]:w-auto"
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
    <section className="memory-board-comments relative z-10 mt-2 min-w-0 max-w-full overflow-hidden border-t-2 border-dashed px-1 pt-3">
      <div className="flex min-w-0 items-center justify-between gap-2">
        <h2 className="min-w-0 text-xs font-black uppercase tracking-[0.18em] text-slate-600">
          Comments
        </h2>
        <button
          aria-controls={commentsRegionId}
          aria-expanded={expanded}
          className="memory-board-soft-button max-w-[70%] shrink-0 rounded-full px-3 py-1 text-xs font-black transition"
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
        <div className="mt-3 min-w-0 max-w-full">
          <CommentBubble comment={previewThread.comment} />
          {previewThread.replies.length > 0 ? (
            <p className="mt-1 min-w-0 pl-3 text-xs font-semibold text-slate-500">
              {previewThread.replies.length}{" "}
              {previewThread.replies.length === 1 ? "reply" : "replies"} hidden
            </p>
          ) : null}
        </div>
      ) : null}

      {!expanded && totalComments === 0 ? (
        <p className="mt-3 text-sm font-semibold text-slate-500">
          No comments yet.
        </p>
      ) : null}

      <div
        className={expanded ? "mt-3 grid min-w-0 max-w-full gap-3" : "hidden"}
        id={commentsRegionId}
      >
        {threads.length > 0 ? (
          <div className="grid min-w-0 gap-3">
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
          <p className="text-sm font-semibold text-slate-500">No comments yet.</p>
        )}

        {viewerSignedIn ? (
          <CommentForm action={action} />
        ) : (
          <p className="memory-board-comment-note rounded-xl border-2 border-dashed px-3 py-2 text-sm font-semibold">
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
    <article className="grid min-w-0 max-w-full gap-2 overflow-hidden">
      <CommentBubble comment={thread.comment} />
      <div className="flex min-w-0 flex-wrap items-center gap-2 pl-2 sm:gap-3 sm:pl-3">
        {viewerSignedIn ? (
          <button
            className="memory-board-comment-link max-w-full rounded-full px-1 text-xs font-black transition"
            onClick={() => setReplyingTo(isReplying ? null : thread.comment.id)}
            type="button"
          >
            {isReplying ? "Cancel reply" : "Reply"}
          </button>
        ) : null}
        {thread.replies.length > 0 ? (
          <span className="text-xs font-bold text-slate-500">
            {thread.replies.length}{" "}
            {thread.replies.length === 1 ? "reply" : "replies"}
          </span>
        ) : null}
      </div>

      {isReplying ? (
        <div className="min-w-0 max-w-full pl-2 sm:pl-4">
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
        <div className="memory-board-replies ml-2 grid min-w-0 max-w-full gap-2 border-l-2 border-dashed pl-2 sm:ml-4 sm:pl-3">
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
          ? "memory-comment-bubble memory-comment-bubble-reply min-w-0 max-w-full overflow-hidden rounded-xl border px-3 py-2.5"
          : "memory-comment-bubble min-w-0 max-w-full overflow-hidden rounded-xl border px-3 py-2.5"
      }
    >
      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
        <p className="min-w-0 truncate text-xs font-black text-black">
          {comment.authorDisplayName ?? "Evespace Friend"}
        </p>
        <time className="shrink-0 whitespace-nowrap text-[0.68rem] font-semibold text-slate-500">
          {formatDate(comment.createdAt)}
        </time>
      </div>
      <p className="mt-1 min-w-0 whitespace-pre-wrap break-words text-sm font-medium leading-5 text-slate-800 [overflow-wrap:anywhere]">
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
  const router = useRouter();
  const [state, formAction] = useActionState(action, initialState);

  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
      router.refresh();
      onPosted?.();
    }
  }, [onPosted, router, state]);

  return (
    <form action={formAction} className="grid min-w-0 max-w-full gap-2" ref={formRef}>
      {parentCommentId ? (
        <input name="parentCommentId" type="hidden" value={parentCommentId} />
      ) : null}
      <textarea
        className="memory-board-comment-input min-h-20 w-full min-w-0 max-w-full resize-none rounded-xl border-2 px-3 py-2 text-sm font-medium outline-none transition"
        maxLength={500}
        name="body"
        placeholder={placeholder}
        required
      />
      <div className="grid min-w-0 gap-2 min-[380px]:grid-cols-[minmax(0,1fr)_auto] min-[380px]:items-center">
        <p className="memory-board-comment-status min-w-0 text-xs font-semibold [overflow-wrap:anywhere]" aria-live="polite">
          {state.error ?? (state.ok ? successText : "Be kind and keep it short.")}
        </p>
        <CommentSubmitButton label={submitLabel} pendingLabel="Posting" />
      </div>
    </form>
  );
}
