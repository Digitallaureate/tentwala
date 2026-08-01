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

type HomeProduct = {
  id: string;
  name: string;
  slug: string;
  short_description: string;
  item_type: string;
  node_type?: string;
  layer?: number;
  thumbnail_url?: string;
  service_group?: string;
  pricing_model: string;
  price_tiers?: {
    low?: {
      label?: string;
      minimum_price?: number;
      maximum_price?: number;
    };
  };
  sort_order: number;
};

const productsRef = collection(db, "products");

export function HomeProducts() {
  const [products, setProducts] = useState<HomeProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const productsQuery = query(
      productsRef,
      where("is_active", "==", true),
      where("is_featured", "==", true),
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
              name: String(data.name ?? ""),
              slug: String(data.slug ?? entry.id),
              short_description: String(data.short_description ?? ""),
              item_type: String(data.item_type ?? ""),
              node_type: data.node_type ? String(data.node_type) : undefined,
              layer: typeof data.layer === "number" ? data.layer : undefined,
              thumbnail_url: data.thumbnail_url
                ? String(data.thumbnail_url)
                : undefined,
              service_group: data.service_group
                ? String(data.service_group)
                : undefined,
              pricing_model: String(data.pricing_model ?? ""),
              price_tiers: data.price_tiers as HomeProduct["price_tiers"],
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
          "Could not load featured products from Firestore. Check rules and create the index if Firebase asks for one."
        );
        setIsLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  if (isLoading) {
    return (
      <div className="grid gap-6 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <article
            key={index}
            className="overflow-hidden rounded-[2rem] border border-[#dbe4e4] bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(247,250,250,0.96)_100%)] shadow-[0_22px_55px_rgba(54,72,84,0.1)]"
          >
            <div className="space-y-0">
              <div className="h-52 bg-zinc-100" />
              <div className="space-y-4 p-6">
                <div className="h-4 w-24 rounded-full bg-[#dceaea]" />
                <div className="h-8 w-2/3 rounded-full bg-zinc-200" />
                <div className="h-3 w-full rounded-full bg-zinc-200" />
                <div className="h-3 w-5/6 rounded-full bg-zinc-200" />
                <div className="flex items-center justify-between">
                  <div className="h-4 w-28 rounded-full bg-zinc-200" />
                  <div className="h-11 w-11 rounded-full bg-[#dceaea]" />
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

  if (products.length === 0) {
    return (
      <div className="rounded-[1.5rem] border-2 border-zinc-300 bg-zinc-50 p-5 text-sm text-zinc-600">
        No featured products found in Firestore. Upload product data first.
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {products.map((product, index) => {
        const minimumPrice = product.price_tiers?.low?.minimum_price;
        const maximumPrice = product.price_tiers?.low?.maximum_price;
        const pricingText =
          typeof minimumPrice === "number" && typeof maximumPrice === "number"
            ? `From Rs. ${minimumPrice} - Rs. ${maximumPrice}`
            : product.pricing_model.replaceAll("_", " ");

        return (
          <Link
            key={product.id}
            className="group block overflow-hidden rounded-[2rem] border border-[#dbe4e4] bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(247,250,250,0.96)_100%)] shadow-[0_22px_55px_rgba(54,72,84,0.1)] transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_28px_68px_rgba(54,72,84,0.16)]"
            href={`/products/${product.slug}`}
          >
            <div className="relative overflow-hidden">
              {product.thumbnail_url ? (
                <img
                  alt={product.name}
                  className="h-56 w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                  src={product.thumbnail_url}
                />
              ) : (
                <div className="flex h-56 items-center justify-center bg-[linear-gradient(135deg,#dff3f5_0%,#fffdf9_52%,#f5e8d8_100%)] text-sm text-zinc-500">
                  Product image
                </div>
              )}

              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.02)_0%,rgba(15,23,42,0.08)_46%,rgba(15,23,42,0.42)_100%)]" />

              <div className="absolute left-5 top-5 flex flex-wrap gap-2">
                <span className="rounded-full border border-white/50 bg-white/78 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#2c8088] backdrop-blur">
                  {String(index + 1).padStart(2, "0")}
                </span>
                {typeof product.layer === "number" ? (
                  <span className="rounded-full border border-white/40 bg-[#1d2d44]/50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-white backdrop-blur">
                    L{product.layer}
                  </span>
                ) : null}
              </div>

              <div className="absolute inset-x-0 bottom-0 p-5">
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full border border-white/30 bg-white/14 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/95 backdrop-blur">
                    {product.node_type?.replaceAll("_", " ") ??
                      product.item_type.replaceAll("_", " ")}
                  </span>
                  {product.service_group ? (
                    <span className="rounded-full border border-white/30 bg-white/14 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/95 backdrop-blur">
                      {product.service_group.replaceAll("-", " ")}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="space-y-5 p-6">
              <div className="space-y-3">
                <h3 className="font-serif text-[2rem] leading-tight text-[#1d2d44]">
                  {product.name}
                </h3>
                <p className="text-sm leading-7 text-zinc-600">
                  {product.short_description}
                </p>
              </div>

              <div className="flex items-center justify-between gap-4 border-t border-[#e3ecec] pt-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#56b7c4]">
                    Starting Range
                  </p>
                  <p className="mt-1 text-sm font-medium text-zinc-700">
                    {pricingText}
                  </p>
                </div>

                <span className="inline-flex h-12 min-w-12 items-center justify-center rounded-full border border-[#1d2d44]/12 bg-white text-lg text-[#1d2d44] transition group-hover:border-[#56b7c4]/60 group-hover:text-[#56b7c4]">
                  →
                </span>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
