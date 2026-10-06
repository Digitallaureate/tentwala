"use client";

import { useEffect, useMemo, useState } from "react";
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
import { BudgetTierKey, getBudgetLabel } from "@/lib/quotation";

type CategoryFilter = { id: string; name: string; slug: string };

type ServiceItem = ProductCardData & {
  category_ids: string[];
  search_text: string;
  tier_minimums: Partial<Record<BudgetTierKey, number>>;
};

// Same tiers as the quotation form ("Basic", "Standard", "Premium").
const budgetTierKeys: BudgetTierKey[] = ["low", "medium", "high"];

// Cards shown before "View All →" reveals the rest (3 rows of 3).
const INITIAL_VISIBLE_COUNT = 9;

const categoriesRef = collection(db, "product_categories");
const productsRef = collection(db, "products");

const controlClassName =
  "h-[clamp(44px,2.86cqw,48px)] w-full rounded-[10px] bg-white px-4 text-[clamp(14px,0.95cqw,16px)] text-black shadow-[0_2px_10px_rgba(0,0,0,0.06)] outline-none transition placeholder:text-[#a7a3a0] focus:ring-2 focus:ring-[var(--color-gold)]/50";

function toTierMinimums(priceTiers: unknown) {
  const result: ServiceItem["tier_minimums"] = {};

  if (!priceTiers || typeof priceTiers !== "object") {
    return result;
  }

  for (const key of budgetTierKeys) {
    const minimum = (priceTiers as Record<string, { minimum_price?: unknown }>)[
      key
    ]?.minimum_price;

    if (typeof minimum === "number" && minimum > 0) {
      result[key] = minimum;
    }
  }

  return result;
}

function SelectControl({
  children,
  label,
  onChange,
  disabled = false,
  value,
}: {
  children: React.ReactNode;
  label: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  value: string;
}) {
  return (
    <div className="relative">
      <select
        aria-label={label}
        className={`${controlClassName} cursor-pointer appearance-none pr-10 disabled:cursor-not-allowed disabled:opacity-60 ${
          value ? "" : "text-[#717171]"
        }`}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {children}
      </select>
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute right-4 top-1/2 h-3 w-3 -translate-y-1/2 text-black"
        fill="currentColor"
        viewBox="0 0 12 12"
      >
        <path d="M2 4l4 4 4-4z" />
      </svg>
    </div>
  );
}

export function ServicesBrowser({
  initialCategorySlug = "",
}: {
  initialCategorySlug?: string;
}) {
  const [categories, setCategories] = useState<CategoryFilter[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [selectedSlug, setSelectedSlug] = useState(initialCategorySlug);
  const [searchText, setSearchText] = useState("");
  const [location, setLocation] = useState("");
  const [budget, setBudget] = useState<BudgetTierKey | "">("");
  const [showAll, setShowAll] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const categoriesQuery = query(
      categoriesRef,
      where("is_active", "==", true),
      orderBy("sort_order", "asc")
    );

    return onSnapshot(
      categoriesQuery,
      (snapshot) => {
        setCategories(
          snapshot.docs.map((entry) => ({
            id: entry.id,
            name: String(entry.data().name ?? ""),
            slug: String(entry.data().slug ?? entry.id),
          }))
        );
      },
      (snapshotError) => {
        console.error(snapshotError);
        setError("Could not load categories from Firestore.");
      }
    );
  }, []);

  useEffect(() => {
    // Equality-only filters (no composite index needed); sorted below.
    const servicesQuery = query(
      productsRef,
      where("is_active", "==", true),
      where("node_type", "==", "event_type")
    );

    return onSnapshot(
      servicesQuery,
      (snapshot) => {
        setServices(
          snapshot.docs
            .map((entry): ServiceItem => {
              const data = entry.data();

              return {
                ...toProductCardData(entry.id, data),
                category_ids: Array.isArray(data.category_ids)
                  ? data.category_ids.map((item) => String(item))
                  : [],
                search_text: String(data.search_text ?? ""),
                tier_minimums: toTierMinimums(data.price_tiers),
              };
            })
            .sort((a, b) => a.sort_order - b.sort_order)
        );
        setError("");
        setIsLoading(false);
      },
      (snapshotError) => {
        console.error(snapshotError);
        setError(
          "Could not load services from Firestore. Check rules and indexes."
        );
        setIsLoading(false);
      }
    );
  }, []);

  function selectCategory(slug: string) {
    setSelectedSlug(slug);
    setShowAll(false);

    // Keep the filter in the address so a filtered view can be shared.
    const url = new URL(window.location.href);

    if (slug) {
      url.searchParams.set("category", slug);
    } else {
      url.searchParams.delete("category");
    }

    window.history.replaceState(null, "", url);
  }

  const locationOptions = useMemo(
    () =>
      Array.from(
        new Set(services.flatMap((service) => service.service_cities))
      ).sort((a, b) => a.localeCompare(b)),
    [services]
  );

  const selectedCategory = categories.find(
    (category) => category.slug === selectedSlug
  );

  const visibleServices = useMemo(() => {
    const needle = searchText.trim().toLowerCase();

    return services
      .filter((service) =>
        selectedCategory
          ? service.category_ids.includes(selectedCategory.id)
          : true
      )
      .filter((service) =>
        location ? service.service_cities.includes(location) : true
      )
      .filter((service) =>
        budget ? typeof service.tier_minimums[budget] === "number" : true
      )
      .filter((service) =>
        needle
          ? [
              service.name,
              service.short_description,
              service.service_group ?? "",
              service.highlight_text ?? "",
              service.service_cities.join(" "),
              service.search_text,
            ]
              .join(" ")
              .toLowerCase()
              .includes(needle)
          : true
      )
      .map((service) => ({
        ...service,
        // With a budget tier chosen, show that tier's starting price.
        starting_price: budget
          ? service.tier_minimums[budget]
          : service.starting_price,
      }));
  }, [services, selectedCategory, location, budget, searchText]);

  const shownServices = showAll
    ? visibleServices
    : visibleServices.slice(0, INITIAL_VISIBLE_COUNT);
  const hasActiveFilters = Boolean(
    selectedSlug || searchText || location || budget
  );

  function clearFilters() {
    setSearchText("");
    setLocation("");
    setBudget("");
    selectCategory("");
  }

  return (
    // Desktop sizes are Figma values (1920px frame, 1680px content) scaled by the
    // content width, e.g. 16px control text = 0.95cqw.
    <div className="[container-type:inline-size]">
      <div className="flex flex-col gap-3 lg:flex-row lg:gap-[1.9cqw]">
        <div className="relative lg:flex-1">
          <svg
            aria-hidden="true"
            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-black"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" strokeLinecap="round" />
          </svg>
          <input
            aria-label="Search services"
            className={`${controlClassName} pl-11`}
            onChange={(event) => {
              setSearchText(event.target.value);
              setShowAll(false);
            }}
            placeholder="Search for decoration, corporate event, catering etc.,"
            type="search"
            value={searchText}
          />
        </div>

        <div className="lg:w-[21.9cqw] lg:shrink-0">
          <SelectControl
            disabled={locationOptions.length === 0}
            label="Event Location"
            onChange={(value) => {
              setLocation(value);
              setShowAll(false);
            }}
            value={location}
          >
            <option value="">Event Location</option>
            {locationOptions.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </SelectControl>
        </div>

        <div className="lg:w-[21.1cqw] lg:shrink-0">
          <SelectControl
            label="Budget Range"
            onChange={(value) => {
              setBudget(value as BudgetTierKey | "");
              setShowAll(false);
            }}
            value={budget}
          >
            <option value="">Budget Range</option>
            {budgetTierKeys.map((key) => (
              <option key={key} value={key}>
                {getBudgetLabel(key)}
              </option>
            ))}
          </SelectControl>
        </div>
      </div>

      <div
        aria-label="Filter by category"
        className="-mx-5 mt-4 flex gap-2 overflow-x-auto px-5 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 lg:mt-[1.4cqw] lg:gap-[0.8cqw]"
        role="radiogroup"
      >
        {[{ id: "", name: "All", slug: "" }, ...categories].map((category) => {
          const isSelected = category.slug === selectedSlug;

          return (
            <button
              key={category.id || "all"}
              aria-checked={isSelected}
              className={`h-[clamp(34px,2.4cqw,40px)] shrink-0 rounded-full px-5 text-[clamp(13px,0.95cqw,16px)] shadow-[0_2px_10px_rgba(0,0,0,0.06)] transition lg:px-[1.5cqw] ${
                isSelected
                  ? "bg-[var(--color-primary)] text-white"
                  : "bg-white text-black hover:bg-[var(--color-gold-pale)]"
              }`}
              onClick={() => selectCategory(category.slug)}
              role="radio"
              type="button"
            >
              {category.name}
            </button>
          );
        })}
      </div>

      <div className="mt-8 lg:mt-[3.6cqw]">
        {error ? (
          <div className="rounded-[20px] border-2 border-red-200 bg-red-50 p-5 text-sm text-red-700">
            {error}
          </div>
        ) : isLoading ? (
          <div className={productCardGridClassName}>
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className={`${productCardClassName} aspect-[530/545] animate-pulse`}
              >
                <div className="h-[62%] bg-[#efe9dd]" />
              </div>
            ))}
          </div>
        ) : visibleServices.length === 0 ? (
          <div className="rounded-[20px] bg-white p-8 text-center text-[#717171] shadow-[0_6px_24px_rgba(0,0,0,0.08)]">
            <p>No services match your filters.</p>
            {hasActiveFilters ? (
              <button
                className="mt-3 text-[var(--color-primary)] underline"
                onClick={clearFilters}
                type="button"
              >
                Clear filters
              </button>
            ) : null}
          </div>
        ) : (
          <>
            <div className={productCardGridClassName}>
              {shownServices.map((service) => (
                <ProductCard key={service.id} product={service} />
              ))}
            </div>

            {!showAll && visibleServices.length > INITIAL_VISIBLE_COUNT ? (
              <div className="mt-10 flex justify-end lg:mt-[3.6cqw]">
                <button
                  className="text-[22px] leading-[40px] text-[var(--color-primary)] transition hover:underline lg:text-[clamp(22px,2.262cqw,38px)]"
                  onClick={() => setShowAll(true)}
                  type="button"
                >
                  View All →
                </button>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
