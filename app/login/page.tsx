import { SignIn } from "@clerk/nextjs";
import { LinkButton } from "@/components/ui/Button";

export default function LoginPage() {
  return (
    <main className="cosmic-bg flex min-h-screen items-center justify-center px-5 py-10">
      <div className="w-full">
        <div className="mx-auto mb-8 max-w-md">
          <LinkButton href="/" variant="ghost">
            Back to Galaxy
          </LinkButton>
          <h1 className="mt-8 text-4xl font-semibold tracking-tight text-white">
            Enter Evespace
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            Log in to create event stars, post memories, and moderate shared
            boards.
          </p>
        </div>
        <div className="flex justify-center">
          <SignIn routing="hash" />
        </div>
      </div>
    </main>
  );
}
