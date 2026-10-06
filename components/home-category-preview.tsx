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
  thumbnail_url?: string;
  sort_order: number;
};

type HomeCategoryEvent = {
  id: string;
  name: string;
  slug: string;
  category_ids: string[];
  sort_order: number;
};

const MAX_EVENT_PILLS = 8;

const categoriesRef = collection(db, "product_categories");
const productsRef = collection(db, "products");

export function HomeCategoryPreview() {
  const [categories, setCategories] = useState<HomeCategoryPreviewItem[]>([]);
  const [events, setEvents] = useState<HomeCategoryEvent[]>([]);
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

  useEffect(() => {
    // Equality-only filters, so no composite index is needed; sorted client-side.
    const eventsQuery = query(
      productsRef,
      where("is_active", "==", true),
      where("node_type", "==", "event_type")
    );

    const unsubscribe = onSnapshot(
      eventsQuery,
      (snapshot) => {
        setEvents(
          snapshot.docs
            .map((entry) => {
              const data = entry.data();

              return {
                id: entry.id,
                name: String(data.name ?? ""),
                slug: String(data.slug ?? entry.id),
                category_ids: Array.isArray(data.category_ids)
                  ? data.category_ids.map((item) => String(item))
                  : [],
                sort_order: Number(data.sort_order ?? 0),
              };
            })
            .sort((a, b) => a.sort_order - b.sort_order)
        );
      },
      (snapshotError) => {
        // The flip back face is an extra; the cards still work without it.
        console.error(snapshotError);
      }
    );

    return unsubscribe;
  }, []);

  if (isLoading) {
    return (
      <div className="mx-auto mt-14 grid w-full grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-8">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="aspect-square animate-pulse rounded-[20px] bg-[#efe9dd]"
          />
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
    <div className="mx-auto mt-14 grid w-full grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-8">
      {categories.slice(0, 4).map((category) => {
        const categoryEvents = events
          .filter((event) => event.category_ids.includes(category.id))
          .slice(0, MAX_EVENT_PILLS);

        return (
          <div
            key={category.id}
            className="group aspect-square [container-type:inline-size] [perspective:1000px]"
          >
            <div className="relative h-full w-full transition-transform duration-700 [transform-style:preserve-3d] lg:group-focus-within:[transform:rotateY(180deg)] lg:group-hover:[transform:rotateY(180deg)] motion-reduce:transition-none">
              {/* Front face */}
              <Link
                className="absolute inset-0 overflow-hidden rounded-[20px] bg-[#efe9dd] shadow-[0_6px_18px_rgba(0,0,0,0.08)] [backface-visibility:hidden]"
                href={`/categories/${category.slug}`}
              >
                {category.thumbnail_url ? (
                  <img
                    alt={category.name}
                    className="h-full w-full object-cover"
                    src={category.thumbnail_url}
                  />
                ) : null}
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0)_28%,rgba(0,0,0,0.58)_100%)]" />
                {/* Sizes below are Figma values (394px card) scaled by card width: 34px = 8.63cqw */}
                <div className="absolute inset-x-0 bottom-0 flex justify-center px-3 pb-[max(12px,5.5cqw)]">
                  <p className="w-fit max-w-full text-left text-[clamp(13px,8.63cqw,34px)] font-medium leading-[1.18] text-white drop-shadow-[0_3px_12px_rgba(0,0,0,0.4)]">
                    {category.name}
                  </p>
                </div>
              </Link>

              {/* Back face: events for this category */}
              <div className="absolute inset-0 flex flex-col justify-between overflow-hidden rounded-[20px] bg-[var(--color-gold)] p-[7cqw] shadow-[0_6px_18px_rgba(0,0,0,0.08)] [backface-visibility:hidden] [transform:rotateY(180deg)] max-lg:hidden">
                <div className="flex flex-wrap content-start gap-x-[4cqw] gap-y-[3.5cqw] overflow-hidden">
                  {categoryEvents.map((event) => (
                    <Link
                      key={event.id}
                      className="rounded-full border border-white px-[3.55cqw] py-[2cqw] text-[clamp(10px,5.58cqw,22px)] leading-[1.36] text-white transition hover:bg-white/20"
                      href={`/products/${event.slug}`}
                    >
                      {event.name}
                    </Link>
                  ))}
                </div>
                
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
