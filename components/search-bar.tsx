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
      className="flex h-14 w-full items-center gap-3 rounded-full border-2 border-zinc-300 bg-zinc-50 px-5 lg:max-w-xl"
      onSubmit={handleSubmit}
    >
      <input
        aria-label="Search products"
        className="w-full bg-transparent text-sm text-zinc-900 outline-none placeholder:text-zinc-400"
        onChange={(event) => setQuery(event.target.value)}
        placeholder={placeholder}
        type="search"
        value={query}
      />
      <button
        className="rounded-full border border-zinc-900 bg-zinc-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:border-zinc-300 disabled:bg-zinc-300"
        disabled={isPending}
        type="submit"
      >
        {isPending ? "Searching" : "Search"}
      </button>
    </form>
  );
}
