"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  collection,
  limit,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

type ProductDetailData = {
  id: string;
  name: string;
  slug: string;
  item_type: string;
  node_type?: string;
  layer?: number;
  component_product_ids?: string[];
  core_product_ids?: string[];
  optional_product_ids?: string[];
  service_group?: string;
  short_description: string;
  description: string;
  thumbnail_url?: string;
  banner_url?: string;
  pricing_model: string;
  image_urls: string[];
  category_ids: string[];
  event_type_ids?: string[];
  service_highlights?: string[];
  included_items?: string[];
  ideal_for?: string[];
  pricing_notes?: string[];
  faq?: Array<{
    question?: string;
    answer?: string;
  }>;
  terms_and_conditions?: string[];
  availability_note?: string;
  price_tiers?: {
    high?: {
      label?: string;
      maximum_price?: number;
      minimum_price?: number;
    };
    low?: {
      label?: string;
      maximum_price?: number;
      minimum_price?: number;
    };
    medium?: {
      label?: string;
      maximum_price?: number;
      minimum_price?: number;
    };
  };
  quotation_config?: {
    duration_label?: string;
    duration_required?: boolean;
    duration_unit?: string;
    manual_review_required?: boolean;
    minimum_duration?: number;
    minimum_quantity?: number;
    quantity_label?: string;
    quantity_required?: boolean;
    quantity_unit?: string;
    quotation_enabled?: boolean;
  };
  search_tags: string[];
};

type LinkedProductCard = {
  id: string;
  name: string;
  slug: string;
  item_type: string;
  node_type?: string;
  layer?: number;
  thumbnail_url?: string;
  short_description: string;
  pricing_model: string;
};

const productsRef = collection(db, "products");

function formatRange(
  minimumPrice?: number,
  maximumPrice?: number,
  label?: string
) {
  if (typeof minimumPrice !== "number" || typeof maximumPrice !== "number") {
    return null;
  }

  return {
    label: label ?? "Tier",
    value: `Rs. ${minimumPrice} - Rs. ${maximumPrice}`,
  };
}

export function ProductDetail({ slug }: { slug: string }) {
  const [product, setProduct] = useState<ProductDetailData | null>(null);
  const [linkedProducts, setLinkedProducts] = useState<LinkedProductCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const productQuery = query(productsRef, where("slug", "==", slug), limit(1));

    const unsubscribe = onSnapshot(
      productQuery,
      (snapshot) => {
        if (snapshot.empty) {
          setProduct(null);
          setIsLoading(false);
          return;
        }

        const entry = snapshot.docs[0];
        const data = entry.data();

        setProduct({
          id: entry.id,
          name: String(data.name ?? ""),
          slug: String(data.slug ?? entry.id),
          item_type: String(data.item_type ?? ""),
          node_type: data.node_type ? String(data.node_type) : undefined,
          layer: typeof data.layer === "number" ? data.layer : undefined,
          component_product_ids: Array.isArray(data.component_product_ids)
            ? data.component_product_ids.map((value) => String(value))
            : [],
          core_product_ids: Array.isArray(data.core_product_ids)
            ? data.core_product_ids.map((value) => String(value))
            : [],
          optional_product_ids: Array.isArray(data.optional_product_ids)
            ? data.optional_product_ids.map((value) => String(value))
            : [],
          service_group: data.service_group
            ? String(data.service_group)
            : undefined,
          short_description: String(data.short_description ?? ""),
          description: String(data.description ?? ""),
          thumbnail_url: data.thumbnail_url ? String(data.thumbnail_url) : undefined,
          banner_url: data.banner_url ? String(data.banner_url) : undefined,
          pricing_model: String(data.pricing_model ?? ""),
          image_urls: Array.isArray(data.image_urls)
            ? data.image_urls.map((image) => String(image))
            : [],
          category_ids: Array.isArray(data.category_ids)
            ? data.category_ids.map((categoryId) => String(categoryId))
            : [],
          event_type_ids: Array.isArray(data.event_type_ids)
            ? data.event_type_ids.map((eventTypeId) => String(eventTypeId))
            : [],
          price_tiers: data.price_tiers as ProductDetailData["price_tiers"],
          quotation_config:
            data.quotation_config as ProductDetailData["quotation_config"],
          service_highlights: Array.isArray(data.service_highlights)
            ? data.service_highlights.map((item) => String(item))
            : [],
          included_items: Array.isArray(data.included_items)
            ? data.included_items.map((item) => String(item))
            : [],
          ideal_for: Array.isArray(data.ideal_for)
            ? data.ideal_for.map((item) => String(item))
            : [],
          pricing_notes: Array.isArray(data.pricing_notes)
            ? data.pricing_notes.map((item) => String(item))
            : [],
          faq: Array.isArray(data.faq)
            ? data.faq.map((item) => ({
                question: item?.question ? String(item.question) : "",
                answer: item?.answer ? String(item.answer) : "",
              }))
            : [],
          terms_and_conditions: Array.isArray(data.terms_and_conditions)
            ? data.terms_and_conditions.map((item) => String(item))
            : [],
          availability_note: data.availability_note
            ? String(data.availability_note)
            : undefined,
          search_tags: Array.isArray(data.search_tags)
            ? data.search_tags.map((tag) => String(tag))
            : [],
        });
        setError("");
        setIsLoading(false);
      },
      (snapshotError) => {
        console.error(snapshotError);
        setError("Could not load product details from Firestore.");
        setIsLoading(false);
      }
    );

    return unsubscribe;
  }, [slug]);

  useEffect(() => {
    if (!product) {
      return;
    }

    const linkedIds = Array.from(
      new Set([
        ...(product.component_product_ids ?? []),
        ...(product.core_product_ids ?? []),
        ...(product.optional_product_ids ?? []),
      ])
    );

    if (linkedIds.length === 0) {
      return;
    }

    const chunkSize = 30;
    const chunks = Array.from(
      { length: Math.ceil(linkedIds.length / chunkSize) },
      (_, index) => linkedIds.slice(index * chunkSize, index * chunkSize + chunkSize)
    );

    const unsubscribes = chunks.map((idsChunk) => {
      const linkedProductsQuery = query(productsRef, where("id", "in", idsChunk));

      return onSnapshot(
        linkedProductsQuery,
        (snapshot) => {
          setLinkedProducts((current) => {
            const nextMap = new Map(
              current.map((linkedProduct) => [linkedProduct.id, linkedProduct])
            );

            for (const entry of snapshot.docs) {
              const data = entry.data();

              nextMap.set(entry.id, {
                id: entry.id,
                name: String(data.name ?? ""),
                slug: String(data.slug ?? entry.id),
                item_type: String(data.item_type ?? ""),
                node_type: data.node_type ? String(data.node_type) : undefined,
                layer: typeof data.layer === "number" ? data.layer : undefined,
                thumbnail_url: data.thumbnail_url
                  ? String(data.thumbnail_url)
                  : undefined,
                short_description: String(data.short_description ?? ""),
                pricing_model: String(data.pricing_model ?? ""),
              });
            }

            return linkedIds
              .map((id) => nextMap.get(id))
              .filter((value): value is LinkedProductCard => Boolean(value));
          });
        },
        (snapshotError) => {
          console.error(snapshotError);
          setError("Could not load linked products from Firestore.");
        }
      );
    });

    return () => {
      for (const unsubscribe of unsubscribes) {
        unsubscribe();
      }
    };
  }, [product]);

  if (error) {
    return (
      <div className="rounded-[2rem] border-2 border-red-200 bg-red-50 p-6 text-sm text-red-700">
        {error}
      </div>
    );
  }

  if (isLoading) {
    return (
      <section className="rounded-[2rem] border-2 border-zinc-300 bg-white p-6 sm:p-8">
        <div className="space-y-4">
          <div className="h-3 w-28 rounded-full bg-zinc-200" />
          <div className="h-10 w-2/3 rounded-2xl bg-zinc-900" />
          <div className="h-3 w-full rounded-full bg-zinc-200" />
          <div className="h-3 w-4/5 rounded-full bg-zinc-200" />
        </div>
      </section>
    );
  }

  if (!product) {
    return (
      <div className="rounded-[2rem] border-2 border-zinc-300 bg-white p-6 text-sm text-zinc-600">
        Product not found.
      </div>
    );
  }

  const priceRanges = [
    formatRange(
      product.price_tiers?.low?.minimum_price,
      product.price_tiers?.low?.maximum_price,
      product.price_tiers?.low?.label
    ),
    formatRange(
      product.price_tiers?.medium?.minimum_price,
      product.price_tiers?.medium?.maximum_price,
      product.price_tiers?.medium?.label
    ),
    formatRange(
      product.price_tiers?.high?.minimum_price,
      product.price_tiers?.high?.maximum_price,
      product.price_tiers?.high?.label
    ),
  ].filter(Boolean) as Array<{ label: string; value: string }>;
  const linkedProductMap = new Map(
    linkedProducts.map((linkedProduct) => [linkedProduct.id, linkedProduct])
  );
  const bundleComponents = (product.component_product_ids ?? [])
    .map((id) => linkedProductMap.get(id))
    .filter((value): value is LinkedProductCard => Boolean(value));
  const coreProducts = (product.core_product_ids ?? [])
    .map((id) => linkedProductMap.get(id))
    .filter((value): value is LinkedProductCard => Boolean(value));
  const optionalProducts = (product.optional_product_ids ?? [])
    .map((id) => linkedProductMap.get(id))
    .filter((value): value is LinkedProductCard => Boolean(value));

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

          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="space-y-4">
              {product.banner_url ? (
                <div className="overflow-hidden rounded-[1.75rem] border-2 border-zinc-300 bg-zinc-50">
                  <img
                    alt={product.name}
                    className="h-72 w-full object-cover"
                    src={product.banner_url}
                  />
                </div>
              ) : (
                <div className="flex min-h-72 items-end rounded-[1.75rem] border-2 border-dashed border-zinc-300 bg-[linear-gradient(135deg,#f4efe4_0%,#fff9f1_55%,#efe5d5_100%)] p-6 text-sm text-zinc-500">
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
                      Visual Preview
                    </p>
                    <p className="max-w-sm text-sm leading-6 text-zinc-600">
                      Banner image can be added later from Firestore. This placeholder keeps the layout ready.
                    </p>
                  </div>
                </div>
              )}

              {product.image_urls.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-3">
                  {product.image_urls.map((imageUrl, index) => (
                    <div
                      key={`${imageUrl}-${index}`}
                      className="overflow-hidden rounded-[1.25rem] border-2 border-zinc-300 bg-zinc-50"
                    >
                      <img
                        alt={`${product.name} gallery ${index + 1}`}
                        className="h-36 w-full object-cover"
                        src={imageUrl}
                      />
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="space-y-4">
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">
                  Product Detail
                </p>
                <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                  {product.name}
                </h1>
                <p className="text-base leading-7 text-zinc-600">
                  {product.description || product.short_description}
                </p>
              </div>

              <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.16em] text-zinc-500">
                <span className="rounded-full border border-zinc-300 bg-zinc-50 px-3 py-1">
                  {product.node_type?.replaceAll("_", " ") ??
                    product.item_type.replaceAll("_", " ")}
                </span>
                {typeof product.layer === "number" ? (
                  <span className="rounded-full border border-zinc-300 bg-zinc-50 px-3 py-1">
                    L{product.layer}
                  </span>
                ) : null}
                {product.service_group ? (
                  <span className="rounded-full border border-zinc-300 bg-zinc-50 px-3 py-1">
                    {product.service_group.replaceAll("-", " ")}
                  </span>
                ) : null}
              </div>

              {priceRanges.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-3">
                  {priceRanges.map((range) => (
                    <div
                      key={range.label}
                      className="rounded-[1.25rem] border-2 border-zinc-300 bg-zinc-50 p-4"
                    >
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
                        {range.label}
                      </p>
                      <p className="mt-2 text-sm font-medium text-zinc-900">
                        {range.value}
                      </p>
                    </div>
                  ))}
                </div>
              ) : null}

              <div className="pt-2">
                <Link
                  className="inline-flex h-11 items-center justify-center rounded-full border-2 border-zinc-900 bg-zinc-900 px-6 text-xs font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-zinc-800"
                  href={`/contact?category=${encodeURIComponent(product.category_ids[0] ?? "")}&product=${encodeURIComponent(product.id)}`}
                >
                  Get quotation
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {product.service_highlights && product.service_highlights.length > 0 ? (
        <section className="rounded-[2rem] border-2 border-zinc-300 bg-white p-6 sm:p-8">
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">
              Service Highlights
            </p>
            <div className="grid gap-3 md:grid-cols-3">
              {product.service_highlights.map((highlight) => (
                <div
                  key={highlight}
                  className="rounded-[1.25rem] border-2 border-zinc-300 bg-zinc-50 p-4 text-sm leading-6 text-zinc-700"
                >
                  {highlight}
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {(product.included_items && product.included_items.length > 0) ||
      (product.ideal_for && product.ideal_for.length > 0) ? (
        <section className="rounded-[2rem] border-2 border-zinc-300 bg-white p-6 sm:p-8">
          <div className="grid gap-6 md:grid-cols-2">
            {product.included_items && product.included_items.length > 0 ? (
              <div className="space-y-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">
                  Included
                </p>
                <div className="space-y-3">
                  {product.included_items.map((item) => (
                    <div
                      key={item}
                      className="rounded-[1.25rem] border-2 border-zinc-300 bg-zinc-50 p-4 text-sm text-zinc-700"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {product.ideal_for && product.ideal_for.length > 0 ? (
              <div className="space-y-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">
                  Ideal For
                </p>
                <div className="space-y-3">
                  {product.ideal_for.map((item) => (
                    <div
                      key={item}
                      className="rounded-[1.25rem] border-2 border-zinc-300 bg-zinc-50 p-4 text-sm text-zinc-700"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      <section className="rounded-[2rem] border-2 border-zinc-300 bg-white p-6 sm:p-8">
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">
            Quotation Rules
          </p>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-[1.25rem] border-2 border-zinc-300 bg-zinc-50 p-4">
              <p className="text-sm font-semibold text-zinc-900">
                Pricing model
              </p>
              <p className="mt-2 text-sm text-zinc-600">
                {product.pricing_model.replaceAll("_", " ")}
              </p>
            </div>

            <div className="rounded-[1.25rem] border-2 border-zinc-300 bg-zinc-50 p-4">
              <p className="text-sm font-semibold text-zinc-900">
                Manual review
              </p>
              <p className="mt-2 text-sm text-zinc-600">
                {product.quotation_config?.manual_review_required
                  ? "Required for final quotation"
                  : "Not required by default"}
              </p>
            </div>

            {product.quotation_config?.quantity_required ? (
              <div className="rounded-[1.25rem] border-2 border-zinc-300 bg-zinc-50 p-4">
                <p className="text-sm font-semibold text-zinc-900">
                  Quantity input
                </p>
                <p className="mt-2 text-sm text-zinc-600">
                  {product.quotation_config.quantity_label ??
                    "Quantity required"}
                  {product.quotation_config.minimum_quantity
                    ? ` | Minimum ${product.quotation_config.minimum_quantity}`
                    : ""}
                </p>
              </div>
            ) : null}

            {product.quotation_config?.duration_required ? (
              <div className="rounded-[1.25rem] border-2 border-zinc-300 bg-zinc-50 p-4">
                <p className="text-sm font-semibold text-zinc-900">
                  Duration input
                </p>
                <p className="mt-2 text-sm text-zinc-600">
                  {product.quotation_config.duration_label ??
                    "Duration required"}
                  {product.quotation_config.minimum_duration
                    ? ` | Minimum ${product.quotation_config.minimum_duration}`
                    : ""}
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {(product.pricing_notes && product.pricing_notes.length > 0) ||
      product.availability_note ? (
        <section className="rounded-[2rem] border-2 border-zinc-300 bg-white p-6 sm:p-8">
          <div className="grid gap-6 md:grid-cols-[1.2fr_0.8fr]">
            {product.pricing_notes && product.pricing_notes.length > 0 ? (
              <div className="space-y-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">
                  Pricing Notes
                </p>
                <div className="space-y-3">
                  {product.pricing_notes.map((note) => (
                    <div
                      key={note}
                      className="rounded-[1.25rem] border-2 border-zinc-300 bg-zinc-50 p-4 text-sm leading-6 text-zinc-700"
                    >
                      {note}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {product.availability_note ? (
              <div className="space-y-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">
                  Availability
                </p>
                <div className="rounded-[1.25rem] border-2 border-zinc-300 bg-zinc-50 p-4 text-sm leading-6 text-zinc-700">
                  {product.availability_note}
                </div>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {product.faq && product.faq.length > 0 ? (
        <section className="rounded-[2rem] border-2 border-zinc-300 bg-white p-6 sm:p-8">
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">
              Frequently Asked Questions
            </p>
            <div className="space-y-3">
              {product.faq.map((item, index) => (
                <div
                  key={`${item.question ?? "faq"}-${index}`}
                  className="rounded-[1.25rem] border-2 border-zinc-300 bg-zinc-50 p-4"
                >
                  <p className="text-sm font-semibold text-zinc-900">
                    {item.question}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-zinc-600">
                    {item.answer}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {product.terms_and_conditions &&
      product.terms_and_conditions.length > 0 ? (
        <section className="rounded-[2rem] border-2 border-zinc-300 bg-white p-6 sm:p-8">
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">
              Terms and Conditions
            </p>
            <div className="space-y-3">
              {product.terms_and_conditions.map((term) => (
                <div
                  key={term}
                  className="rounded-[1.25rem] border-2 border-zinc-300 bg-zinc-50 p-4 text-sm leading-6 text-zinc-700"
                >
                  {term}
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {product.search_tags.length > 0 ? (
        <section className="rounded-[2rem] border-2 border-zinc-300 bg-white p-6 sm:p-8">
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">
              Search Keywords
            </p>
            <div className="flex flex-wrap gap-3">
              {product.search_tags.map((tag) => (
                <div
                  key={tag}
                  className="rounded-full border-2 border-zinc-300 bg-zinc-50 px-4 py-2 text-sm text-zinc-700"
                >
                  {tag}
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {((product.component_product_ids && product.component_product_ids.length > 0) ||
        (product.core_product_ids && product.core_product_ids.length > 0) ||
        (product.optional_product_ids && product.optional_product_ids.length > 0)) ? (
        <section className="rounded-[2rem] border-2 border-zinc-300 bg-white p-6 sm:p-8">
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">
              Linked Products
            </p>
            {bundleComponents.length > 0 ? (
              <div>
                <p className="text-sm font-semibold text-zinc-900">Bundle Components</p>
                <div className="mt-3 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {bundleComponents.map((linkedProduct) => (
                    <Link
                      key={linkedProduct.id}
                      className="block rounded-[1.5rem] border-2 border-zinc-300 bg-zinc-50 p-4 transition hover:border-zinc-500 hover:bg-white"
                      href={`/products/${linkedProduct.slug}`}
                    >
                      <div className="space-y-3">
                        {linkedProduct.thumbnail_url ? (
                          <div className="overflow-hidden rounded-[1rem] border border-zinc-300 bg-white">
                            <img
                              alt={linkedProduct.name}
                              className="h-36 w-full object-cover"
                              src={linkedProduct.thumbnail_url}
                            />
                          </div>
                        ) : null}
                        <div className="flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.16em] text-zinc-500">
                          <span className="rounded-full border border-zinc-300 bg-white px-3 py-1">
                            {linkedProduct.node_type?.replaceAll("_", " ") ??
                              linkedProduct.item_type.replaceAll("_", " ")}
                          </span>
                          {typeof linkedProduct.layer === "number" ? (
                            <span className="rounded-full border border-zinc-300 bg-white px-3 py-1">
                              L{linkedProduct.layer}
                            </span>
                          ) : null}
                        </div>
                        <p className="text-base font-semibold text-zinc-900">
                          {linkedProduct.name}
                        </p>
                        <p className="text-sm leading-6 text-zinc-600">
                          {linkedProduct.short_description}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
            {coreProducts.length > 0 ? (
              <div>
                <p className="text-sm font-semibold text-zinc-900">Core Products</p>
                <div className="mt-3 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {coreProducts.map((linkedProduct) => (
                    <Link
                      key={linkedProduct.id}
                      className="block rounded-[1.5rem] border-2 border-zinc-300 bg-zinc-50 p-4 transition hover:border-zinc-500 hover:bg-white"
                      href={`/products/${linkedProduct.slug}`}
                    >
                      <div className="space-y-3">
                        {linkedProduct.thumbnail_url ? (
                          <div className="overflow-hidden rounded-[1rem] border border-zinc-300 bg-white">
                            <img
                              alt={linkedProduct.name}
                              className="h-36 w-full object-cover"
                              src={linkedProduct.thumbnail_url}
                            />
                          </div>
                        ) : null}
                        <div className="flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.16em] text-zinc-500">
                          <span className="rounded-full border border-zinc-300 bg-white px-3 py-1">
                            {linkedProduct.node_type?.replaceAll("_", " ") ??
                              linkedProduct.item_type.replaceAll("_", " ")}
                          </span>
                          {typeof linkedProduct.layer === "number" ? (
                            <span className="rounded-full border border-zinc-300 bg-white px-3 py-1">
                              L{linkedProduct.layer}
                            </span>
                          ) : null}
                        </div>
                        <p className="text-base font-semibold text-zinc-900">
                          {linkedProduct.name}
                        </p>
                        <p className="text-sm leading-6 text-zinc-600">
                          {linkedProduct.short_description}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
            {optionalProducts.length > 0 ? (
              <div>
                <p className="text-sm font-semibold text-zinc-900">Optional Products</p>
                <div className="mt-3 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {optionalProducts.map((linkedProduct) => (
                    <Link
                      key={linkedProduct.id}
                      className="block rounded-[1.5rem] border-2 border-zinc-300 bg-zinc-50 p-4 transition hover:border-zinc-500 hover:bg-white"
                      href={`/products/${linkedProduct.slug}`}
                    >
                      <div className="space-y-3">
                        {linkedProduct.thumbnail_url ? (
                          <div className="overflow-hidden rounded-[1rem] border border-zinc-300 bg-white">
                            <img
                              alt={linkedProduct.name}
                              className="h-36 w-full object-cover"
                              src={linkedProduct.thumbnail_url}
                            />
                          </div>
                        ) : null}
                        <div className="flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.16em] text-zinc-500">
                          <span className="rounded-full border border-zinc-300 bg-white px-3 py-1">
                            {linkedProduct.node_type?.replaceAll("_", " ") ??
                              linkedProduct.item_type.replaceAll("_", " ")}
                          </span>
                          {typeof linkedProduct.layer === "number" ? (
                            <span className="rounded-full border border-zinc-300 bg-white px-3 py-1">
                              L{linkedProduct.layer}
                            </span>
                          ) : null}
                        </div>
                        <p className="text-base font-semibold text-zinc-900">
                          {linkedProduct.name}
                        </p>
                        <p className="text-sm leading-6 text-zinc-600">
                          {linkedProduct.short_description}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}
    </div>
  );
}
