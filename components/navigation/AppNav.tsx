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
    <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/78 px-4 py-3 backdrop-blur-xl sm:px-8">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <Link
          className="font-semibold tracking-[0.24em] text-cyan-100"
          href="/"
        >
          EVESPACE
        </Link>
        <nav className="flex items-center gap-2 text-sm text-slate-200 sm:gap-4">
          <Link className="hidden hover:text-white sm:inline" href="/">
            Galaxy
          </Link>
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
            <Link className="hidden hover:text-white sm:inline" href="/dashboard">
              Dashboard
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
                  label="Profile"
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
                      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  }
                />
              </UserButton.MenuItems>
            </UserButton>
          </Show>
        </nav>
      </div>
    </header>
  );
}
