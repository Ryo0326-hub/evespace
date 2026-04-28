import { LinkButton } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";

export default function NotFound() {
  return (
    <main className="cosmic-bg flex min-h-screen items-center justify-center px-5">
      <div className="grid gap-6">
        <EmptyState
          title="This star could not be found."
          description="The event may be private, deleted, or outside this galaxy."
        />
        <div className="flex justify-center">
          <LinkButton href="/">Back to Galaxy</LinkButton>
        </div>
      </div>
    </main>
  );
}
