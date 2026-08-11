"use client";

import { FormEvent, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";

export function SearchBar({
  initialQuery = "",
  placeholder = "Search products, services, event types...",
}: {
  initialQuery?: string;
  placeholder?: string;
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
      className="flex min-h-12 w-full items-center gap-2 rounded-full border border-[#d7d4cf] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(247,243,237,0.92))] px-3 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] sm:min-h-14 sm:gap-3 sm:px-5"
      onSubmit={handleSubmit}
    >
      <input
        aria-label="Search products"
        className="w-full min-w-0 bg-transparent text-sm text-zinc-900 outline-none placeholder:text-zinc-400 sm:text-[0.95rem]"
        onChange={(event) => setQuery(event.target.value)}
        placeholder={placeholder}
        type="search"
        value={query}
      />
      <button
        className="shrink-0 rounded-full border border-zinc-900 bg-zinc-900 px-4 py-2 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:border-zinc-300 disabled:bg-zinc-300 sm:px-5 sm:text-xs"
        disabled={isPending}
        type="submit"
      >
        {isPending ? "Searching" : "Search"}
      </button>
    </form>
  );
}
