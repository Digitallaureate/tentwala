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
  pricing_model: string;
  price_tiers?: {
    low?: {
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
      <div className="grid gap-4 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <article
            key={index}
            className="rounded-[1.75rem] border-2 border-zinc-300 bg-zinc-50 p-5"
          >
            <div className="space-y-4">
              <div className="flex h-40 items-center justify-center rounded-[1.25rem] border-2 border-dashed border-zinc-300 bg-white text-sm text-zinc-400">
                Loading
              </div>
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

  if (products.length === 0) {
    return (
      <div className="rounded-[1.5rem] border-2 border-zinc-300 bg-zinc-50 p-5 text-sm text-zinc-600">
        No featured products found in Firestore. Upload product data first.
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {products.map((product) => (
        <Link
          key={product.id}
          className="block rounded-[1.75rem] border-2 border-zinc-300 bg-zinc-50 p-5 transition hover:border-zinc-500 hover:bg-white"
          href={`/products/${product.slug}`}
        >
          <div className="space-y-4">
            <div className="flex h-40 items-center justify-center rounded-[1.25rem] border-2 border-dashed border-zinc-300 bg-white text-sm text-zinc-400">
              Product image
            </div>
            <div className="space-y-2">
              <p className="text-lg font-semibold">{product.name}</p>
              <p className="text-sm text-zinc-600">{product.short_description}</p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
