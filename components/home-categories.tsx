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

type HomeCategory = {
  id: string;
  name: string;
  slug: string;
  short_description: string;
  thumbnail_url?: string;
  banner_url?: string;
  sort_order: number;
  is_active: boolean;
};

type CategoryDetailContent = {
  category_id: string;
  description: string;
  banner_url?: string;
  image_urls: string[];
};

const categoriesRef = collection(db, "product_categories");
const categoryDetailsRef = collection(db, "category_details");

function getCategoryDescription(
  detailDescription: string | undefined,
  fallbackDescription: string
) {
  const source = detailDescription?.trim() || fallbackDescription.trim();

  if (source.length <= 240) {
    return source;
  }

  return `${source.slice(0, 237).trimEnd()}...`;
}

function getCategoryGalleryWithFallback(
  category: HomeCategory,
  detail?: CategoryDetailContent
) {
  return Array.from(
    new Set(
      [
        detail?.banner_url,
        ...(detail?.image_urls ?? []),
        category.banner_url,
        category.thumbnail_url,
      ].filter((image): image is string => Boolean(image))
    )
  );
}

export function HomeCategories() {
  const [categories, setCategories] = useState<HomeCategory[]>([]);
  const [categoryDetails, setCategoryDetails] = useState<
    Record<string, CategoryDetailContent>
  >({});
  const [activeImages, setActiveImages] = useState<Record<string, number>>({});
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
              banner_url: data.banner_url ? String(data.banner_url) : undefined,
              sort_order: Number(data.sort_order ?? 0),
              is_active: Boolean(data.is_active ?? false),
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
    const unsubscribe = onSnapshot(
      categoryDetailsRef,
      (snapshot) => {
        const nextDetails = snapshot.docs.reduce<
          Record<string, CategoryDetailContent>
        >((accumulator, entry) => {
          const data = entry.data();
          const categoryId = String(data.category_id ?? "");

          if (!categoryId) {
            return accumulator;
          }

          accumulator[categoryId] = {
            category_id: categoryId,
            description: String(data.description ?? ""),
            banner_url: data.banner_url ? String(data.banner_url) : undefined,
            image_urls: Array.isArray(data.image_urls)
              ? data.image_urls.map((image) => String(image))
              : [],
          };

          return accumulator;
        }, {});

        setCategoryDetails(nextDetails);
      },
      (snapshotError) => {
        console.error(snapshotError);
      }
    );

    return unsubscribe;
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-8">
        {Array.from({ length: 4 }).map((_, index) => (
          <article
            key={index}
            className="overflow-hidden rounded-[20px] bg-white p-6 shadow-[0_6px_24px_rgba(0,0,0,0.08)] sm:p-8 lg:p-10"
          >
            <div className="grid gap-8 xl:grid-cols-[0.9fr_1.1fr] xl:items-center">
              <div className="space-y-6">
                <div className="h-5 w-48 rounded-full bg-[#efe9dd]" />
                <div className="space-y-3">
                  <div className="h-8 w-2/3 rounded-full bg-[#efe9dd]" />
                  <div className="h-4 w-full rounded-full bg-[#efe9dd]" />
                  <div className="h-4 w-11/12 rounded-full bg-[#efe9dd]" />
                  <div className="h-4 w-4/5 rounded-full bg-[#efe9dd]" />
                </div>
                <div className="h-12 w-56 rounded-full bg-[var(--color-gold)]/60" />
              </div>
              <div className="space-y-5">
                <div className="aspect-[4/3] rounded-[2rem] bg-[#efe9dd]" />
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {Array.from({ length: 4 }).map((__, thumbIndex) => (
                    <div
                      key={thumbIndex}
                      className="aspect-[4/3] rounded-[15px] bg-[#efe9dd]"
                    />
                  ))}
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-[1.5rem] border-2 border-red-200 bg-red-50 p-5 text-sm text-red-700">
        {error}
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="rounded-[1.5rem] border-2 border-zinc-300 bg-zinc-50 p-5 text-sm text-zinc-600">
        No active categories found in Firestore. Upload category data first.
      </div>
    );
  }

  const handleImageChange = (categoryId: string, imageIndex: number) => {
    setActiveImages((current) => ({
      ...current,
      [categoryId]: imageIndex,
    }));
  };

  return (
    <div className="space-y-8">
      {categories.map((category, index) => {
        const detail = categoryDetails[category.id];
        const gallery = getCategoryGalleryWithFallback(category, detail);
        const activeImageIndex = Math.min(
          activeImages[category.id] ?? 0,
          Math.max(gallery.length - 1, 0)
        );
        const activeImage = gallery[activeImageIndex];
        const description = getCategoryDescription(
          detail?.description,
          category.short_description
        );
        const panelNumber = String(index + 1).padStart(2, "0");
        const isEvenPanel = index % 2 === 1;

        return (
          <article
            key={category.id}
            className="overflow-hidden rounded-[20px] bg-white p-6 shadow-[0_6px_24px_rgba(0,0,0,0.08)] sm:p-8 lg:p-10"
          >
            <div className="grid gap-8 xl:grid-cols-[0.92fr_1.08fr] xl:items-center">
              <div
                className={`space-y-6 ${
                  isEvenPanel ? "xl:order-2" : ""
                }`}
              >
                <div className="flex items-center gap-4 text-black">
                  <span className="font-serif text-3xl tracking-[0.2em] text-[var(--color-gold)] sm:text-4xl">
                    {panelNumber}
                  </span>
                  <h3 className="font-serif text-3xl uppercase tracking-[0.08em] sm:text-4xl lg:text-5xl">
                    {category.name}
                  </h3>
                </div>

                <p className="max-w-2xl text-base leading-8 text-[#717171] sm:text-lg">
                  {description}
                </p>

                <div className="flex flex-wrap gap-3">
                  <Link
                    className="inline-flex min-h-12 items-center justify-center rounded-[15px] bg-[var(--color-primary)] px-7 text-sm font-medium text-white transition hover:bg-[#9f4e2f]"
                    href={`/categories/${category.slug}`}
                  >
                    Explore {category.name}
                  </Link>
                  <Link
                    className="inline-flex min-h-12 items-center justify-center rounded-[15px] border border-black bg-white px-7 text-sm font-medium text-black transition hover:bg-black/5"
                    href={`/contact?category=${encodeURIComponent(category.id)}`}
                  >
                    Request Quote
                  </Link>
                </div>

                {gallery.length > 1 ? (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {gallery.slice(0, 4).map((imageUrl, imageIndex) => {
                      const isActive = imageIndex === activeImageIndex;

                      return (
                        <button
                          key={`${category.id}-${imageUrl}-${imageIndex}`}
                          type="button"
                          className={`group relative aspect-[4/3] overflow-hidden rounded-[15px] border bg-white shadow-[0_6px_18px_rgba(0,0,0,0.08)] transition ${
                            isActive
                              ? "border-[var(--color-gold)] ring-2 ring-[var(--color-gold)]/30"
                              : "border-transparent hover:border-[var(--color-gold)]"
                          }`}
                          onClick={() =>
                            handleImageChange(category.id, imageIndex)
                          }
                        >
                          <img
                            alt={`${category.name} preview ${imageIndex + 1}`}
                            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                            loading="lazy"
                            src={imageUrl}
                          />
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </div>

              <div className={isEvenPanel ? "xl:order-1" : ""}>
                {activeImage ? (
                  <div className="relative overflow-hidden rounded-[20px] bg-[#efe9dd] shadow-[0_6px_24px_rgba(0,0,0,0.08)]">
                    <img
                      alt={category.name}
                      className="aspect-[4/3] w-full object-cover"
                      loading="lazy"
                      src={activeImage}
                    />
                  </div>
                ) : (
                  <div className="flex aspect-[4/3] items-end rounded-[20px] bg-[linear-gradient(135deg,#efe9dd_0%,#faf7f2_52%,#e9dcc0_100%)] p-8 shadow-[0_6px_24px_rgba(0,0,0,0.08)]">
                    <div className="space-y-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#717171]">
                        Category Preview
                      </p>
                      <p className="max-w-md font-serif text-2xl text-black sm:text-3xl">
                        {category.name}
                      </p>
                      <p className="max-w-lg text-sm leading-7 text-zinc-600 sm:text-base">
                        Add `banner_url` or `image_urls` in Firestore to show
                        the live category showcase here.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
