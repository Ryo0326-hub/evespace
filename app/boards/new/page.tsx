import { redirect } from "next/navigation";
import { createPrivateBoardAction } from "@/app/actions/boards";
import { BoardForm } from "@/components/boards/BoardForm";
import { LinkButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ensureUserProfile } from "@/lib/auth/ensure-user-profile";
import { DEFAULT_BOARD_THEME, getBoardTheme } from "@/lib/board-themes";

export default async function NewBoardPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const profile = await ensureUserProfile();
  const error = (await searchParams)?.error;

  if (!profile) {
    redirect("/login");
  }

  const defaultTheme = getBoardTheme(DEFAULT_BOARD_THEME);

  return (
    <main
      className={`${defaultTheme.pageClassName} min-h-screen overflow-x-clip px-4 py-8 text-black sm:px-8`}
      data-board-theme-page
    >
      <div className="mx-auto min-w-0 max-w-4xl">
        <LinkButton
          className="memory-board-soft-button w-full sm:w-auto"
          href="/dashboard"
          variant="ghost"
        >
          Back to Dashboard
        </LinkButton>
        <header className="memory-board-title-card my-8 rounded-[2rem] p-5 sm:p-8">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-600">
            New memory board
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-normal text-black sm:text-6xl">
            <span className="memory-board-title-mark">Create</span>
          </h1>
          <p className="mt-5 max-w-2xl text-sm font-semibold leading-7 text-slate-700">
            Pick a board style, add the details, and make a tiny place for the
            memories to land.
          </p>
        </header>
        {error ? (
          <Card className="mb-6 rounded-[1.5rem] border-[3px] border-black bg-[#fff4a8]/95 text-black shadow-[5px_5px_0_rgba(5,5,5,0.16)] backdrop-blur-0">
            <p className="text-sm font-black">Board was not saved.</p>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-800">
              {error}
            </p>
          </Card>
        ) : null}
        <BoardForm action={createPrivateBoardAction} />
      </div>
    </main>
  );
}
