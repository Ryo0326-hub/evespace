import { notFound, redirect } from "next/navigation";
import { updateOwnMemoryPostAction } from "@/app/actions/memories";
import { MemoryPostEditForm } from "@/components/board/MemoryPostEditForm";
import { LinkButton } from "@/components/ui/Button";
import { ensureUserProfile } from "@/lib/auth/ensure-user-profile";
import { getBoardTheme } from "@/lib/board-themes";
import { getBoardById } from "@/lib/data/boards";
import { mapMemoryPost } from "@/lib/data/mappers";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Board } from "@/types/evespace";

export default async function EditMemoryPostPage({
  params,
  searchParams,
}: {
  params: Promise<{ postId: string }>;
  searchParams?: Promise<{ returnPath?: string }>;
}) {
  const { postId } = await params;
  const profile = await ensureUserProfile();

  if (!profile) {
    redirect("/login");
  }

  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    throw new Error("Supabase service role is not configured.");
  }

  const { data, error } = await supabase
    .from("memory_posts")
    .select("*")
    .eq("id", postId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    notFound();
  }

  const post = mapMemoryPost(data);
  const boardId = post.boardId ?? post.eventId;
  const board = boardId ? await getBoardById(boardId) : null;

  if (!board) {
    notFound();
  }

  const returnPath = normalizeReturnPath(
    (await searchParams)?.returnPath,
    getDefaultReturnPath(board),
  );
  const isOwner =
    post.profileId === profile.id ||
    post.userId === profile.id ||
    post.clerkUserId === profile.clerkUserId;

  if (!isOwner) {
    redirect(returnPath);
  }

  const background = getBoardTheme(board.boardBackgroundTheme);
  const action = updateOwnMemoryPostAction.bind(null, post.id, returnPath);

  return (
    <main className={`${background.pageClassName} memory-create-page min-h-screen overflow-x-hidden px-3 py-4 text-black sm:px-6 sm:py-6 lg:px-8`}>
      <div className="evespace-form-shell">
        <LinkButton
          className="memory-create-back-button w-full sm:w-auto"
          href={returnPath}
          variant="ghost"
        >
          Back to Board
        </LinkButton>

        <header className="my-7 max-w-3xl sm:my-10">
          <h1 className="break-words text-3xl font-black tracking-normal text-[#2b1d17] sm:text-5xl">
            Edit memory
          </h1>
        </header>

        <MemoryPostEditForm action={action} post={post} />
      </div>
    </main>
  );
}

function getDefaultReturnPath(board: Board) {
  if (board.boardType === "official_event") {
    return `/official-events/${board.id}/board`;
  }

  return `/boards/${board.id}`;
}

function normalizeReturnPath(value: string | undefined, fallback: string) {
  const next = String(value ?? "").trim();

  if (next.startsWith("/") && !next.startsWith("//")) {
    return next;
  }

  return fallback;
}
