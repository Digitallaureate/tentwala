"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  collection,
  doc,
  limit,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getMinimumListedPrice } from "@/components/product-card";
import {
  DetailBreadcrumb,
  DetailGallery,
  QuoteSidebar,
  type Crumb,
} from "@/components/service-detail/shared";

type QuotationConfig = {
  duration_label?: string;
  duration_required?: boolean;
  minimum_duration?: number;
  manual_review_required?: boolean;
  minimum_quantity?: number;
  quantity_label?: string;
  quantity_required?: boolean;
};

type ProductDetailData = {
  id: string;
  name: string;
  slug: string;
  node_type?: string;
  layer?: number;
  component_product_ids: string[];
  core_product_ids: string[];
  optional_product_ids: string[];
  short_description: string;
  description: string;
  thumbnail_url?: string;
  banner_url?: string;
  image_urls: string[];
  pricing_model: string;
  category_ids: string[];
  service_cities: string[];
  starting_price?: number;
  quotation_config?: QuotationConfig;
};

type LinkedProductCard = {
  id: string;
  name: string;
  slug: string;
  thumbnail_url?: string;
};

type ParentEvent = { name: string; slug: string; category_ids: string[] };
type ParentCategory = { name: string; slug: string };

const productsRef = collection(db, "products");

function toStringList(value: unknown) {
  return Array.isArray(value) ? value.map((item) => String(item)) : [];
}

// "Number of days | Minimum 1"; "Not required" when the input isn't used.
function describeInput(
  isRequired: boolean | undefined,
  label: string | undefined,
  minimum: number | undefined
) {
  if (!isRequired) {
    return "Not required";
  }

  const parts = [label || "Required"];

  if (typeof minimum === "number") {
    parts.push(`Minimum ${minimum}`);
  }

  return parts.join(" | ");
}

function buildQuotationRules(product: ProductDetailData) {
  const config = product.quotation_config;

  return [
    {
      label: "Pricing model",
      value: product.pricing_model
        ? product.pricing_model.replaceAll("_", " ")
        : "On request",
    },
    {
      label: "Manual review",
      value: config?.manual_review_required
        ? "Required for final quotation"
        : "Not required",
    },
    {
      label: "Duration input",
      value: describeInput(
        config?.duration_required,
        config?.duration_label,
        config?.minimum_duration
      ),
    },
    {
      label: "Quantity input",
      value: describeInput(
        config?.quantity_required,
        config?.quantity_label,
        config?.minimum_quantity
      ),
    },
  ];
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <>
      <h2 className="font-serif text-[clamp(28px,3.45cqw,58px)] leading-[1.38] text-black">
        {children}
      </h2>
      <div className="h-[2px] w-[110px] bg-[var(--color-gold)] lg:w-[150px]" />
    </>
  );
}

// Tile for a bundle linked from an event ("Core Services").
// Sizes are Figma values (530px tile) scaled by tile width.
function CoreServiceTile({
  eventSlug,
  item,
  note,
}: {
  eventSlug: string;
  item: LinkedProductCard;
  note: string;
}) {
  return (
    <div className="[container-type:inline-size]">
      <Link
        className="group relative block aspect-[530/385] overflow-hidden rounded-[20px] bg-[#efe9dd] shadow-[0_6px_24px_rgba(0,0,0,0.08)]"
        href={`/products/${item.slug}?from=${encodeURIComponent(eventSlug)}`}
      >
        {item.thumbnail_url ? (
          <img
            alt={item.name}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
            src={item.thumbnail_url}
          />
        ) : (
          <div className="h-full w-full bg-[linear-gradient(135deg,#efe9dd_0%,#faf7f2_52%,#e9dcc0_100%)]" />
        )}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0)_55%,rgba(0,0,0,0.55)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 px-[4.5cqw] pb-[3.5cqw]">
          <span className="inline-block rounded-full bg-[#e5e3df]/95 px-[3.77cqw] py-[0.75cqw] text-[clamp(11px,3.77cqw,20px)] leading-[1.5] text-black">
            {item.name}
          </span>
          <p className="mt-[0.5cqw] text-[clamp(10px,3.2cqw,17px)] leading-[1.4] text-white">
            {note}
          </p>
        </div>
      </Link>
    </div>
  );
}

export function ProductDetail({
  slug,
  fromSlug,
}: {
  slug: string;
  fromSlug?: string;
}) {
  const [product, setProduct] = useState<ProductDetailData | null>(null);
  const [linkedProducts, setLinkedProducts] = useState<LinkedProductCard[]>([]);
  const [parentEvent, setParentEvent] = useState<ParentEvent | null>(null);
  const [parentCategory, setParentCategory] = useState<ParentCategory | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const productId = product?.id;
  const productLayer = product?.layer;
  const ownCategoryId = product?.category_ids[0];
  const categoryId =
    productLayer === 3
      ? ownCategoryId
      : (parentEvent?.category_ids[0] ?? ownCategoryId);

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
          node_type: data.node_type ? String(data.node_type) : undefined,
          layer: typeof data.layer === "number" ? data.layer : undefined,
          component_product_ids: toStringList(data.component_product_ids),
          core_product_ids: toStringList(data.core_product_ids),
          optional_product_ids: toStringList(data.optional_product_ids),
          short_description: String(data.short_description ?? ""),
          description: String(data.description ?? ""),
          thumbnail_url: data.thumbnail_url ? String(data.thumbnail_url) : undefined,
          banner_url: data.banner_url ? String(data.banner_url) : undefined,
          image_urls: toStringList(data.image_urls),
          pricing_model: String(data.pricing_model ?? ""),
          category_ids: toStringList(data.category_ids),
          service_cities: toStringList(data.service_cities),
          starting_price: getMinimumListedPrice(data.price_tiers),
          quotation_config: data.quotation_config as QuotationConfig | undefined,
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

  // Items shown on the page: core bundles for an event, component items for a bundle.
  useEffect(() => {
    if (!product) {
      return;
    }

    const linkedIds = Array.from(
      new Set([
        ...product.component_product_ids,
        ...product.core_product_ids,
        ...product.optional_product_ids,
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
                thumbnail_url: data.thumbnail_url
                  ? String(data.thumbnail_url)
                  : undefined,
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

  // For a bundle or item, find the event it was opened from (breadcrumb only).
  useEffect(() => {
    if (!productId || productLayer === 3) {
      return;
    }

    const parentQuery = fromSlug
      ? query(productsRef, where("slug", "==", fromSlug), limit(1))
      : productLayer === 2
        ? query(
            productsRef,
            where("core_product_ids", "array-contains", productId),
            limit(1)
          )
        : null;

    if (!parentQuery) {
      return;
    }

    return onSnapshot(
      parentQuery,
      (snapshot) => {
        const data = snapshot.docs[0]?.data();

        setParentEvent(
          data
            ? {
                name: String(data.name ?? ""),
                slug: String(data.slug ?? ""),
                category_ids: toStringList(data.category_ids),
              }
            : null
        );
      },
      (snapshotError) => console.error(snapshotError)
    );
  }, [productId, productLayer, fromSlug]);

  useEffect(() => {
    if (!categoryId) {
      return;
    }

    return onSnapshot(
      doc(db, "product_categories", categoryId),
      (snapshot) => {
        const data = snapshot.data();

        setParentCategory(
          data
            ? {
                name: String(data.name ?? ""),
                slug: String(data.slug ?? snapshot.id),
              }
            : null
        );
      },
      (snapshotError) => console.error(snapshotError)
    );
  }, [categoryId]);

  if (error) {
    return (
      <div className="rounded-[20px] border-2 border-red-200 bg-red-50 p-6 text-sm text-red-700">
        {error}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-6 w-72 rounded-full bg-[#efe9dd]" />
        <div className="aspect-[950/621] w-full max-w-[950px] rounded-[20px] bg-[#efe9dd]" />
        <div className="h-12 w-2/3 rounded-full bg-[#efe9dd]" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="rounded-[20px] bg-white p-6 text-sm text-[#717171] shadow-[0_6px_24px_rgba(0,0,0,0.08)]">
        Product not found.
      </div>
    );
  }

  const isEvent = product.layer === 3;
  const linkedById = new Map(linkedProducts.map((item) => [item.id, item]));
  const coreServices = product.core_product_ids
    .map((id) => linkedById.get(id))
    .filter((item): item is LinkedProductCard => Boolean(item));
  const optionalServices = product.optional_product_ids
    .map((id) => linkedById.get(id))
    .filter((item): item is LinkedProductCard => Boolean(item));
  const otherServices = product.component_product_ids
    .map((id) => linkedById.get(id))
    .filter((item): item is LinkedProductCard => Boolean(item));
  const galleryImages = Array.from(
    new Set(
      [product.banner_url, ...product.image_urls, product.thumbnail_url].filter(
        (image): image is string => Boolean(image)
      )
    )
  );
  const description = product.description || product.short_description;
  const quoteHref = `/contact?category=${encodeURIComponent(categoryId ?? "")}`;

  const crumbs: Crumb[] = [];

  if (parentCategory) {
    crumbs.push({
      label: parentCategory.name,
      href: `/categories/${parentCategory.slug}`,
    });
  }

  if (!isEvent && parentEvent) {
    crumbs.push({
      label: parentEvent.name,
      href: `/products/${parentEvent.slug}`,
    });
  }

  crumbs.push({ label: product.name });

  const titleBlock = (
    <>
      <h1 className="font-serif text-[clamp(30px,3.69cqw,62px)] leading-[1.29] text-black">
        {product.name}
      </h1>
      {product.service_cities.length > 0 ? (
        <p className="text-[clamp(15px,1.667cqw,28px)] leading-[1.3] text-[var(--color-gold)]">
          {product.service_cities.join(", ")}
        </p>
      ) : null}
      {description ? (
        <p className="mt-4 text-[clamp(15px,1.786cqw,30px)] leading-[1.13] text-[#717171] lg:mt-[1.2cqw]">
          {description}
        </p>
      ) : null}
    </>
  );

  // Event page: gallery + quote cards, then the core services tiles.
  if (isEvent) {
    return (
      // Desktop sizes are Figma values (1920px frame, 1680px content) scaled by the
      // content width, e.g. 62px title = 3.69cqw.
      <div className="mx-auto w-full max-w-[1680px] [container-type:inline-size]">
        <DetailBreadcrumb crumbs={crumbs} />

        <div className="mt-6 flex flex-col gap-6 lg:mt-[2.4cqw] lg:flex-row lg:gap-[5cqw]">
          <div className="lg:w-[56.55cqw] lg:shrink-0">
            <DetailGallery images={galleryImages} name={product.name} />
          </div>
          <QuoteSidebar
            quoteHref={quoteHref}
            startingPrice={product.starting_price}
          />
        </div>

        <div className="mt-8 max-w-[62cqw] max-lg:max-w-none lg:mt-[2.6cqw]">
          {titleBlock}
        </div>

        {[
          { title: "Core Services", items: coreServices, suffix: "is included." },
          {
            title: "Optional Services",
            items: optionalServices,
            suffix: "is available as an add-on.",
          },
        ].map((group) =>
          group.items.length > 0 ? (
            <section key={group.title} className="mt-14 lg:mt-[4.8cqw]">
              <SectionTitle>{group.title}</SectionTitle>
              <div className="mt-8 grid gap-6 md:grid-cols-2 lg:mt-[2.7cqw] lg:grid-cols-3 lg:gap-x-[43px] lg:gap-y-[25px]">
                {group.items.map((item) => (
                  <CoreServiceTile
                    key={item.id}
                    eventSlug={product.slug}
                    item={item}
                    note={`${item.name} ${group.suffix}`}
                  />
                ))}
              </div>
            </section>
          ) : null
        )}

        {coreServices.length + optionalServices.length > 0 ? (
          <div className="mt-10 flex justify-end lg:mt-[3.6cqw]">
            {/* <Link
              className="text-[22px] leading-[40px] text-[var(--color-primary)] transition hover:underline lg:text-[clamp(22px,2.262cqw,38px)]"
              href="/services"
            >
              View All →
            </Link> */}
          </div>
        ) : null}
      </div>
    );
  }

  // Service page (bundle or single item): gallery + details, then quotation rules.
  const quotationRules = buildQuotationRules(product);
  const requestQuoteClassName =
    "flex h-[clamp(44px,3.33cqw,56px)] w-full items-center justify-center rounded-[10px] bg-[var(--color-primary)] text-[clamp(16px,1.667cqw,28px)] font-medium text-white transition hover:bg-[#9f4e2f]";

  return (
    <div className="mx-auto w-full max-w-[1680px] [container-type:inline-size]">
      <DetailBreadcrumb crumbs={crumbs} />

      <div className="mt-6 flex flex-col gap-6 lg:mt-[2.4cqw] lg:flex-row lg:gap-[3.9cqw]">
        <div className="lg:w-[57.7cqw] lg:shrink-0">
          <DetailGallery images={galleryImages} name={product.name} />
        </div>

        <div className="min-w-0 lg:flex-1">
          {titleBlock}

          {otherServices.length > 0 ? (
            <>
              <h2 className="mt-8 font-serif text-[clamp(22px,2.262cqw,38px)] leading-[1.2] text-black lg:mt-[1.8cqw]">
                Other Services
              </h2>
              <ul className="mt-4 grid grid-cols-2 gap-3 lg:mt-[1.2cqw] lg:gap-[1.2cqw]">
                {otherServices.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center gap-1 rounded-[10px] bg-[#ebe6dd] px-3 py-2 text-[clamp(13px,1.55cqw,26px)] leading-[1.2] text-[#717171] lg:px-[1.2cqw] lg:py-[0.9cqw]"
                  >
                    <span aria-hidden="true" className="text-[var(--color-primary)]">
                      ✓
                    </span>
                    {item.name}
                  </li>
                ))}
              </ul>
            </>
          ) : null}

          <Link
            className={`${requestQuoteClassName} mt-8 max-lg:hidden lg:mt-[2cqw]`}
            href={quoteHref}
          >
            Request a Quote →
          </Link>
        </div>
      </div>

      <section className="mt-10 lg:mt-[4.5cqw]">
        <h2 className="font-serif text-[clamp(24px,2.62cqw,44px)] leading-[1.3] text-black">
          Quotation Rules
        </h2>
        <dl className="mt-4 grid gap-5 rounded-[20px] bg-[#ebe6dd] p-5 sm:grid-cols-2 lg:mt-[1cqw] lg:grid-cols-4 lg:gap-0 lg:px-0 lg:py-[1.6cqw]">
          {quotationRules.map((rule) => (
            <div
              key={rule.label}
              className="lg:border-l lg:border-black/15 lg:px-[2.4cqw] lg:first:border-l-0"
            >
              <dt className="text-[clamp(15px,1.55cqw,26px)] font-medium leading-[1.3] text-black">
                {rule.label}
              </dt>
              <dd className="text-[clamp(13px,1.3cqw,22px)] leading-[1.4] text-[#717171]">
                {rule.value}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <Link className={`${requestQuoteClassName} mt-6 lg:hidden`} href={quoteHref}>
        Request a Quote →
      </Link>
    </div>
  );
}
