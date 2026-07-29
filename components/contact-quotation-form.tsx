"use client";

import { FormEvent, useEffect, useState } from "react";
import { addDoc, collection, onSnapshot, orderBy, query, serverTimestamp, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

type BudgetTierKey = "low" | "medium" | "high";

type CategoryOption = {
  id: string;
  name: string;
  short_description: string;
};

type ProductOption = {
  id: string;
  name: string;
  item_type: string;
  short_description: string;
  service_group?: string;
  pricing_model: string;
  price_tiers: {
    high?: PriceTier;
    low?: PriceTier;
    medium?: PriceTier;
  };
  quotation_config: {
    duration_label?: string;
    duration_required?: boolean;
    duration_unit?: string;
    manual_review_required?: boolean;
    minimum_duration?: number;
    minimum_quantity?: number;
    quantity_label?: string;
    quantity_required?: boolean;
    quantity_unit?: string;
  };
};

type PriceTier = {
  label: string;
  maximum_price: number;
  minimum_price: number;
};

type SelectedProductFormState = {
  duration: string;
  quantity: string;
  selected: boolean;
};

type RequestPayload = {
  budget_tier: BudgetTierKey;
  category_id: string;
  category_name: string;
  event_location: string;
  name: string;
  notes: string;
  phone_number: string;
  request_type: "quotation";
  selected_products: Array<{
    duration: number;
    estimated_maximum_price: number;
    estimated_minimum_price: number;
    item_type: string;
    pricing_model: string;
    product_id: string;
    product_name: string;
    quantity: number;
  }>;
};

const categoriesRef = collection(db, "product_categories");
const productsRef = collection(db, "products");
const quotationRequestsRef = collection(db, "quotation_requests");
const whatsappNumber = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "").replace(
  /\D/g,
  ""
);

function normalizeNumber(value: string, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function getBudgetLabel(tier: BudgetTierKey) {
  if (tier === "low") {
    return "Basic";
  }

  if (tier === "medium") {
    return "Standard";
  }

  return "Premium";
}

function buildWhatsAppMessage(payload: RequestPayload) {
  const productLines = payload.selected_products
    .map((product, index) => {
      const quantityText = `Quantity: ${product.quantity}`;
      const durationText = product.duration > 1 ? `, Duration: ${product.duration}` : "";

      return `${index + 1}. ${product.product_name}
   Type: ${product.item_type}
   ${quantityText}${durationText}
   Estimate: Rs. ${product.estimated_minimum_price} - Rs. ${product.estimated_maximum_price}`;
    })
    .join("\n");

  return [
    "New quotation request",
    "",
    `Name: ${payload.name}`,
    `Phone: ${payload.phone_number}`,
    `Location: ${payload.event_location}`,
    `Category: ${payload.category_name}`,
    `Budget tier: ${getBudgetLabel(payload.budget_tier)}`,
    "",
    "Selected products:",
    productLines,
    "",
    `Total estimate: Rs. ${payload.selected_products.reduce(
      (sum, product) => sum + product.estimated_minimum_price,
      0
    )} - Rs. ${payload.selected_products.reduce(
      (sum, product) => sum + product.estimated_maximum_price,
      0
    )}`,
    payload.notes ? "" : null,
    payload.notes ? `Notes: ${payload.notes}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

function getProductEstimate(
  product: ProductOption,
  budgetTier: BudgetTierKey,
  state: SelectedProductFormState
) {
  const tier = product.price_tiers[budgetTier];

  if (!tier) {
    return null;
  }

  const quantity = product.quotation_config.quantity_required
    ? normalizeNumber(state.quantity, product.quotation_config.minimum_quantity ?? 1)
    : 1;
  const duration = product.quotation_config.duration_required
    ? normalizeNumber(state.duration, product.quotation_config.minimum_duration ?? 1)
    : 1;

  return {
    duration,
    maximum: tier.maximum_price * quantity * duration,
    minimum: tier.minimum_price * quantity * duration,
    quantity,
  };
}

export function ContactQuotationForm({
  initialCategoryId = "",
  initialProductId = "",
}: {
  initialCategoryId?: string;
  initialProductId?: string;
}) {
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState(initialCategoryId);
  const [budgetTier, setBudgetTier] = useState<BudgetTierKey>("medium");
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<Record<string, SelectedProductFormState>>({});
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [isLoadingProducts, setIsLoadingProducts] = useState(
    Boolean(initialCategoryId)
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const categoriesQuery = query(
      categoriesRef,
      where("is_active", "==", true),
      orderBy("sort_order", "asc")
    );

    const unsubscribe = onSnapshot(
      categoriesQuery,
      (snapshot) => {
        setCategories(
          snapshot.docs.map((entry) => {
            const data = entry.data();

            return {
              id: entry.id,
              name: String(data.name ?? ""),
              short_description: String(data.short_description ?? ""),
            };
          })
        );
        setIsLoadingCategories(false);
      },
      (snapshotError) => {
        console.error(snapshotError);
        setError(
          "Could not load categories for the quotation form. Check Firestore rules and indexes."
        );
        setIsLoadingCategories(false);
      }
    );

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!selectedCategoryId) {
      return;
    }

    const productsQuery = query(
      productsRef,
      where("is_active", "==", true),
      where("category_ids", "array-contains", selectedCategoryId),
      orderBy("sort_order", "asc")
    );

    const unsubscribe = onSnapshot(
      productsQuery,
      (snapshot) => {
        const nextProducts = snapshot.docs.map((entry) => {
          const data = entry.data();

          return {
            id: entry.id,
            name: String(data.name ?? ""),
            item_type: String(data.item_type ?? ""),
            short_description: String(data.short_description ?? ""),
            service_group: data.service_group
              ? String(data.service_group)
              : undefined,
            pricing_model: String(data.pricing_model ?? ""),
            price_tiers: data.price_tiers as ProductOption["price_tiers"],
            quotation_config:
              data.quotation_config as ProductOption["quotation_config"],
          };
        });

        setProducts(nextProducts);
        setSelectedProducts((current) => {
          const nextState: Record<string, SelectedProductFormState> = {};

          for (const product of nextProducts) {
            const existing = current[product.id];
            const shouldPreselect = product.id === initialProductId && !existing;

            nextState[product.id] = existing ?? {
              duration: product.quotation_config.minimum_duration
                ? String(product.quotation_config.minimum_duration)
                : "1",
              quantity: product.quotation_config.minimum_quantity
                ? String(product.quotation_config.minimum_quantity)
                : "1",
              selected: shouldPreselect,
            };
          }

          return nextState;
        });
        setError("");
        setIsLoadingProducts(false);
      },
      (snapshotError) => {
        console.error(snapshotError);
        setError(
          "Could not load products for the selected category. Check Firestore rules and indexes."
        );
        setIsLoadingProducts(false);
      }
    );

    return unsubscribe;
  }, [initialProductId, selectedCategoryId]);

  function handleCategoryChange(nextCategoryId: string) {
    setIsLoadingProducts(Boolean(nextCategoryId));
    setSelectedCategoryId(nextCategoryId);
    setProducts([]);
    setSelectedProducts({});
    setSuccessMessage("");
    setError("");
  }

  function handleProductToggle(productId: string) {
    setSelectedProducts((current) => {
      const existing = current[productId];

      return {
        ...current,
        [productId]: {
          duration: existing?.duration ?? "1",
          quantity: existing?.quantity ?? "1",
          selected: !existing?.selected,
        },
      };
    });
  }

  function handleProductFieldChange(
    productId: string,
    field: "duration" | "quantity",
    value: string
  ) {
    setSelectedProducts((current) => ({
      ...current,
      [productId]: {
        duration: current[productId]?.duration ?? "1",
        quantity: current[productId]?.quantity ?? "1",
        selected: current[productId]?.selected ?? false,
        [field]: value,
      },
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const selectedCategory = categories.find(
      (category) => category.id === selectedCategoryId
    );

    if (!selectedCategory) {
      setError("Please select a category before submitting.");
      return;
    }

    const chosenProducts = products
      .filter((product) => selectedProducts[product.id]?.selected)
      .map((product) => {
        const state = selectedProducts[product.id];
        const estimate = getProductEstimate(product, budgetTier, state);

        if (!estimate) {
          return null;
        }

        return {
          duration: estimate.duration,
          estimated_maximum_price: estimate.maximum,
          estimated_minimum_price: estimate.minimum,
          item_type: product.item_type,
          pricing_model: product.pricing_model,
          product_id: product.id,
          product_name: product.name,
          quantity: estimate.quantity,
        };
      })
      .filter(Boolean) as RequestPayload["selected_products"];

    if (chosenProducts.length === 0) {
      setError("Please select at least one product or service.");
      return;
    }

    if (!whatsappNumber) {
      setError(
        "WhatsApp number is not configured yet. Add NEXT_PUBLIC_WHATSAPP_NUMBER to your .env.local file."
      );
      return;
    }

    setIsSubmitting(true);
    setError("");
    setSuccessMessage("");

    try {
      const payload: RequestPayload = {
        budget_tier: budgetTier,
        category_id: selectedCategory.id,
        category_name: selectedCategory.name,
        event_location: eventLocation.trim(),
        name: name.trim(),
        notes: notes.trim(),
        phone_number: phoneNumber.trim(),
        request_type: "quotation",
        selected_products: chosenProducts,
      };

      await addDoc(quotationRequestsRef, {
        ...payload,
        created_at: serverTimestamp(),
      });

      const whatsappMessage = buildWhatsAppMessage(payload);
      const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
        whatsappMessage
      )}`;

      const popup = window.open(whatsappUrl, "_blank", "noopener,noreferrer");

      if (!popup) {
        window.location.href = whatsappUrl;
      }

      setSuccessMessage(
        "Your quotation request has been submitted and WhatsApp has been opened with the same request details."
      );
      setName("");
      setPhoneNumber("");
      setEventLocation("");
      setNotes("");
      setBudgetTier("medium");
      setSelectedProducts((current) => {
        const resetState: Record<string, SelectedProductFormState> = {};

        for (const product of products) {
          const existing = current[product.id];

          resetState[product.id] = {
            duration: existing?.duration ?? "1",
            quantity: existing?.quantity ?? "1",
            selected: false,
          };
        }

        return resetState;
      });
    } catch (submitError) {
      console.error(submitError);
      setError("Could not submit the quotation request to Firestore.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const estimatedTotals = products.reduce(
    (totals, product) => {
      const state = selectedProducts[product.id];

      if (!state?.selected) {
        return totals;
      }

      const estimate = getProductEstimate(product, budgetTier, state);

      if (!estimate) {
        return totals;
      }

      return {
        maximum: totals.maximum + estimate.maximum,
        minimum: totals.minimum + estimate.minimum,
      };
    },
    { maximum: 0, minimum: 0 }
  );

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border-2 border-zinc-300 bg-white p-6 sm:p-8">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">
            Contact / Quotation
          </p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Request a custom quotation
          </h1>
          <p className="max-w-3xl text-base leading-7 text-zinc-600">
            Choose a category, select the products or services you need, and
            we&apos;ll use your preferred budget tier to estimate the request.
          </p>
        </div>
      </section>

      <form
        className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]"
        onSubmit={handleSubmit}
      >
        <section className="rounded-[2rem] border-2 border-zinc-300 bg-white p-6 sm:p-8">
          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-900" htmlFor="name">
                Name
              </label>
              <input
                className="h-12 w-full rounded-2xl border-2 border-zinc-300 bg-zinc-50 px-4 text-sm outline-none transition focus:border-zinc-500"
                id="name"
                onChange={(event) => setName(event.target.value)}
                placeholder="Your name"
                required
                value={name}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-900" htmlFor="phone">
                Phone number
              </label>
              <input
                className="h-12 w-full rounded-2xl border-2 border-zinc-300 bg-zinc-50 px-4 text-sm outline-none transition focus:border-zinc-500"
                id="phone"
                onChange={(event) => setPhoneNumber(event.target.value)}
                placeholder="Phone number"
                required
                value={phoneNumber}
              />
            </div>

            <div className="space-y-2">
              <label
                className="text-sm font-semibold text-zinc-900"
                htmlFor="location"
              >
                Event location
              </label>
              <input
                className="h-12 w-full rounded-2xl border-2 border-zinc-300 bg-zinc-50 px-4 text-sm outline-none transition focus:border-zinc-500"
                id="location"
                onChange={(event) => setEventLocation(event.target.value)}
                placeholder="City or venue location"
                required
                value={eventLocation}
              />
            </div>

            <div className="space-y-2">
              <label
                className="text-sm font-semibold text-zinc-900"
                htmlFor="category"
              >
                Category
              </label>
              <select
                className="h-12 w-full rounded-2xl border-2 border-zinc-300 bg-zinc-50 px-4 text-sm outline-none transition focus:border-zinc-500"
                disabled={isLoadingCategories}
                id="category"
                onChange={(event) => handleCategoryChange(event.target.value)}
                required
                value={selectedCategoryId}
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-900" htmlFor="budget">
                Budget tier
              </label>
              <select
                className="h-12 w-full rounded-2xl border-2 border-zinc-300 bg-zinc-50 px-4 text-sm outline-none transition focus:border-zinc-500"
                id="budget"
                onChange={(event) =>
                  setBudgetTier(event.target.value as BudgetTierKey)
                }
                value={budgetTier}
              >
                <option value="low">Basic</option>
                <option value="medium">Standard</option>
                <option value="high">Premium</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-900" htmlFor="notes">
                Additional notes
              </label>
              <textarea
                className="min-h-28 w-full rounded-2xl border-2 border-zinc-300 bg-zinc-50 px-4 py-3 text-sm outline-none transition focus:border-zinc-500"
                id="notes"
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Tell us about your event, guest count, timing, or anything else."
                value={notes}
              />
            </div>

            <div className="rounded-[1.5rem] border-2 border-zinc-300 bg-zinc-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
                Estimate Summary
              </p>
              <p className="mt-3 text-sm text-zinc-600">
                Budget tier:{" "}
                <span className="font-semibold text-zinc-900">
                  {getBudgetLabel(budgetTier)}
                </span>
              </p>
              <p className="mt-2 text-lg font-semibold text-zinc-900">
                Rs. {estimatedTotals.minimum} - Rs. {estimatedTotals.maximum}
              </p>
            </div>

            {successMessage ? (
              <p className="rounded-[1.25rem] bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {successMessage}
              </p>
            ) : null}

            {error ? (
              <p className="rounded-[1.25rem] bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </p>
            ) : null}

            <button
              className="h-12 rounded-full border-2 border-zinc-900 bg-zinc-900 px-6 text-sm font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:border-zinc-300 disabled:bg-zinc-300"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? "Submitting request..." : "Submit quotation request"}
            </button>
          </div>
        </section>

        <section className="rounded-[2rem] border-2 border-zinc-300 bg-white p-6 sm:p-8">
          <div className="mb-5 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">
              Product Selection
            </p>
            <p className="text-base leading-7 text-zinc-600">
              Choose the products or services you want to include in the request.
              Quantity and duration fields appear only where required.
            </p>
          </div>

          {!selectedCategoryId ? (
            <div className="rounded-[1.5rem] border-2 border-zinc-300 bg-zinc-50 p-5 text-sm text-zinc-600">
              Select a category first to load its products.
            </div>
          ) : isLoadingProducts ? (
            <div className="grid gap-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <article
                  key={index}
                  className="rounded-[1.5rem] border-2 border-zinc-300 bg-zinc-50 p-5"
                >
                  <div className="space-y-3">
                    <div className="h-5 w-40 rounded-full bg-zinc-200" />
                    <div className="h-3 w-full rounded-full bg-zinc-200" />
                    <div className="h-3 w-2/3 rounded-full bg-zinc-200" />
                  </div>
                </article>
              ))}
            </div>
          ) : products.length > 0 ? (
            <div className="grid gap-4">
              {products.map((product) => {
                const productState = selectedProducts[product.id] ?? {
                  duration: product.quotation_config.minimum_duration
                    ? String(product.quotation_config.minimum_duration)
                    : "1",
                  quantity: product.quotation_config.minimum_quantity
                    ? String(product.quotation_config.minimum_quantity)
                    : "1",
                  selected: false,
                };
                const estimate = getProductEstimate(
                  product,
                  budgetTier,
                  productState
                );
                const budgetConfig = product.price_tiers[budgetTier];

                return (
                  <article
                    key={product.id}
                    className="rounded-[1.5rem] border-2 border-zinc-300 bg-zinc-50 p-5"
                  >
                    <div className="space-y-4">
                      <label className="flex items-start gap-3">
                        <input
                          checked={productState.selected}
                          className="mt-1 h-4 w-4"
                          onChange={() => handleProductToggle(product.id)}
                          type="checkbox"
                        />
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-base font-semibold text-zinc-900">
                              {product.name}
                            </p>
                            <span className="rounded-full border border-zinc-300 bg-white px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-zinc-500">
                              {product.item_type.replaceAll("_", " ")}
                            </span>
                            {product.service_group ? (
                              <span className="rounded-full border border-zinc-300 bg-white px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-zinc-500">
                                {product.service_group.replaceAll("-", " ")}
                              </span>
                            ) : null}
                          </div>
                          <p className="text-sm text-zinc-600">
                            {product.short_description}
                          </p>
                          {budgetConfig ? (
                            <p className="text-sm font-medium text-zinc-700">
                              {budgetConfig.label}: Rs. {budgetConfig.minimum_price} - Rs.{" "}
                              {budgetConfig.maximum_price}
                            </p>
                          ) : null}
                        </div>
                      </label>

                      {productState.selected ? (
                        <div className="grid gap-4 rounded-[1.25rem] border-2 border-zinc-300 bg-white p-4 md:grid-cols-2">
                          {product.quotation_config.quantity_required ? (
                            <div className="space-y-2">
                              <label className="text-sm font-semibold text-zinc-900">
                                {product.quotation_config.quantity_label ??
                                  "Quantity required"}
                              </label>
                              <input
                                className="h-11 w-full rounded-2xl border-2 border-zinc-300 bg-zinc-50 px-4 text-sm outline-none transition focus:border-zinc-500"
                                min={product.quotation_config.minimum_quantity ?? 1}
                                onChange={(event) =>
                                  handleProductFieldChange(
                                    product.id,
                                    "quantity",
                                    event.target.value
                                  )
                                }
                                type="number"
                                value={productState.quantity}
                              />
                            </div>
                          ) : null}

                          {product.quotation_config.duration_required ? (
                            <div className="space-y-2">
                              <label className="text-sm font-semibold text-zinc-900">
                                {product.quotation_config.duration_label ??
                                  "Duration required"}
                              </label>
                              <input
                                className="h-11 w-full rounded-2xl border-2 border-zinc-300 bg-zinc-50 px-4 text-sm outline-none transition focus:border-zinc-500"
                                min={product.quotation_config.minimum_duration ?? 1}
                                onChange={(event) =>
                                  handleProductFieldChange(
                                    product.id,
                                    "duration",
                                    event.target.value
                                  )
                                }
                                type="number"
                                value={productState.duration}
                              />
                            </div>
                          ) : null}

                          <div className="space-y-2 md:col-span-2">
                            <p className="text-sm font-semibold text-zinc-900">
                              Estimated price
                            </p>
                            <p className="text-sm text-zinc-600">
                              {estimate
                                ? `Rs. ${estimate.minimum} - Rs. ${estimate.maximum}`
                                : "No estimate available for this tier."}
                            </p>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="rounded-[1.5rem] border-2 border-zinc-300 bg-zinc-50 p-5 text-sm text-zinc-600">
              No active products found for this category yet.
            </div>
          )}
        </section>
      </form>
    </div>
  );
}
