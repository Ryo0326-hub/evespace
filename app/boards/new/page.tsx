import { redirect } from "next/navigation";
import { createPrivateBoardAction } from "@/app/actions/boards";
import { BoardForm } from "@/components/boards/BoardForm";
import { LinkButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ensureUserProfile } from "@/lib/auth/ensure-user-profile";

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

  return (
    <main className="cosmic-bg min-h-screen px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-4xl">
        <LinkButton href="/dashboard" variant="ghost">
          Back to Dashboard
        </LinkButton>
        <header className="my-8">
          <h1 className="text-4xl font-semibold text-white">
            create
          </h1>
        </header>
        {error ? (
          <Card className="mb-6 border-amber-200/30 bg-amber-300/10">
            <p className="text-sm font-semibold text-amber-100">Board was not saved.</p>
            <p className="mt-2 text-sm leading-6 text-amber-50/80">{error}</p>
          </Card>
        ) : null}
        <BoardForm action={createPrivateBoardAction} />
      </div>
    </main>
  );
}
