import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium text-slate-200">
      <span>{label}</span>
      {children}
      {hint ? <span className="text-xs text-slate-400">{hint}</span> : null}
    </label>
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "min-h-11 rounded-2xl border border-white/10 bg-white/[0.07] px-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-200/60 focus:ring-2 focus:ring-cyan-200/20",
        className,
      )}
      {...props}
    />
  );
}

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-28 rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-200/60 focus:ring-2 focus:ring-cyan-200/20",
        className,
      )}
      {...props}
    />
  );
}

export function Select({
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "min-h-11 rounded-2xl border border-white/10 bg-slate-900 px-4 text-sm text-white outline-none transition focus:border-cyan-200/60 focus:ring-2 focus:ring-cyan-200/20",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}
