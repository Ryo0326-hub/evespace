import { notFound, redirect } from "next/navigation";
import { createOfficialEventMemoryPostAction } from "@/app/actions/memories";
import { MemoryPostForm } from "@/components/board/MemoryPostForm";
import { LinkButton } from "@/components/ui/Button";
import { ensureUserProfile } from "@/lib/auth/ensure-user-profile";
import {
  canPostToBoard,
  getAccessibleBoardById,
} from "@/lib/data/boards";

export default async function CreateOfficialEventMemoryPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await ensureUserProfile();

  if (!profile) {
    redirect("/login");
  }

  const event = await getAccessibleBoardById(id, profile);

  if (!event || event.boardType !== "official_event") {
    notFound();
  }

  if (!(await canPostToBoard(event, profile))) {
    redirect(`/official-events/${event.id}`);
  }

  const action = createOfficialEventMemoryPostAction.bind(null, event.id);

  return (
    <main className="cosmic-bg min-h-screen overflow-x-hidden px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
      <div className="mx-auto w-full max-w-5xl min-w-0">
        <nav>
          <LinkButton
            className="w-full sm:w-auto"
            href={`/official-events/${event.id}`}
            variant="ghost"
          >
            Back to Official Event
          </LinkButton>
        </nav>

        <header className="my-7 max-w-3xl sm:my-10">
          <p className="text-sm font-medium uppercase tracking-[0.35em] text-cyan-100">
            Official Event Memory
          </p>
          <h1 className="mt-3 break-words text-3xl font-semibold tracking-tight text-white sm:text-5xl">
            Post to {event.title}
          </h1>
          <p className="mt-4 text-sm leading-7 text-slate-300 sm:text-base">
            Upload a photo, doodle on it, add a caption, and keep the sticker
            layer focused. Official event posts can include up to 3 stickers.
          </p>
        </header>

        <MemoryPostForm action={action} officialEvent />
      </div>
    </main>
  );
}
