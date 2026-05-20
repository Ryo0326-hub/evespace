"use client";

import Link from "next/link";
import {
  Show,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";

export function AppNav() {
  return (
    <header className="sticky top-0 z-50 overflow-x-clip border-b border-white/10 bg-slate-950/78 px-4 py-3 backdrop-blur-xl sm:px-8">
      <div className="mx-auto flex min-w-0 max-w-7xl items-center justify-between gap-3 sm:gap-4">
        <Link
          className="min-w-0 truncate font-semibold tracking-[0.24em] text-cyan-100"
          href="/"
        >
          EVESPACE
        </Link>
        <nav className="flex shrink-0 items-center gap-2 text-sm text-slate-200 sm:gap-4">
          <Show when="signed-out">
            <SignInButton mode="modal">
              <button className="rounded-full border border-white/10 bg-white/10 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/15">
                Sign in
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="rounded-full bg-cyan-200 px-3 py-2 text-xs font-semibold text-slate-950 transition hover:bg-cyan-100">
                Sign up
              </button>
            </SignUpButton>
          </Show>
          <Show when="signed-in">
            <Link className="text-white hover:text-cyan-200 transition" href="/explore" title="Explore">
              <svg
                fill="none"
                height="20"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                width="20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </Link>
            <Link className="text-white hover:text-cyan-200 transition" href="/notifications" title="Notifications">
              <svg
                fill="none"
                height="20"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                width="20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </Link>
            <UserButton>
              <UserButton.MenuItems>
                <UserButton.Link
                  href="/profile"
                  label="Your Planet"
                  labelIcon={
                    <svg
                      fill="none"
                      height="16"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      width="16"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <circle cx="12" cy="12" r="7" />
                      <path d="M3 12c2.2-2.2 5.2-3.5 9-3.5s6.8 1.3 9 3.5" />
                      <path d="M4.5 16.5c2.1 1.2 4.6 1.8 7.5 1.8s5.4-.6 7.5-1.8" />
                    </svg>
                  }
                />
                <UserButton.Action label="manageAccount" />
                <UserButton.Action label="signOut" />
              </UserButton.MenuItems>
            </UserButton>
          </Show>
        </nav>
      </div>
    </header>
  );
}
