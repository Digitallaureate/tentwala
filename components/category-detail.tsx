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
import {
  ProductCard,
  productCardClassName,
  productCardGridClassName,
  toProductCardData,
  type ProductCardData,
} from "@/components/product-card";
import {
  DetailBreadcrumb,
  DetailGallery,
  QuoteSidebar,
} from "@/components/service-detail/shared";

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
  service_cities?: string[];
  events_heading?: string;
  starting_price?: number;
  price_note?: string;
  faq?: Array<{
    question: string;
    answer: string;
  }>;
};

type CategoryEvent = ProductCardData & {
  node_type?: string;
  layer?: number;
};

const MAX_EVENT_CARDS = 6;

const categoriesRef = collection(db, "product_categories");
const categoryDetailsRef = collection(db, "category_details");
const productsRef = collection(db, "products");

function toStringList(value: unknown) {
  return Array.isArray(value) ? value.map((item) => String(item)) : undefined;
}

export function CategoryDetail({ slug }: { slug: string }) {
  const [category, setCategory] = useState<CategoryDetailData | null>(null);
  const [products, setProducts] = useState<CategoryEvent[]>([]);
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
          service_cities: toStringList(data.service_cities),
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
                image_urls: toStringList(data.image_urls) ?? [],
                service_highlights: toStringList(data.service_highlights) ?? [],
                service_cities:
                  toStringList(data.service_cities) ?? current.service_cities,
                events_heading: data.events_heading
                  ? String(data.events_heading)
                  : undefined,
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
              ...toProductCardData(entry.id, data),
              node_type: data.node_type ? String(data.node_type) : undefined,
              layer: typeof data.layer === "number" ? data.layer : undefined,
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
      <div className="rounded-[20px] border-2 border-red-200 bg-red-50 p-6 text-sm text-red-700">
        {error}
      </div>
    );
  }

  if (isCategoryLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-6 w-56 rounded-full bg-[#efe9dd]" />
        <div className="aspect-[950/621] w-full max-w-[950px] rounded-[20px] bg-[#efe9dd]" />
        <div className="h-12 w-2/3 rounded-full bg-[#efe9dd]" />
      </div>
    );
  }

  if (!category) {
    return (
      <div className="rounded-[20px] bg-white p-6 text-sm text-[#717171] shadow-[0_6px_24px_rgba(0,0,0,0.08)]">
        Category not found.
      </div>
    );
  }

  const galleryImages = Array.from(
    new Set(
      [
        category.banner_url,
        ...(category.image_urls ?? []),
        category.thumbnail_url,
      ].filter((image): image is string => Boolean(image))
    )
  );
  // Lowest listed price among this category's event types; the category's own
  // `starting_price` is only a fallback when no event has a price.
  const lowestEventPrice = eventTypeProducts
    .map((product) => product.starting_price)
    .filter((price): price is number => typeof price === "number")
    .reduce<number | undefined>(
      (lowest, price) =>
        lowest === undefined ? price : Math.min(lowest, price),
      undefined
    );
  const startingPrice = lowestEventPrice ?? category.starting_price;
  const description = category.description || category.short_description;
  const highlights = category.service_highlights ?? [];

  return (
    // Desktop sizes are Figma values (1920px frame, 1680px content) scaled by the
    // content width, e.g. 62px title = 3.69cqw, 950px gallery = 56.55cqw.
    <div className="mx-auto w-full max-w-[1680px] [container-type:inline-size]">
      <DetailBreadcrumb crumbs={[{ label: category.name }]} />

      <div className="mt-6 flex flex-col gap-6 lg:mt-[2.4cqw] lg:flex-row lg:gap-[5cqw]">
        <div className="lg:w-[56.55cqw] lg:shrink-0">
          <DetailGallery images={galleryImages} name={category.name} />
        </div>

        <QuoteSidebar
          note={category.price_note}
          quoteHref={`/contact?category=${encodeURIComponent(category.id)}`}
          startingPrice={startingPrice}
        />
      </div>

      <div className="mt-8 max-w-[62cqw] max-lg:max-w-none lg:mt-[2.6cqw]">
        <h1 className="font-serif text-[clamp(30px,3.69cqw,62px)] leading-[1.29] text-black">
          {category.name}
        </h1>
        {category.service_cities && category.service_cities.length > 0 ? (
          <p className="text-[clamp(15px,1.667cqw,28px)] leading-[1.3] text-[var(--color-gold)]">
            {category.service_cities.join(", ")}
          </p>
        ) : null}
        {description ? (
          <p className="mt-4 text-[clamp(15px,1.786cqw,30px)] leading-[1.13] text-[#717171] lg:mt-[1.2cqw]">
            {description}
          </p>
        ) : null}

        {highlights.length > 0 ? (
          <>
            <h2 className="mt-8 font-serif text-[clamp(22px,2.262cqw,38px)] leading-[1.2] text-black lg:mt-[1.8cqw]">
              Service Highlights
            </h2>
            <ul className="mt-4 grid gap-x-[2.4cqw] gap-y-3 text-[clamp(15px,1.786cqw,30px)] leading-[1.13] text-[#717171] sm:grid-cols-2 lg:mt-[1.2cqw] lg:gap-y-[2cqw]">
              {highlights.map((highlight) => (
                <li key={highlight} className="flex gap-1">
                  <span aria-hidden="true" className="text-[var(--color-primary)]">
                    ✓
                  </span>
                  {highlight}
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </div>

      <section className="mt-14 lg:mt-[4.8cqw]">
        <h2 className="font-serif text-[clamp(28px,3.45cqw,58px)] leading-[1.38] text-black">
          {category.events_heading ?? "Popular Events"}
        </h2>
        <div className="h-[2px] w-[110px] bg-[var(--color-gold)] lg:w-[150px]" />

        <div className="mt-8 lg:mt-[2.7cqw]">
          {isProductsLoading ? (
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
          ) : eventTypeProducts.length > 0 ? (
            <>
              <div className={productCardGridClassName}>
                {eventTypeProducts.slice(0, MAX_EVENT_CARDS).map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
              <div className="mt-10 flex justify-end lg:mt-[3.6cqw]">
                <Link
                  className="text-[22px] leading-[40px] text-[var(--color-primary)] transition hover:underline lg:text-[clamp(22px,2.262cqw,38px)]"
                  href={`/services?category=${encodeURIComponent(category.slug)}`}
                >
                  View All →
                </Link>
              </div>
            </>
          ) : (
            <div className="rounded-[20px] bg-white p-5 text-sm text-[#717171] shadow-[0_6px_24px_rgba(0,0,0,0.08)]">
              No event types are linked to this category yet.
            </div>
          )}
        </div>
      </section>

      {category.faq && category.faq.length > 0 ? (
        <section className="mt-14 lg:mt-[4.8cqw]">
          <h2 className="font-serif text-[clamp(28px,3.45cqw,58px)] leading-[1.38] text-black">
            FAQ
          </h2>
          <div className="h-[2px] w-[110px] bg-[var(--color-gold)] lg:w-[150px]" />
          <div className="mt-8 space-y-4">
            {category.faq.map((item) => (
              <article
                key={item.question}
                className="rounded-[20px] bg-white p-5 shadow-[0_6px_24px_rgba(0,0,0,0.08)] sm:p-6"
              >
                <h3 className="font-serif text-xl text-black">{item.question}</h3>
                <p className="mt-2 text-base leading-7 text-[#717171]">
                  {item.answer}
                </p>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
