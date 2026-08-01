"use client";

import Link from "next/link";
import { useDeferredValue, useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

type SearchableProduct = {
  id: string;
  item_type: string;
  node_type?: string;
  layer?: number;
  customer_selectable?: boolean;
  name: string;
  slug: string;
  thumbnail_url?: string;
  pricing_model: string;
  search_tags: string[];
  search_text: string;
  short_description: string;
  price_tiers?: {
    low?: {
      minimum_price?: number;
      maximum_price?: number;
    };
  };
  service_group?: string;
};

const productsRef = collection(db, "products");

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function matchesProduct(product: SearchableProduct, normalizedQuery: string) {
  if (!normalizedQuery) {
    return false;
  }

  const queryTokens = normalizedQuery.split(/\s+/).filter(Boolean);
  const searchableText = [
    product.name.toLowerCase(),
    product.short_description.toLowerCase(),
    product.search_text.toLowerCase(),
    product.item_type.toLowerCase(),
    product.service_group?.toLowerCase() ?? "",
    ...product.search_tags.map((tag) => tag.toLowerCase()),
  ].join(" ");

  return queryTokens.every((token) => searchableText.includes(token));
}

export function ProductSearchResults({ queryText }: { queryText: string }) {
  const [products, setProducts] = useState<SearchableProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const deferredQuery = useDeferredValue(normalize(queryText));

  useEffect(() => {
    const productsQuery = query(
      productsRef,
      where("is_active", "==", true),
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
              customer_selectable:
                typeof data.customer_selectable === "boolean"
                  ? data.customer_selectable
                  : true,
              name: String(data.name ?? ""),
              slug: String(data.slug ?? entry.id),
              thumbnail_url: data.thumbnail_url
                ? String(data.thumbnail_url)
                : undefined,
              pricing_model: String(data.pricing_model ?? ""),
              search_tags: Array.isArray(data.search_tags)
                ? data.search_tags.map((tag) => String(tag))
                : [],
              search_text: String(data.search_text ?? ""),
              short_description: String(data.short_description ?? ""),
              price_tiers: data.price_tiers as SearchableProduct["price_tiers"],
              service_group: data.service_group
                ? String(data.service_group)
                : undefined,
            };
          })
        );
        setError("");
        setIsLoading(false);
      },
      (snapshotError) => {
        console.error(snapshotError);
        setError(
          "Could not load products for search. Check Firestore rules and create the needed index if Firebase asks for one."
        );
        setIsLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  const filteredProducts = deferredQuery
    ? products.filter(
        (product) =>
          product.customer_selectable !== false &&
          matchesProduct(product, deferredQuery)
      )
    : [];

  if (isLoading) {
    return (
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
    );
  }

  if (error) {
    return (
      <div className="rounded-[1.5rem] border-2 border-red-200 bg-red-50 p-5 text-sm text-red-700">
        {error}
      </div>
    );
  }

  if (!deferredQuery) {
    return (
      <div className="rounded-[1.5rem] border-2 border-zinc-300 bg-zinc-50 p-5 text-sm text-zinc-600">
        Start typing a product, service, or event type to search.
      </div>
    );
  }

  if (filteredProducts.length === 0) {
    return (
      <div className="rounded-[1.5rem] border-2 border-zinc-300 bg-zinc-50 p-5 text-sm text-zinc-600">
        No products found for &quot;{queryText}&quot;.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-zinc-600">
        {filteredProducts.length} result{filteredProducts.length > 1 ? "s" : ""} for{" "}
        <span className="font-semibold text-zinc-900">{queryText}</span>
      </p>

      <div className="grid gap-4 lg:grid-cols-3">
        {filteredProducts.map((product) => {
          const minimumPrice = product.price_tiers?.low?.minimum_price;
          const maximumPrice = product.price_tiers?.low?.maximum_price;

          return (
            <Link
              key={product.id}
              className="block rounded-[1.75rem] border-2 border-zinc-300 bg-zinc-50 p-5 transition hover:border-zinc-500 hover:bg-white"
              href={`/products/${product.slug}`}
            >
              <div className="space-y-4">
                {product.thumbnail_url ? (
                  <div className="overflow-hidden rounded-[1.25rem] border-2 border-zinc-300 bg-white">
                    <img
                      alt={product.name}
                      className="h-40 w-full object-cover"
                      src={product.thumbnail_url}
                    />
                  </div>
                ) : (
                  <div className="flex h-40 items-center justify-center rounded-[1.25rem] border-2 border-dashed border-zinc-300 bg-white text-sm text-zinc-400">
                    Product image
                  </div>
                )}
                <div className="space-y-2">
                  <p className="text-lg font-semibold">{product.name}</p>
                  <p className="text-sm text-zinc-600">{product.short_description}</p>
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
                  <div className="text-sm text-zinc-600">
                    {typeof minimumPrice === "number" &&
                    typeof maximumPrice === "number"
                      ? `Rs. ${minimumPrice} - Rs. ${maximumPrice}`
                      : product.pricing_model.replaceAll("_", " ")}
                  </div>
                  <div className="flex h-10 w-28 items-center justify-center rounded-full border-2 border-zinc-900 bg-zinc-900 text-xs font-semibold uppercase tracking-[0.16em] text-white">
                    View
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
