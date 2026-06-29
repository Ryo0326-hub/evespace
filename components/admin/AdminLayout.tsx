import type { ReactNode } from "react";
import Link from "next/link";
import { LinkButton } from "@/components/ui/Button";

export function AdminLayout({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <main className="cosmic-bg evespace-page">
      <div className="evespace-content-shell grid gap-8 lg:grid-cols-[15rem_1fr]">
        <aside className="glass-panel h-fit rounded-[2rem] p-4">
          <Link className="block px-3 py-3 font-semibold tracking-[0.28em]" href="/">
            EVESPACE
          </Link>
          <nav className="mt-4 grid gap-2 text-sm">
            <LinkButton href="/dashboard" variant="ghost" className="justify-start">
              Dashboard
            </LinkButton>
            <LinkButton href="/dashboard/events" variant="ghost" className="justify-start">
              Events
            </LinkButton>
            <LinkButton
              href="/dashboard/events/new"
              variant="secondary"
              className="justify-start"
            >
              Create Event
            </LinkButton>
            <LinkButton href="/login" variant="ghost" className="justify-start">
              Login
            </LinkButton>
          </nav>
        </aside>

        <section>
          <header className="evespace-page-header mb-8">
            <p className="evespace-kicker">
              Admin
            </p>
            <h1 className="evespace-page-title">
              {title}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
              {description}
            </p>
          </header>
          {children}
        </section>
      </div>
    </main>
  );
}
