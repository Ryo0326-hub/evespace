import { notFound, redirect } from "next/navigation";
import { SignInButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { createOfficialEventMemoryPostAction } from "@/app/actions/memories";
import { MemoryPostForm } from "@/components/board/MemoryPostForm";
import { LinkButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ensureUserProfile } from "@/lib/auth/ensure-user-profile";
import { getBoardTheme } from "@/lib/board-themes";
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
  const { userId } = await auth();
  const profile = userId ? await ensureUserProfile() : null;
  const event = await getAccessibleBoardById(id, profile);

  if (!event || event.boardType !== "official_event") {
    notFound();
  }

  const background = getBoardTheme(event.boardBackgroundTheme);

  if (!profile) {
    return (
      <main className={`${background.pageClassName} memory-create-page flex min-h-screen items-center justify-center px-4`}>
        <Card className="max-w-lg text-center">
          <h1 className="text-2xl font-semibold text-[#2b1d17]">
            Sign in to post a memory.
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#725a4d]">
            You can view this official event, but posting a memory requires an
            Evespace account.
          </p>
          <span className="memory-scrapbook-sign-in">
            <SignInButton mode="modal">Sign in</SignInButton>
          </span>
        </Card>
      </main>
    );
  }

  if (!(await canPostToBoard(event, profile))) {
    redirect(`/official-events/${event.id}`);
  }

  const action = createOfficialEventMemoryPostAction.bind(null, event.id);

  return (
    <main className={`${background.pageClassName} memory-create-page min-h-screen overflow-x-hidden px-3 py-4 sm:px-6 sm:py-6 lg:px-8`}>
      <div className="mx-auto w-full max-w-5xl min-w-0">
        <nav>
          <LinkButton
            className="memory-create-back-button w-full sm:w-auto"
            href={`/official-events/${event.id}`}
            variant="ghost"
          >
            Back to Official Event
          </LinkButton>
        </nav>

        <header className="my-7 max-w-3xl sm:my-10">
          <h1 className="break-words text-3xl font-black tracking-normal text-[#2b1d17] sm:text-5xl">
            Post to {event.title}
          </h1>
        </header>

        <MemoryPostForm action={action} officialEvent />
      </div>
    </main>
  );
}
