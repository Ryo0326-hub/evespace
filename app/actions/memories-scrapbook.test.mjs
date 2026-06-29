import { readFile } from "node:fs/promises";
import { describe, it } from "node:test";
import assert from "node:assert/strict";

describe("scrapbook memory post action", () => {
  it("allows either a message or a photo and persists scrapbook styles", async () => {
    const source = await readFile("app/actions/memories.ts", "utf8");

    assert.match(source, /const photoFile = photo instanceof File && photo\.size > 0 \? photo : null;/);
    assert.doesNotMatch(source, /Write a message before posting\./);
    assert.match(source, /Add a message or photo before posting\./);
    assert.doesNotMatch(source, /Choose a photo before posting\./);
    assert.match(source, /caption:\s*message/);
    assert.match(source, /sticky_note_style:\s*memoryPostStyle\.stickyNoteStyle/);
    assert.match(source, /message_pen_style:\s*memoryPostStyle\.memoryPenStyle/);
    assert.match(source, /if \(photoFile && uploadedMedia\) \{/);
  });

  it("updates owned memory messages without replacing photo or sticker data", async () => {
    const source = await readFile("app/actions/memories.ts", "utf8");
    const pageSource = await readFile("app/memories/[postId]/edit/page.tsx", "utf8");
    const editActionBlock =
      source.match(
        /export async function updateOwnMemoryPostAction[\s\S]*?(?=export async function deleteOwnMemoryPostAction)/,
      )?.[0] ?? "";

    assert.match(editActionBlock, /export async function updateOwnMemoryPostAction/);
    assert.match(editActionBlock, /You can only edit memories you posted\./);
    assert.match(editActionBlock, /caption:\s*message/);
    assert.match(editActionBlock, /sticky_note_style:\s*memoryPostStyle\.stickyNoteStyle/);
    assert.match(editActionBlock, /message_pen_style:\s*memoryPostStyle\.memoryPenStyle/);
    assert.doesNotMatch(
      editActionBlock,
      /image_url:/,
      "memory edits should not replace the existing photo from the lightweight edit page",
    );
    assert.match(pageSource, /updateOwnMemoryPostAction/);
    assert.match(pageSource, /MemoryPostEditForm/);
  });
});
