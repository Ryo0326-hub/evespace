import { notFound } from "next/navigation";
import { SignInButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { createMemoryPostAction } from "@/app/actions/memories";
import { MemoryPostForm } from "@/components/board/MemoryPostForm";
import { LinkButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ensureUserProfile } from "@/lib/auth/ensure-user-profile";
import { getEventBySlug } from "@/lib/data/events";

export default async function CreateMemoryPostPage({
  params,
}: {
  params: Promise<{ eventSlug: string }>;
}) {
  const { eventSlug } = await params;
  const event = await getEventBySlug(eventSlug);

  if (!event) {
    notFound();
  }

  const { userId } = await auth();

  if (!userId) {
    return (
      <main className="cosmic-bg flex min-h-screen items-center justify-center px-4">
        <Card className="max-w-lg text-center">
          <h1 className="text-2xl font-semibold text-white">
            Sign in to post a memory.
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            Public visitors can browse memories, but posting photos requires an
            Evespace account.
          </p>
          <SignInButton mode="modal">
            <button className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full bg-cyan-200 px-5 py-2.5 text-sm font-semibold text-slate-950">
              Sign in
            </button>
          </SignInButton>
        </Card>
      </main>
    );
  }

  await ensureUserProfile();
  const action = createMemoryPostAction.bind(null, event.slug);

  return (
    <main className="cosmic-bg min-h-screen overflow-x-hidden px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
      <div className="mx-auto w-full max-w-5xl min-w-0">
        <nav>
          <LinkButton className="w-full sm:w-auto" href={`/events/${event.slug}`} variant="ghost">
            Back to Event
          </LinkButton>
        </nav>

        <header className="my-7 max-w-3xl sm:my-10">
          <p className="text-sm font-medium uppercase tracking-[0.35em] text-cyan-100">
            Leave a Memory
          </p>
          <h1 className="mt-3 break-words text-3xl font-semibold tracking-tight text-white sm:text-5xl">
            Post to {event.title}
          </h1>
          <p className="mt-4 text-sm leading-7 text-slate-300 sm:text-base">
            Upload a photo, add a plain caption, choose optional stickers, and
            preview your memory card before it joins the board.
          </p>
        </header>

        <MemoryPostForm action={action} board={event} />
      </div>
    </main>
  );
}
