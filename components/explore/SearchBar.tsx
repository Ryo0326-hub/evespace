"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";

export function SearchBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [query, setQuery] = useState(searchParams.get("q") ?? "");

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(name, value);
      } else {
        params.delete(name);
      }
      return params.toString();
    },
    [searchParams],
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      startTransition(() => {
        router.push(`${pathname}?${createQueryString("q", query)}`);
      });
    }, 300);

    return () => clearTimeout(timer);
  }, [query, router, pathname, createQueryString]);

  return (
    <div className="relative mb-6">
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
        <svg
          aria-hidden="true"
          className={`h-5 w-5 text-slate-400 ${isPending ? "animate-pulse" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <input
        className="block w-full rounded-full border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-white placeholder-slate-400 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 sm:text-sm"
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search for friends by name or email..."
        type="search"
        value={query}
      />
    </div>
  );
}
