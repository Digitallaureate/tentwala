import Link from "next/link";

// Shared by the home "Featured Services" section and the category detail page.
// Display fields beyond name/slug are optional; each one is hidden when missing.
export type ProductCardData = {
  id: string;
  name: string;
  slug: string;
  short_description: string;
  thumbnail_url?: string;
  service_group?: string;
  sort_order: number;
  card_tag?: string;
  is_top_rated: boolean;
  service_cities: string[];
  highlight_text?: string;
  starting_price?: number;
  price_unit?: string;
};

// Units shown after the price ("₹650/plate"); other pricing models show none.
const priceUnitByPricingModel: Record<string, string> = {
  per_sq_ft: "sq ft",
  per_person: "person",
  per_plate_set: "plate",
  per_hour: "hour",
  per_day: "day",
  per_trip: "trip",
  per_vehicle: "vehicle",
};

// Lowest `minimum_price` across the tiers; 0 or negative prices are ignored.
export function getMinimumListedPrice(priceTiers: unknown) {
  if (!priceTiers || typeof priceTiers !== "object") {
    return undefined;
  }

  const prices = Object.values(priceTiers as Record<string, unknown>)
    .map((tier) => (tier as { minimum_price?: unknown } | null)?.minimum_price)
    .filter(
      (price): price is number => typeof price === "number" && price > 0
    );

  return prices.length > 0 ? Math.min(...prices) : undefined;
}

// Maps a Firestore `products` document to the card's data.
export function toProductCardData(
  id: string,
  data: Record<string, unknown>
): ProductCardData {
  return {
    id,
    name: String(data.name ?? ""),
    slug: String(data.slug ?? id),
    short_description: String(data.short_description ?? ""),
    thumbnail_url: data.thumbnail_url ? String(data.thumbnail_url) : undefined,
    service_group: data.service_group ? String(data.service_group) : undefined,
    sort_order: Number(data.sort_order ?? 0),
    card_tag: data.card_tag ? String(data.card_tag) : undefined,
    is_top_rated: data.is_top_rated === true,
    service_cities: Array.isArray(data.service_cities)
      ? data.service_cities.map((city) => String(city))
      : [],
    highlight_text: data.highlight_text ? String(data.highlight_text) : undefined,
    starting_price: getMinimumListedPrice(data.price_tiers),
    price_unit: priceUnitByPricingModel[String(data.pricing_model)],
  };
}

export function formatPrice(value: number) {
  return `₹${value.toLocaleString("en-IN")}`;
}

function toTitleCase(value: string) {
  const text = value.replaceAll("-", " ").replaceAll("_", " ");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export const productCardGridClassName =
  "grid gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-x-[43px] lg:gap-y-[60px]";

export const productCardClassName =
  "overflow-hidden rounded-[20px] bg-white shadow-[0_6px_24px_rgba(0,0,0,0.08)]";

// Sizes are Figma values (530px card) scaled by card width:
// e.g. 28px title = 5.28cqw. Each card is a size container for that.
export function ProductCard({ product }: { product: ProductCardData }) {
  const tag =
    product.card_tag ??
    (product.service_group ? toTitleCase(product.service_group) : "");

  return (
    <div className="[container-type:inline-size]">
      <article className={productCardClassName}>
        <div className="relative">
          <Link href={`/products/${product.slug}`}>
            {product.thumbnail_url ? (
              <img
                alt={product.name}
                className="aspect-[530/340] w-full object-cover"
                src={product.thumbnail_url}
              />
            ) : (
              <div className="aspect-[530/340] w-full bg-[linear-gradient(135deg,#efe9dd_0%,#faf7f2_52%,#e9dcc0_100%)]" />
            )}
          </Link>

          <div className="pointer-events-none absolute left-[4.5cqw] top-[3cqw] flex gap-[1cqw]">
            {tag ? (
              <span className="rounded-full bg-[#e5e3df] px-[3.77cqw] py-[0.75cqw] text-[clamp(11px,3.77cqw,20px)] leading-[1.5] text-black">
                {tag}
              </span>
            ) : null}
            {product.is_top_rated ? (
              <span className="rounded-full bg-[var(--color-gold)] px-[3.77cqw] py-[0.75cqw] text-[clamp(11px,3.77cqw,20px)] leading-[1.5] text-white">
                Top Rated
              </span>
            ) : null}
          </div>
        </div>

        <div className="px-[4.5cqw] pb-[4cqw] pt-[2.45cqw]">
          <div className="flex items-start justify-between gap-[3cqw]">
            <div className="min-w-0">
              <h3
                className="truncate font-serif text-[clamp(16px,5.28cqw,28px)] font-bold leading-[1.2] text-black"
                title={product.name}
              >
                <Link href={`/products/${product.slug}`}>{product.name}</Link>
              </h3>
              {product.service_cities.length > 0 ? (
                <p className="truncate text-[clamp(12px,4.15cqw,22px)] leading-[1.36] text-[var(--color-gold)]">
                  {product.service_cities.join(", ")}
                </p>
              ) : null}
              <p className="line-clamp-1 text-[clamp(11px,3.77cqw,20px)] leading-[1.5] text-[#a7a3a0]">
                {product.highlight_text ?? product.short_description}
              </p>
            </div>

            <div className="mr-[3.6cqw] shrink-0 text-right">
              <p className="text-[clamp(11px,3.77cqw,20px)] leading-[1.5] text-[#a7a3a0]">
                Starting From
              </p>
              <p className="font-serif text-[clamp(18px,6.04cqw,32px)] font-bold leading-none text-black">
                {typeof product.starting_price === "number" ? (
                  <>
                    {formatPrice(product.starting_price)}
                    {product.price_unit ? (
                      <span className="text-[0.6em] font-normal">
                        /{product.price_unit}
                      </span>
                    ) : null}
                  </>
                ) : (
                  <span className="text-[0.75em]">On request</span>
                )}
              </p>
            </div>
          </div>

          <div className="mt-[5.5cqw] flex flex-row-reverse justify-end gap-[6.2cqw] lg:flex-row">
            <Link
              className="inline-flex h-[clamp(36px,9.06cqw,48px)] w-[41.5cqw] items-center justify-center rounded-[15px] border border-black bg-white text-[clamp(13px,4.15cqw,22px)] font-medium text-black transition hover:bg-black/5"
              href={`/products/${product.slug}`}
            >
              View Details
            </Link>
            <Link
              className="inline-flex h-[clamp(36px,9.06cqw,48px)] w-[41.5cqw] items-center justify-center rounded-[15px] bg-[var(--color-primary)] text-[clamp(13px,4.15cqw,22px)] font-medium text-white transition hover:bg-[#9f4e2f]"
              href="/contact"
            >
              Get Quote
            </Link>
          </div>
        </div>
      </article>
    </div>
  );
}
