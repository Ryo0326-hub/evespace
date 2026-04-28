import type { ButtonHTMLAttributes, AnchorHTMLAttributes, ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

const variants: Record<ButtonVariant, string> = {
  primary:
    "border-cyan-200/40 bg-cyan-200 text-slate-950 shadow-lg shadow-cyan-950/30 hover:bg-cyan-100",
  secondary:
    "border-white/15 bg-white/10 text-white hover:border-white/25 hover:bg-white/15",
  ghost:
    "border-transparent bg-transparent text-slate-200 hover:bg-white/10",
  danger:
    "border-rose-300/40 bg-rose-400/15 text-rose-100 hover:bg-rose-400/25",
};

const baseClass =
  "inline-flex min-h-11 items-center justify-center rounded-full border px-5 py-2.5 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-cyan-200/70 disabled:cursor-not-allowed disabled:opacity-60";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

export function Button({
  className,
  variant = "primary",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(baseClass, variants[variant], className)}
      type={type}
      {...props}
    />
  );
}

type LinkButtonProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  children: ReactNode;
  variant?: ButtonVariant;
};

export function LinkButton({
  className,
  variant = "primary",
  href,
  children,
  ...props
}: LinkButtonProps) {
  return (
    <Link
      className={cn(baseClass, variants[variant], className)}
      href={href}
      {...props}
    >
      {children}
    </Link>
  );
}
