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
  thumbnail_url?: string;
  sort_order: number;
};

const categoriesRef = collection(db, "product_categories");

function getCategoryCopy(copy: string) {
  if (copy.length <= 120) {
    return copy;
  }

  return `${copy.slice(0, 117).trimEnd()}...`;
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
              thumbnail_url: data.thumbnail_url
                ? String(data.thumbnail_url)
                : undefined,
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
      <div className="mt-10 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="overflow-hidden rounded-[2rem] border border-[#d8e5e5] bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(244,250,250,0.94)_100%)] shadow-[0_20px_48px_rgba(62,84,96,0.12)]"
          >
            <div className="h-52 bg-zinc-100" />
            <div className="space-y-4 p-6">
              <div className="h-4 w-24 rounded-full bg-[#dceaea]" />
              <div className="h-8 w-2/3 rounded-full bg-zinc-200" />
              <div className="h-3 w-full rounded-full bg-zinc-200" />
              <div className="h-3 w-5/6 rounded-full bg-zinc-200" />
              <div className="h-11 w-36 rounded-full bg-[#dceaea]" />
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
    <div className="mt-10 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
      {categories.map((category, index) => (
        <Link
          key={category.id}
          className="group overflow-hidden rounded-[2rem] border border-[#d8e5e5] bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(244,250,250,0.94)_100%)] shadow-[0_20px_48px_rgba(62,84,96,0.12)] transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_28px_60px_rgba(62,84,96,0.18)]"
          href={`/categories/${category.slug}`}
        >
          <div className="relative h-56 overflow-hidden bg-[linear-gradient(135deg,#dff3f5_0%,#fffdf9_52%,#f5e8d8_100%)]">
            {category.thumbnail_url ? (
              <img
                alt={category.name}
                className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.05]"
                src={category.thumbnail_url}
              />
            ) : null}
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(17,24,39,0.02)_0%,rgba(17,24,39,0.08)_48%,rgba(17,24,39,0.38)_100%)]" />
            <div className="absolute left-5 top-5 rounded-full border border-white/55 bg-white/78 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#2c8088] backdrop-blur">
              {String(index + 1).padStart(2, "0")}
            </div>
            <div className="absolute inset-x-0 bottom-0 p-5">
              <p className="font-serif text-2xl uppercase leading-tight tracking-[0.05em] text-white drop-shadow-[0_4px_16px_rgba(0,0,0,0.28)]">
                {category.name}
              </p>
            </div>
          </div>

          <div className="space-y-5 p-6">
            <p className="text-sm leading-7 text-zinc-600">
              {getCategoryCopy(category.short_description)}
            </p>

            <div className="flex items-center justify-between gap-4">
              <span className="text-xs font-semibold uppercase tracking-[0.22em] text-[#56b7c4]">
                View category
              </span>
              <span className="inline-flex h-11 min-w-11 items-center justify-center rounded-full border border-[#1d2d44]/12 bg-white text-lg text-[#1d2d44] transition group-hover:border-[#56b7c4]/60 group-hover:text-[#56b7c4]">
                →
              </span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
