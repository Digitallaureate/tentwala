"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

type HomeCategoryPreviewItem = {
  id: string;
  name: string;
  slug: string;
  short_description: string;
  sort_order: number;
};

const categoriesRef = collection(db, "product_categories");

function getCategoryIcon(name: string) {
  return name
    .split(" ")
    .map((part) => part[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function getCategoryCopy(copy: string) {
  if (copy.length <= 110) {
    return copy;
  }

  return `${copy.slice(0, 107).trimEnd()}...`;
}

export function HomeCategoryPreview() {
  const [categories, setCategories] = useState<HomeCategoryPreviewItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const categoriesQuery = query(
      categoriesRef,
      where("is_active", "==", true),
      orderBy("sort_order", "asc")
    );

    const unsubscribe = onSnapshot(
      categoriesQuery,
      (snapshot) => {
        setCategories(
          snapshot.docs.map((entry) => {
            const data = entry.data();

            return {
              id: entry.id,
              name: String(data.name ?? ""),
              slug: String(data.slug ?? entry.id),
              short_description: String(data.short_description ?? ""),
              sort_order: Number(data.sort_order ?? 0),
            };
          })
        );
        setError("");
        setIsLoading(false);
      },
      (snapshotError) => {
        console.error(snapshotError);
        setError(
          "Could not load categories from Firestore. Check rules and create the index if Firebase asks for one."
        );
        setIsLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  if (isLoading) {
    return (
      <div className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="rounded-[2rem] border border-[#dbe7e7] bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(248,252,252,0.96)_100%)] px-6 py-8 text-center shadow-[0_18px_38px_rgba(77,103,114,0.12)]"
          >
            <div className="mx-auto h-24 w-24 rounded-full border border-[#8ebdc2]/35 bg-[linear-gradient(135deg,#eff9fa_0%,#fff8f3_100%)]" />
            <div className="mx-auto mt-6 h-7 w-40 rounded-full bg-zinc-200" />
            <div className="mt-4 space-y-2">
              <div className="h-3 rounded-full bg-zinc-200" />
              <div className="h-3 rounded-full bg-zinc-200" />
              <div className="mx-auto h-3 w-3/4 rounded-full bg-zinc-200" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-10 rounded-[1.5rem] border border-red-200 bg-red-50 p-5 text-sm text-red-700">
        {error}
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="mt-10 rounded-[1.5rem] border border-[#dbe7e7] bg-white/90 p-5 text-sm text-zinc-600">
        No active categories found in Firestore. Upload category data first.
      </div>
    );
  }

  return (
    <div className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-5">
      {categories.map((category) => (
        <Link
          key={category.id}
          className="rounded-[2rem] border border-[#dbe7e7] bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(248,252,252,0.96)_100%)] px-6 py-8 text-center shadow-[0_18px_38px_rgba(77,103,114,0.12)] transition hover:-translate-y-1 hover:shadow-[0_22px_45px_rgba(77,103,114,0.18)]"
          href={`/categories/${category.slug}`}
        >
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border border-[#8ebdc2]/35 bg-[linear-gradient(135deg,#eff9fa_0%,#fff8f3_100%)] text-2xl font-semibold tracking-[0.14em] text-[#2c8088]">
            {getCategoryIcon(category.name)}
          </div>
          <p className="mt-6 font-serif text-2xl uppercase tracking-[0.04em] text-[#2d3748]">
            {category.name}
          </p>
          <p className="mt-4 text-sm leading-8 text-zinc-600">
            {getCategoryCopy(category.short_description)}
          </p>
        </Link>
      ))}
    </div>
  );
}
