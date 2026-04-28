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
            <Link className="hover:text-white" href="/explore">
              Explore
            </Link>
            <Link className="hidden hover:text-white sm:inline" href="/dashboard">
              Dashboard
            </Link>
            <Link className="hidden hover:text-white sm:inline" href="/notifications">
              Notifications
            </Link>
            <Link className="hover:text-white" href="/profile">
              Profile
            </Link>
            <UserButton />
          </Show>
        </nav>
      </div>
    </header>
  );
}
