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
import {
  ProductCard,
  productCardClassName,
  productCardGridClassName,
  toProductCardData,
  type ProductCardData,
} from "@/components/product-card";

const MAX_FEATURED_CARDS = 6;

const productsRef = collection(db, "products");

export function HomeProducts() {
  const [products, setProducts] = useState<ProductCardData[]>([]);
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
          snapshot.docs.map((entry) => toProductCardData(entry.id, entry.data()))
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
      <div className={productCardGridClassName}>
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className={`${productCardClassName} aspect-[530/545] animate-pulse`}
          >
            <div className="h-[62%] bg-[#efe9dd]" />
          </div>
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
    <>
      <div className={productCardGridClassName}>
        {products.slice(0, MAX_FEATURED_CARDS).map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      <div className="mt-10 flex justify-end lg:mt-[60px]">
        <Link
          className="text-[22px] leading-[40px] text-[var(--color-primary)] transition hover:underline lg:text-[38px]"
          href="/services"
        >
          View All →
        </Link>
      </div>
    </>
  );
}
