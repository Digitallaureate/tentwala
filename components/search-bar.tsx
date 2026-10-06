"use client";

import { FormEvent, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";

export function SearchBar({
  initialQuery = "",
  placeholder = "Search products, services, event types...",
  compact = false,
}: {
  initialQuery?: string;
  placeholder?: string;
  compact?: boolean;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [isPending, startTransition] = useTransition();
  const pathname = usePathname();
  const router = useRouter();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedQuery = query.trim();

    startTransition(() => {
      if (!normalizedQuery) {
        if (pathname === "/search") {
          router.push("/search");
          return;
        }

        router.push("/");
        return;
      }

      router.push(`/search?q=${encodeURIComponent(normalizedQuery)}`);
    });
  }

  return (
    <form
      className={`flex w-full items-center gap-2 rounded-full border border-[var(--color-muted)] bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] ${
        compact
          ? "h-[48px] border-black px-4"
          : "min-h-12 px-3 py-2 sm:min-h-14 sm:gap-3 sm:px-5"
      }`}
      onSubmit={handleSubmit}
    >
      {compact ? (
        <span
          aria-hidden="true"
          className="flex h-4 w-4 shrink-0 items-center justify-center text-black"
        >
          <svg
            className="h-3.5 w-3.5"
            fill="none"
            viewBox="0 0 16 16"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M7.25 12.25a5 5 0 1 1 0-10 5 5 0 0 1 0 10Zm3.54-1.46 2.96 2.96"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.4"
            />
          </svg>
        </span>
      ) : null}
      <input
        aria-label="Search products"
        className={`w-full min-w-0 bg-transparent text-black outline-none placeholder:text-[var(--color-muted)] ${
          compact ? "text-[13px]" : "text-sm sm:text-[0.95rem]"
        }`}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={placeholder}
        type="search"
        value={query}
      />
      <button
        className={`shrink-0 rounded-full border border-black bg-black font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:border-zinc-300 disabled:bg-zinc-300 ${
          compact
            ? "sr-only"
            : "px-4 py-2 text-[0.68rem] uppercase tracking-[0.16em] sm:px-5 sm:text-xs"
        }`}
        disabled={isPending}
        type="submit"
      >
        {isPending ? "Searching" : "Search"}
      </button>
    </form>
  );
}
