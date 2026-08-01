"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

type CategoryDetailData = {
  id: string;
  category_id?: string;
  name: string;
  slug: string;
  short_description: string;
  description: string;
  thumbnail_url?: string;
  banner_url?: string;
  image_urls?: string[];
  service_highlights?: string[];
  starting_price?: number;
  price_note?: string;
  faq?: Array<{
    question: string;
    answer: string;
  }>;
};

type CategoryProduct = {
  id: string;
  item_type: string;
  node_type?: string;
  layer?: number;
  name: string;
  slug: string;
  thumbnail_url?: string;
  banner_url?: string;
  pricing_model: string;
  short_description: string;
  price_tiers?: {
    medium?: {
      maximum_price?: number;
      minimum_price?: number;
    };
  };
  service_group?: string;
};

const categoriesRef = collection(db, "product_categories");
const categoryDetailsRef = collection(db, "category_details");
const productsRef = collection(db, "products");

export function CategoryDetail({ slug }: { slug: string }) {
  const [category, setCategory] = useState<CategoryDetailData | null>(null);
  const [products, setProducts] = useState<CategoryProduct[]>([]);
  const [isCategoryLoading, setIsCategoryLoading] = useState(true);
  const [isProductsLoading, setIsProductsLoading] = useState(true);
  const [error, setError] = useState("");
  const categoryId = category?.id;

  useEffect(() => {
    const categoryQuery = query(
      categoriesRef,
      where("slug", "==", slug),
      limit(1)
    );

    const unsubscribe = onSnapshot(
      categoryQuery,
      (snapshot) => {
        if (snapshot.empty) {
          setCategory(null);
          setIsCategoryLoading(false);
          setIsProductsLoading(false);
          setProducts([]);
          return;
        }

        const entry = snapshot.docs[0];
        const data = entry.data();

        setCategory({
          id: entry.id,
          name: String(data.name ?? ""),
          slug: String(data.slug ?? entry.id),
          short_description: String(data.short_description ?? ""),
          thumbnail_url: data.thumbnail_url ? String(data.thumbnail_url) : undefined,
          banner_url: data.banner_url ? String(data.banner_url) : undefined,
          description: "",
        });
        setIsCategoryLoading(false);
      },
      (snapshotError) => {
        console.error(snapshotError);
        setError("Could not load category details from Firestore.");
        setIsCategoryLoading(false);
        setIsProductsLoading(false);
      }
    );

    return unsubscribe;
  }, [slug]);

  useEffect(() => {
    if (!categoryId) {
      return;
    }

    const categoryDetailQuery = query(
      categoryDetailsRef,
      where("category_id", "==", categoryId),
      limit(1)
    );

    const unsubscribe = onSnapshot(
      categoryDetailQuery,
      (snapshot) => {
        if (snapshot.empty) {
          return;
        }

        const entry = snapshot.docs[0];
        const data = entry.data();

        setCategory((current) =>
          current
            ? {
                ...current,
                category_id: String(data.category_id ?? current.id),
                description: String(data.description ?? current.description),
                banner_url: String(data.banner_url ?? ""),
                image_urls: Array.isArray(data.image_urls)
                  ? data.image_urls.map((image) => String(image))
                  : [],
                service_highlights: Array.isArray(data.service_highlights)
                  ? data.service_highlights.map((item) => String(item))
                  : [],
                starting_price:
                  typeof data.starting_price === "number"
                    ? data.starting_price
                    : undefined,
                price_note: String(data.price_note ?? ""),
                faq: Array.isArray(data.faq)
                  ? data.faq.map((item) => ({
                      question: String(item?.question ?? ""),
                      answer: String(item?.answer ?? ""),
                    }))
                  : [],
              }
            : current
        );
      },
      (snapshotError) => {
        console.error(snapshotError);
        setError("Could not load category detail content from Firestore.");
      }
    );

    return unsubscribe;
  }, [categoryId]);

  useEffect(() => {
    if (!category) {
      return;
    }

    const productsQuery = query(
      productsRef,
      where("is_active", "==", true),
      where("category_ids", "array-contains", category.id),
      orderBy("sort_order", "asc")
    );

    const unsubscribe = onSnapshot(
      productsQuery,
      (snapshot) => {
        setProducts(
          snapshot.docs.map((entry) => {
            const data = entry.data();

            return {
              id: entry.id,
              item_type: String(data.item_type ?? ""),
              node_type: data.node_type ? String(data.node_type) : undefined,
              layer: typeof data.layer === "number" ? data.layer : undefined,
              name: String(data.name ?? ""),
              slug: String(data.slug ?? entry.id),
              thumbnail_url: data.thumbnail_url
                ? String(data.thumbnail_url)
                : undefined,
              banner_url: data.banner_url ? String(data.banner_url) : undefined,
              pricing_model: String(data.pricing_model ?? ""),
              short_description: String(data.short_description ?? ""),
              price_tiers: data.price_tiers as CategoryProduct["price_tiers"],
              service_group: data.service_group
                ? String(data.service_group)
                : undefined,
            };
          })
        );
        setError("");
        setIsProductsLoading(false);
      },
      (snapshotError) => {
        console.error(snapshotError);
        setError(
          "Could not load products for this category. Check Firestore rules and create the needed index if Firebase asks for one."
        );
        setIsProductsLoading(false);
      }
    );

    return unsubscribe;
  }, [category]);

  const eventTypeProducts = products.filter(
    (product) => product.node_type === "event_type" && product.layer === 3
  );

  if (error) {
    return (
      <div className="rounded-[2rem] border-2 border-red-200 bg-red-50 p-6 text-sm text-red-700">
        {error}
      </div>
    );
  }

  if (isCategoryLoading) {
    return (
      <div className="space-y-6">
        <section className="rounded-[2rem] border-2 border-zinc-300 bg-white p-6 sm:p-8">
          <div className="space-y-4">
            <div className="h-3 w-28 rounded-full bg-zinc-200" />
            <div className="h-10 w-2/3 rounded-2xl bg-zinc-900" />
            <div className="h-3 w-full rounded-full bg-zinc-200" />
            <div className="h-3 w-4/5 rounded-full bg-zinc-200" />
          </div>
        </section>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="rounded-[2rem] border-2 border-zinc-300 bg-white p-6 text-sm text-zinc-600">
        Category not found.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border-2 border-zinc-300 bg-white p-6 sm:p-8">
        <div className="flex flex-col gap-4">
          <Link
            className="text-sm font-medium text-zinc-500 transition hover:text-zinc-900"
            href="/"
          >
            Back to home
          </Link>
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">
              Category Detail
            </p>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {category.name}
            </h1>
            <p className="max-w-3xl text-base leading-7 text-zinc-600">
              {category.description || category.short_description}
            </p>
            {typeof category.starting_price === "number" ? (
              <p className="text-sm font-medium text-zinc-700">
                Starting from Rs. {category.starting_price}
              </p>
            ) : null}
            {category.price_note ? (
              <p className="max-w-3xl text-sm leading-6 text-zinc-500">
                {category.price_note}
              </p>
            ) : null}
          </div>

          {category.banner_url ? (
            <div className="overflow-hidden rounded-[1.75rem] border-2 border-zinc-300 bg-zinc-50">
              <img
                alt={category.name}
                className="h-72 w-full object-cover"
                src={category.banner_url}
              />
            </div>
          ) : null}

          {category.image_urls && category.image_urls.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-3">
              {category.image_urls.slice(0, 3).map((imageUrl, index) => (
                <div
                  key={`${imageUrl}-${index}`}
                  className="overflow-hidden rounded-[1.25rem] border-2 border-zinc-300 bg-zinc-50"
                >
                  <img
                    alt={`${category.name} gallery ${index + 1}`}
                    className="h-32 w-full object-cover"
                    src={imageUrl}
                  />
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      {category.service_highlights && category.service_highlights.length > 0 ? (
        <section className="rounded-[2rem] border-2 border-zinc-300 bg-white p-6 sm:p-8">
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">
              Service Highlights
            </p>
            <ul className="grid gap-3 md:grid-cols-2">
              {category.service_highlights.map((highlight) => (
                <li
                  key={highlight}
                  className="rounded-[1.25rem] border-2 border-zinc-300 bg-zinc-50 px-4 py-3 text-sm text-zinc-700"
                >
                  {highlight}
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      <section className="rounded-[2rem] border-2 border-zinc-300 bg-white p-6 sm:p-8">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">
              Event Types
            </p>
            <p className="text-lg font-semibold text-zinc-900">
              Event flows linked to {category.name}
            </p>
          </div>
        </div>

        {isProductsLoading ? (
          <div className="grid gap-4 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <article
                key={index}
                className="rounded-[1.75rem] border-2 border-zinc-300 bg-zinc-50 p-5"
              >
                <div className="space-y-4">
                  <div className="h-40 rounded-[1.25rem] border-2 border-dashed border-zinc-300 bg-white" />
                  <div className="space-y-2">
                    <div className="h-6 w-2/3 rounded-full bg-zinc-200" />
                    <div className="h-3 w-full rounded-full bg-zinc-200" />
                    <div className="h-3 w-2/3 rounded-full bg-zinc-200" />
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : eventTypeProducts.length > 0 ? (
          <div className="grid gap-4 lg:grid-cols-3">
            {eventTypeProducts.map((product) => {
              const mediumTier = product.price_tiers?.medium;
              const priceText =
                typeof mediumTier?.minimum_price === "number" &&
                typeof mediumTier?.maximum_price === "number"
                  ? `Rs. ${mediumTier.minimum_price} - Rs. ${mediumTier.maximum_price}`
                  : "Core bundles + optional add-ons";

              return (
                <Link
                  key={product.id}
                  className="block rounded-[1.75rem] border-2 border-zinc-300 bg-zinc-50 p-5 transition hover:border-zinc-500 hover:bg-white"
                  href={`/products/${product.slug}`}
                >
                  <div className="space-y-4">
                    {product.thumbnail_url || product.banner_url ? (
                      <div className="overflow-hidden rounded-[1.25rem] border-2 border-zinc-300 bg-white">
                        <img
                          alt={product.name}
                          className="h-40 w-full object-cover"
                          src={product.thumbnail_url ?? product.banner_url}
                        />
                      </div>
                    ) : (
                      <div className="flex h-40 items-center justify-center rounded-[1.25rem] border-2 border-dashed border-zinc-300 bg-white text-sm text-zinc-400">
                        Event type preview
                      </div>
                    )}
                    <div className="space-y-2">
                      <p className="text-lg font-semibold">{product.name}</p>
                      <p className="text-sm text-zinc-600">
                        {product.short_description}
                      </p>
                      <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.16em] text-zinc-400">
                        <span>
                          {product.node_type?.replaceAll("_", " ") ??
                            product.item_type.replaceAll("_", " ")}
                        </span>
                        {typeof product.layer === "number" ? (
                          <span>L{product.layer}</span>
                        ) : null}
                        {product.service_group ? (
                          <span>{product.service_group.replaceAll("-", " ")}</span>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm text-zinc-600">{priceText}</div>
                      <div className="flex h-10 w-28 items-center justify-center rounded-full border-2 border-zinc-900 bg-zinc-900 text-xs font-semibold uppercase tracking-[0.16em] text-white">
                        View
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="rounded-[1.5rem] border-2 border-zinc-300 bg-zinc-50 p-5 text-sm text-zinc-600">
            No event types are linked to this category yet.
          </div>
        )}
      </section>

      {category.faq && category.faq.length > 0 ? (
        <section className="rounded-[2rem] border-2 border-zinc-300 bg-white p-6 sm:p-8">
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">
              FAQ
            </p>
            <div className="space-y-3">
              {category.faq.map((item) => (
                <article
                  key={item.question}
                  className="rounded-[1.25rem] border-2 border-zinc-300 bg-zinc-50 p-4"
                >
                  <h3 className="text-sm font-semibold text-zinc-900">
                    {item.question}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-zinc-600">
                    {item.answer}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
