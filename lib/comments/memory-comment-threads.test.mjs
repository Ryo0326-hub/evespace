import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildMemoryCommentThreads,
  countThreadComments,
  getCollapsedThreadPreview,
} from "./memory-comment-threads.mjs";

const baseComment = {
  postId: "post-1",
  boardId: "board-1",
  profileId: "profile-1",
  clerkUserId: "user-1",
  authorDisplayName: "Friend",
  body: "Hello",
  createdAt: "2026-05-10T10:00:00.000Z",
  updatedAt: "2026-05-10T10:00:00.000Z",
};

describe("memory comment threads", () => {
  it("nests replies under their parent comment", () => {
    const threads = buildMemoryCommentThreads([
      { ...baseComment, id: "comment-1", parentCommentId: null },
      {
        ...baseComment,
        id: "reply-1",
        parentCommentId: "comment-1",
        body: "Reply",
      },
    ]);

    assert.equal(threads.length, 1);
    assert.equal(threads[0].comment.id, "comment-1");
    assert.deepEqual(
      threads[0].replies.map((reply) => reply.id),
      ["reply-1"],
    );
  });

  it("keeps orphaned replies visible as top-level comments", () => {
    const threads = buildMemoryCommentThreads([
      { ...baseComment, id: "reply-1", parentCommentId: "missing-comment" },
    ]);

    assert.equal(threads.length, 1);
    assert.equal(threads[0].comment.id, "reply-1");
    assert.deepEqual(threads[0].replies, []);
  });

  it("counts comments and replies together", () => {
    const threads = buildMemoryCommentThreads([
      { ...baseComment, id: "comment-1", parentCommentId: null },
      { ...baseComment, id: "comment-2", parentCommentId: null },
      { ...baseComment, id: "reply-1", parentCommentId: "comment-1" },
    ]);

    assert.equal(countThreadComments(threads), 3);
  });

  it("previews the newest visible thread when collapsed", () => {
    const threads = buildMemoryCommentThreads([
      {
        ...baseComment,
        id: "comment-1",
        parentCommentId: null,
        createdAt: "2026-05-10T10:00:00.000Z",
      },
      {
        ...baseComment,
        id: "comment-2",
        parentCommentId: null,
        createdAt: "2026-05-10T10:10:00.000Z",
      },
    ]);

    assert.equal(getCollapsedThreadPreview(threads)?.comment.id, "comment-2");
  });
});
