"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Show,
  useClerk,
  useUser,
} from "@clerk/nextjs";

const navIconClassName =
  "h-9 w-9 object-contain transition duration-150 group-hover:scale-105 group-active:scale-95";

const menuIconClassName = "h-7 w-7 shrink-0 object-contain";

function NavIcon({
  src,
  className = navIconClassName,
  size = 36,
}: {
  src: string;
  className?: string;
  size?: number;
}) {
  return (
    <Image
      alt=""
      aria-hidden="true"
      className={className}
      height={size}
      src={src}
      width={size}
    />
  );
}

export function AppNav() {
  const { openSignIn, openSignUp } = useClerk();

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
            <button
              className="rounded-full border border-white/10 bg-white/10 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/15"
              onClick={() => openSignIn()}
              type="button"
            >
              Sign in
            </button>
            <button
              className="rounded-full bg-cyan-200 px-3 py-2 text-xs font-semibold text-slate-950 transition hover:bg-cyan-100"
              onClick={() => openSignUp()}
              type="button"
            >
              Sign up
            </button>
          </Show>
          <Show when="signed-in">
            <Link
              aria-label="Explore"
              className="group flex h-11 w-11 items-center justify-center rounded-full transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-200"
              href="/explore"
              title="Explore"
            >
              <NavIcon src="/navigation-icons/search.png" />
            </Link>
            <Link
              aria-label="Notifications"
              className="group flex h-11 w-11 items-center justify-center rounded-full transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-200"
              href="/notifications"
              title="Notifications"
            >
              <NavIcon src="/navigation-icons/notification.png" />
            </Link>
            <Link
              aria-label="Your Planet"
              className="group flex h-11 w-11 items-center justify-center rounded-full transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-200"
              href="/profile"
              title="Your Planet"
            >
              <NavIcon src="/navigation-icons/your-planet.png" />
            </Link>
            <ProfileMenu />
          </Show>
        </nav>
      </div>
    </header>
  );
}

function ProfileMenu() {
  const { openUserProfile, signOut } = useClerk();
  const { user } = useUser();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    function handlePointerDown(event: PointerEvent) {
      if (
        !(event.target instanceof Node) ||
        !menuRef.current?.contains(event.target)
      ) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Open profile menu"
        className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/10 p-1 transition hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-200"
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        {user?.imageUrl ? (
          <Image
            alt={user.fullName ? `${user.fullName} avatar` : "User avatar"}
            className="h-full w-full rounded-full object-cover"
            height={36}
            src={user.imageUrl}
            unoptimized
            width={36}
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center rounded-full bg-cyan-100 text-sm font-black text-slate-950">
            E
          </span>
        )}
      </button>

      {open ? (
        <div
          className="fixed right-3 top-[4.25rem] z-[120] grid w-[min(14rem,calc(100vw-1.5rem))] gap-1 rounded-2xl border border-slate-200/75 bg-white p-2 text-sm font-bold text-slate-800 shadow-xl shadow-slate-950/20 sm:right-8"
          role="menu"
        >
          <Link
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-500"
            href="/dashboard"
            onClick={() => setOpen(false)}
            role="menuitem"
          >
            <NavIcon
              className={menuIconClassName}
              size={28}
              src="/dashboard-icons/dashboard.png"
            />
            <span>Dashboard</span>
          </Link>
          <button
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-500"
            onClick={() => {
              setOpen(false);
              openUserProfile();
            }}
            role="menuitem"
            type="button"
          >
            <NavIcon
              className={menuIconClassName}
              size={28}
              src="/navigation-icons/manage.png"
            />
            <span>Manage account</span>
          </button>
          <button
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-500"
            onClick={() => {
              setOpen(false);
              void signOut();
            }}
            role="menuitem"
            type="button"
          >
            <NavIcon
              className={menuIconClassName}
              size={28}
              src="/navigation-icons/sign-out.png"
            />
            <span>Sign out</span>
          </button>
        </div>
      ) : null}
    </div>
  );
}
