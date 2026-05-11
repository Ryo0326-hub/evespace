export function buildMemoryCommentThreads(comments) {
  const threadById = new Map();
  const threads = [];

  for (const comment of comments) {
    const thread = {
      comment,
      replies: [],
    };

    threadById.set(comment.id, thread);
  }

  for (const comment of comments) {
    const parentId = comment.parentCommentId;
    const parentThread = parentId ? threadById.get(parentId) : null;
    const thread = threadById.get(comment.id);

    if (!thread) {
      continue;
    }

    if (parentThread) {
      parentThread.replies.push(comment);
    } else {
      threads.push(thread);
    }
  }

  return threads;
}

export function countThreadComments(threads) {
  return threads.reduce((total, thread) => total + 1 + thread.replies.length, 0);
}

export function getCollapsedThreadPreview(threads) {
  return threads.at(-1) ?? null;
}
