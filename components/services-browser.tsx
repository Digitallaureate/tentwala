"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
  customer_selectable: boolean;
  search_words: string;
  tier_minimums: Partial<Record<BudgetTierKey, number>>;
};

type FilterOption = { value: string; label: string };

// "services" lists the event types. "search" lists every customer-selectable
// product. Both filter the budget with the quotation form's tiers.
export type BrowserMode = "services" | "search";

// Same tiers as the quotation form (Utsav, Bhavya, Shaahi).
const budgetTierKeys: BudgetTierKey[] = ["low", "medium", "high"];

const tierOptions: FilterOption[] = budgetTierKeys.map((key) => ({
  value: key,
  label: getBudgetLabel(key),
}));

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

function toggleValue(values: string[], value: string) {
  return values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value];
}

// Dropdown with checkboxes, so several options can be picked at once.
function MultiSelect({
  disabled = false,
  label,
  onChange,
  options,
  selected,
}: {
  disabled?: boolean;
  label: string;
  onChange: (next: string[]) => void;
  options: FilterOption[];
  selected: string[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={rootRef}>
      <button
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={label}
        className={`${controlClassName} flex cursor-pointer items-center justify-between gap-2 text-left disabled:cursor-not-allowed disabled:opacity-60 ${
          selected.length > 0 ? "" : "text-[#717171]"
        }`}
        disabled={disabled}
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        <span className="truncate">
          {label}
          {selected.length > 0 ? ` (${selected.length})` : ""}
        </span>
        <svg
          aria-hidden="true"
          className={`h-3 w-3 shrink-0 text-black transition ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="currentColor"
          viewBox="0 0 12 12"
        >
          <path d="M2 4l4 4 4-4z" />
        </svg>
      </button>

      {isOpen ? (
        <ul
          aria-multiselectable="true"
          className="absolute left-0 right-0 z-30 mt-2 min-w-[11rem] rounded-[10px] bg-white py-2 shadow-[0_8px_24px_rgba(0,0,0,0.14)]"
          role="listbox"
        >
          {options.map((option) => {
            const isChecked = selected.includes(option.value);

            return (
              <li key={option.value}>
                <label className="flex cursor-pointer items-center gap-3 px-4 py-2 text-[clamp(13px,0.85cqw,15px)] text-[var(--color-primary)] transition hover:bg-[var(--color-gold-pale)]">
                  <input
                    checked={isChecked}
                    className="h-4 w-4 shrink-0 accent-[var(--color-primary)]"
                    onChange={() => onChange(toggleValue(selected, option.value))}
                    type="checkbox"
                  />
                  {option.label}
                </label>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

export function ServicesBrowser({
  initialCategorySlug = "",
  initialQuery = "",
  mode = "services",
}: {
  initialCategorySlug?: string;
  initialQuery?: string;
  mode?: BrowserMode;
}) {
  const [categories, setCategories] = useState<CategoryFilter[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [selectedSlug, setSelectedSlug] = useState(initialCategorySlug);
  const [searchText, setSearchText] = useState(initialQuery);
  const [locations, setLocations] = useState<string[]>([]);
  const [budgets, setBudgets] = useState<string[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const isSearch = mode === "search";

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
    const servicesQuery = isSearch
      ? query(productsRef, where("is_active", "==", true))
      : query(
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
              const tags = Array.isArray(data.search_tags)
                ? data.search_tags.map((tag) => String(tag))
                : [];

              return {
                ...toProductCardData(entry.id, data),
                category_ids: Array.isArray(data.category_ids)
                  ? data.category_ids.map((item) => String(item))
                  : [],
                customer_selectable:
                  typeof data.customer_selectable === "boolean"
                    ? data.customer_selectable
                    : true,
                search_words: [
                  String(data.name ?? ""),
                  String(data.short_description ?? ""),
                  String(data.search_text ?? ""),
                  String(data.item_type ?? ""),
                  String(data.service_group ?? ""),
                  String(data.highlight_text ?? ""),
                  ...(Array.isArray(data.service_cities)
                    ? data.service_cities.map((city) => String(city))
                    : []),
                  ...tags,
                ]
                  .join(" ")
                  .toLowerCase(),
                tier_minimums: toTierMinimums(data.price_tiers),
              };
            })
            .filter((service) => service.customer_selectable)
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
  }, [isSearch]);

  // Keep the filters in the address so a view can be shared.
  function syncUrl(changes: Record<string, string>) {
    const url = new URL(window.location.href);

    for (const [key, value] of Object.entries(changes)) {
      if (value) {
        url.searchParams.set(key, value);
      } else {
        url.searchParams.delete(key);
      }
    }

    window.history.replaceState(null, "", url);
  }

  function selectCategory(slug: string) {
    setSelectedSlug(slug);
    setShowAll(false);
    syncUrl({ category: slug });
  }

  const locationOptions = useMemo<FilterOption[]>(
    () =>
      Array.from(new Set(services.flatMap((service) => service.service_cities)))
        .sort((a, b) => a.localeCompare(b))
        .map((city) => ({ value: city, label: city })),
    [services]
  );

  const selectedCategory = categories.find(
    (category) => category.slug === selectedSlug
  );

  const visibleServices = useMemo(() => {
    const tokens = searchText.trim().toLowerCase().split(/\s+/).filter(Boolean);

    return services
      .filter((service) =>
        selectedCategory
          ? service.category_ids.includes(selectedCategory.id)
          : true
      )
      .filter((service) =>
        locations.length > 0
          ? service.service_cities.some((city) => locations.includes(city))
          : true
      )
      .filter((service) => {
        if (budgets.length === 0) {
          return true;
        }

        return budgets.some(
          (tier) => typeof service.tier_minimums[tier as BudgetTierKey] === "number"
        );
      })
      .filter((service) =>
        tokens.every((token) => service.search_words.includes(token))
      )
      .map((service) => {
        if (budgets.length === 0) {
          return service;
        }

        // With budget tiers chosen, show the lowest price among those tiers.
        const prices = budgets
          .map((tier) => service.tier_minimums[tier as BudgetTierKey])
          .filter((price): price is number => typeof price === "number");

        return { ...service, starting_price: Math.min(...prices) };
      });
  }, [services, selectedCategory, locations, budgets, searchText]);

  const shownServices = showAll
    ? visibleServices
    : visibleServices.slice(0, INITIAL_VISIBLE_COUNT);
  const hasActiveFilters = Boolean(
    selectedSlug || searchText || locations.length > 0 || budgets.length > 0
  );

  function clearFilters() {
    setSearchText("");
    setLocations([]);
    setBudgets([]);
    setSelectedSlug("");
    setShowAll(false);
    syncUrl({ category: "", ...(isSearch ? { q: "" } : {}) });
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
            className={`${controlClassName} pl-11 ${
              searchText ? "ring-1 ring-[var(--color-gold)]" : ""
            }`}
            onChange={(event) => {
              setSearchText(event.target.value);
              setShowAll(false);

              if (isSearch) {
                syncUrl({ q: event.target.value.trim() });
              }
            }}
            placeholder="Search for decoration, corporate event, catering etc.,"
            type="search"
            value={searchText}
          />
        </div>

        <div className="lg:w-[21.9cqw] lg:shrink-0">
          <MultiSelect
            disabled={locationOptions.length === 0}
            label="Event Location"
            onChange={(next) => {
              setLocations(next);
              setShowAll(false);
            }}
            options={locationOptions}
            selected={locations}
          />
        </div>

        <div className="lg:w-[21.1cqw] lg:shrink-0">
          <MultiSelect
            label="Budget Range"
            onChange={(next) => {
              setBudgets(next);
              setShowAll(false);
            }}
            options={tierOptions}
            selected={budgets}
          />
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
            <p>
              {searchText.trim()
                ? `No services match “${searchText.trim()}”.`
                : "No services match your filters."}
            </p>
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
