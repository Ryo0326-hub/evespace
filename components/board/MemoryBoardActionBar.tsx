"use client";

import { useClerk } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export type MemoryBoardActionIcon = "back" | "create" | "edit" | "sticker";

type BaseMemoryBoardAction = {
  ariaLabel: string;
  icon: MemoryBoardActionIcon;
  label: string;
};

export type MemoryBoardAction =
  | (BaseMemoryBoardAction & {
      href: string;
      type: "link";
    })
  | (BaseMemoryBoardAction & {
      type: "sign-in";
    })
  | (BaseMemoryBoardAction & {
      type: "sticker-store";
    });

const iconSrcById: Record<MemoryBoardActionIcon, string> = {
  back: "/memory-board-actions/back-v2.png",
  create: "/memory-board-actions/create-v2.png",
  edit: "/memory-board-actions/edit-v2.png",
  sticker: "/memory-board-actions/stickers-v2.png",
};

const actionShellClassName =
  "memory-board-action-shell fixed bottom-0 inset-x-0 z-[105] flex justify-center px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] pt-2 pointer-events-none";

const actionBarClassName =
  "memory-board-action-bar pointer-events-auto flex w-[min(100%,32rem)] max-w-full items-stretch justify-center gap-1 overflow-x-auto rounded-[1.35rem] border-2 border-black/15 bg-white/85 p-2 text-slate-950 shadow-none backdrop-blur-md";

const actionItemClassName =
  "memory-board-action-item flex min-h-[5.25rem] min-w-[4.75rem] flex-1 basis-[4.75rem] flex-col items-center justify-center gap-1 rounded-2xl border-0 bg-transparent px-1.5 py-1.5 text-center leading-none no-underline";

const iconFrameClassName =
  "memory-board-action-icon-frame flex h-14 w-14 shrink-0 items-center justify-center";

const iconClassName = "memory-board-action-icon h-14 w-14 rounded-full object-contain";

const labelClassName =
  "memory-board-action-label block w-full text-center text-[0.72rem] font-black leading-none tracking-normal";

export function MemoryBoardActionBar({
  actions,
  className,
}: {
  actions: MemoryBoardAction[];
  className?: string;
}) {
  if (actions.length === 0) {
    return null;
  }

  return (
    <nav
      aria-label="Memory board actions"
      className={cn(actionShellClassName, className)}
    >
      <div className={actionBarClassName}>
        {actions.map((action) => (
          <MemoryBoardActionItem
            action={action}
            key={`${action.type}-${action.icon}-${action.label}`}
          />
        ))}
      </div>
    </nav>
  );
}

function MemoryBoardActionItem({ action }: { action: MemoryBoardAction }) {
  const { openSignIn } = useClerk();
  const content = <MemoryBoardActionContent action={action} />;

  if (action.type === "link") {
    return (
      <Link
        aria-label={action.ariaLabel}
        className={actionItemClassName}
        href={action.href}
      >
        {content}
      </Link>
    );
  }

  if (action.type === "sign-in") {
    return (
      <button
        aria-label={action.ariaLabel}
        className={actionItemClassName}
        onClick={() => openSignIn()}
        type="button"
      >
        {content}
      </button>
    );
  }

  return (
    <button
      aria-label={action.ariaLabel}
      className={actionItemClassName}
      onClick={() => {
        window.dispatchEvent(new CustomEvent("evespace:toggle-sticker-store"));
      }}
      type="button"
    >
      {content}
    </button>
  );
}

function MemoryBoardActionContent({ action }: { action: MemoryBoardAction }) {
  return (
    <>
      <span className={iconFrameClassName} aria-hidden="true">
        <Image
          alt=""
          className={iconClassName}
          height={48}
          src={iconSrcById[action.icon]}
          width={48}
        />
      </span>
      <span className={labelClassName}>{action.label}</span>
    </>
  );
}
