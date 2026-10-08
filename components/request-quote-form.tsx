"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { GoogleMapsLocationPicker } from "@/components/google-maps-location-picker";
import {
  buildQuotationPayload,
  buildSelectedProductState,
  buildWhatsAppMessage,
  CategoryOption,
  BudgetTierKey,
  EventLocationSelection,
  getBudgetLabel,
  getBundleProductsForEventType,
  getEstimatedTotals,
  getEventTypeProducts,
  getProductEstimate,
  normalizePriceTiers,
  normalizeQuotationConfig,
  ProductOption,
  SelectedProductFormState,
} from "@/lib/quotation";

// Photos for the right-hand collage; save them in /public with these names.
const collageImages = [
  "/quote_1.png",
  "/quote_2.png",
  "/quote_3.png",
  "/quote_4.png",
  "/quote_5.png",
  "/quote_6.png",
];

const budgetTiers: Array<{ key: BudgetTierKey; label: string }> = (
  ["low", "medium", "high"] as const
).map((key) => ({ key, label: getBudgetLabel(key) }));

const categoriesRef = collection(db, "product_categories");
const productsRef = collection(db, "products");
const quotationRequestsRef = collection(db, "quotation_requests");
const whatsappNumber = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "").replace(
  /\D/g,
  ""
);

const inputClassName =
  "h-[clamp(44px,3.15cqw,53px)] w-full rounded-[10px] border border-[var(--color-gold)] bg-white px-4 text-[clamp(14px,1.07cqw,18px)] text-black outline-none transition placeholder:text-[#b5b0aa] focus:ring-2 focus:ring-[var(--color-gold)]/40";

const cardClassName =
  "rounded-[20px] bg-white px-[5%] py-[4.5%] shadow-[0_6px_24px_rgba(0,0,0,0.08)] lg:px-[2.8cqw] lg:py-[2.4cqw]";

const labelClassName =
  "mb-2 block text-[clamp(15px,1.31cqw,22px)] leading-[1.3] text-black";

const mutedBoxClassName =
  "rounded-[15px] border border-[var(--color-gold)]/50 bg-[var(--color-gold-pale)] p-4 text-[clamp(13px,1.07cqw,18px)] text-[#717171]";

function Field({
  children,
  htmlFor,
  label,
  optional = false,
  required = false,
}: {
  children: React.ReactNode;
  htmlFor: string;
  label: string;
  optional?: boolean;
  required?: boolean;
}) {
  return (
    <div>
      <label className={labelClassName} htmlFor={htmlFor}>
        {label}
        {required ? <span className="text-red-500">*</span> : null}
        {optional ? <span className="text-[#717171]"> (Optional)</span> : null}
      </label>
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-3 font-serif text-[clamp(20px,1.67cqw,28px)] leading-[1.3] text-black">
      {children}
    </h2>
  );
}

// Selectable pill used in place of a dropdown.
function Chip({
  children,
  disabled = false,
  isSelected,
  onClick,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      aria-checked={isSelected}
      className={`h-[clamp(40px,3.15cqw,53px)] rounded-[10px] border border-[var(--color-gold)] px-4 text-[clamp(13px,0.95cqw,16px)] transition disabled:opacity-60 lg:px-[1.1cqw] ${
        isSelected
          ? "bg-[var(--color-gold)] text-white"
          : "bg-white text-black hover:bg-[var(--color-gold-pale)]"
      }`}
      disabled={disabled}
      onClick={onClick}
      role="radio"
      type="button"
    >
      {children}
    </button>
  );
}

export function RequestQuoteForm({
  initialCategoryId = "",
  initialProductId = "",
}: {
  initialCategoryId?: string;
  initialProductId?: string;
}) {
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState(initialCategoryId);
  const [selectedEventTypeId, setSelectedEventTypeId] = useState("");
  const [budgetTier, setBudgetTier] = useState<BudgetTierKey>("medium");
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventLocation, setEventLocation] = useState<EventLocationSelection>({
    address: "",
    source: "manual",
  });
  const [notes, setNotes] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<
    Record<string, SelectedProductFormState>
  >({});
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
          const quotationConfig = normalizeQuotationConfig(
            data.quotation_config as ProductOption["quotation_config"] | undefined
          );
          const priceTiers = normalizePriceTiers(
            data.price_tiers as ProductOption["price_tiers"] | undefined
          );

          return {
            id: entry.id,
            name: String(data.name ?? ""),
            item_type: String(data.item_type ?? ""),
            node_type: data.node_type ? String(data.node_type) : undefined,
            layer: typeof data.layer === "number" ? data.layer : undefined,
            core_product_ids: Array.isArray(data.core_product_ids)
              ? data.core_product_ids.map((value) => String(value))
              : [],
            optional_product_ids: Array.isArray(data.optional_product_ids)
              ? data.optional_product_ids.map((value) => String(value))
              : [],
            customer_selectable:
              typeof data.customer_selectable === "boolean"
                ? data.customer_selectable
                : true,
            quotation_enabled:
              typeof data.quotation_enabled === "boolean"
                ? data.quotation_enabled
                : Boolean(
                    (
                      data.quotation_config as ProductOption["quotation_config"]
                    )?.quotation_enabled ?? true
                  ),
            short_description: String(data.short_description ?? ""),
            service_group: data.service_group
              ? String(data.service_group)
              : undefined,
            pricing_model: String(data.pricing_model ?? ""),
            price_tiers: priceTiers,
            quotation_config: quotationConfig,
          };
        });

        const selectableProducts = nextProducts.filter(
          (product) =>
            product.customer_selectable !== false &&
            product.quotation_enabled !== false
        );

        const initialEventType = selectableProducts.find(
          (product) =>
            product.id === initialProductId &&
            product.node_type === "event_type" &&
            product.layer === 3
        );
        const nextSelectedEventTypeId =
          selectedEventTypeId || initialEventType?.id || "";

        setProducts(selectableProducts);

        if (nextSelectedEventTypeId && nextSelectedEventTypeId !== selectedEventTypeId) {
          setSelectedEventTypeId(nextSelectedEventTypeId);
        }

        setSelectedProducts((current) => {
          if (nextSelectedEventTypeId) {
            return buildSelectedProductState(
              selectableProducts,
              nextSelectedEventTypeId,
              initialProductId
            );
          }

          return current;
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
  }, [initialProductId, selectedCategoryId, selectedEventTypeId]);

  function handleCategoryChange(nextCategoryId: string) {
    setIsLoadingProducts(Boolean(nextCategoryId));
    setSelectedCategoryId(nextCategoryId);
    setSelectedEventTypeId("");
    setProducts([]);
    setSelectedProducts({});
    setSuccessMessage("");
    setError("");
  }

  function handleEventTypeChange(nextEventTypeId: string) {
    setSelectedEventTypeId(nextEventTypeId);
    setSelectedProducts(
      buildSelectedProductState(products, nextEventTypeId, initialProductId)
    );
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

  // Earliest selectable event date (today, in the visitor's timezone).
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(now.getDate()).padStart(2, "0")}`;
  const phoneDigits = phoneNumber.replace(/\D/g, "");
  const isPhoneValid = phoneDigits.length >= 10 && phoneDigits.length <= 13;
  const canSubmit =
    name.trim() !== "" &&
    isPhoneValid &&
    selectedCategoryId !== "" &&
    selectedEventTypeId !== "" &&
    eventLocation.address.trim() !== "" &&
    eventDate !== "" &&
    !isSubmitting;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canSubmit) {
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
      const payload = buildQuotationPayload({
        budgetTier,
        categories,
        eventLocation,
        name,
        notes,
        phoneNumber,
        products,
        selectedCategoryId,
        selectedEventTypeId,
        selectedProducts,
      });
      const extraDetails = {
        email: email.trim(),
        event_date: eventDate,
      };

      await addDoc(quotationRequestsRef, {
        ...payload,
        ...extraDetails,
        created_at: serverTimestamp(),
      });

      const whatsappMessage = [
        buildWhatsAppMessage(payload),
        extraDetails.event_date ? `Event date: ${extraDetails.event_date}` : "",
        extraDetails.email ? `Email: ${extraDetails.email}` : "",
      ]
        .filter(Boolean)
        .join("\n");
      const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
        whatsappMessage
      )}`;

      const popup = window.open(whatsappUrl, "_blank", "noopener,noreferrer");

      if (!popup) {
        window.location.assign(whatsappUrl);
      }

      setSuccessMessage(
        "Your quotation request has been submitted and WhatsApp has been opened with the same request details."
      );
      setName("");
      setPhoneNumber("");
      setEmail("");
      setEventDate("");
      setEventLocation({
        address: "",
        source: "manual",
      });
      setNotes("");
      setBudgetTier("medium");
      setSelectedProducts((current) => {
        const resetState: Record<string, SelectedProductFormState> = {};

        for (const product of bundleProducts) {
          const existing = current[product.id];

          resetState[product.id] = {
            duration: existing?.duration ?? "1",
            quantity: existing?.quantity ?? "1",
            selected: coreBundleIdSet.has(product.id),
          };
        }

        return resetState;
      });
    } catch (submitError) {
      console.error(submitError);
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Could not submit the quotation request to Firestore."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const eventTypeProducts = getEventTypeProducts(products);
  const { bundleProducts, coreBundleIdSet, selectedEventType } =
    getBundleProductsForEventType(products, selectedEventTypeId);
  const estimatedTotals = getEstimatedTotals(
    bundleProducts,
    selectedProducts,
    budgetTier
  );

  return (
    // Desktop sizes are Figma values (1920px frame, 1680px content) scaled by the
    // content width, e.g. 18px input text = 1.07cqw.
    <div className="mx-auto w-full max-w-[1680px] [container-type:inline-size]">
      <p className="text-base leading-[1.4] text-[var(--color-gold)] lg:text-[clamp(20px,2.262cqw,38px)] lg:leading-[40px]">
        Get Started
      </p>
      <h1 className="font-serif text-[36px] leading-[1.2] text-black sm:text-5xl lg:text-[clamp(36px,3.81cqw,64px)] lg:leading-[80px]">
        Request a Quote
      </h1>
      <div className="h-[2px] w-[110px] bg-[var(--color-gold)] lg:w-[150px]" />
      <p className="mt-5 text-[clamp(15px,1.67cqw,28px)] leading-[1.4] text-[#717171] lg:mt-[1.9cqw]">
        Tell us about your event and we&apos;ll get in touch within 24 hours —
        no account needed.
      </p>

      <div className="mt-8 flex flex-col gap-8 lg:mt-[2cqw] lg:flex-row lg:gap-[2.8cqw]">
        <form
          className="lg:w-[61.4cqw] lg:shrink-0"
          noValidate
          onSubmit={handleSubmit}
        >
          <SectionTitle>Personal Details</SectionTitle>
          <div className={cardClassName}>
            <div className="grid gap-5 sm:grid-cols-2 lg:gap-x-[3.3cqw] lg:gap-y-[1.7cqw]">
              <Field htmlFor="full-name" label="Full Name" required>
                <input
                  autoComplete="name"
                  className={inputClassName}
                  id="full-name"
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Name here"
                  type="text"
                  value={name}
                />
              </Field>
              <Field htmlFor="phone" label="Phone Number" required>
                <input
                  autoComplete="tel"
                  className={inputClassName}
                  id="phone"
                  inputMode="tel"
                  onChange={(event) => setPhoneNumber(event.target.value)}
                  placeholder="+91 XXX XXX XX"
                  type="tel"
                  value={phoneNumber}
                />
              </Field>
              <div className="sm:col-span-2">
                <Field htmlFor="email" label="Email Address" optional>
                  <input
                    autoComplete="email"
                    className={inputClassName}
                    id="email"
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="youremailhere@gmail.com"
                    type="email"
                    value={email}
                  />
                </Field>
              </div>
            </div>
          </div>

          <div className="mt-8 lg:mt-[3.7cqw]">
            <SectionTitle>Event Details</SectionTitle>
          </div>
          <div className={cardClassName}>
            <div className="space-y-5 lg:space-y-[1.7cqw]">
              <div>
                <p className={labelClassName} id="event-category-label">
                  Event Category<span className="text-red-500">*</span>
                </p>
                <div
                  aria-labelledby="event-category-label"
                  className="flex flex-wrap gap-2 lg:gap-[0.7cqw]"
                  role="radiogroup"
                >
                  {categories.map((category) => (
                    <Chip
                      key={category.id}
                      disabled={isLoadingCategories}
                      isSelected={category.id === selectedCategoryId}
                      onClick={() => handleCategoryChange(category.id)}
                    >
                      {category.name}
                    </Chip>
                  ))}
                </div>
              </div>

              {selectedCategoryId ? (
                <div>
                  <p className={labelClassName} id="event-type-label">
                    Event Type<span className="text-red-500">*</span>
                  </p>
                  {isLoadingProducts ? (
                    <div className="h-[clamp(40px,3.15cqw,53px)] w-2/3 animate-pulse rounded-[10px] bg-[var(--color-gold-pale)]" />
                  ) : eventTypeProducts.length > 0 ? (
                    <div
                      aria-labelledby="event-type-label"
                      className="flex flex-wrap gap-2 lg:gap-[0.7cqw]"
                      role="radiogroup"
                    >
                      {eventTypeProducts.map((product) => (
                        <Chip
                          key={product.id}
                          isSelected={product.id === selectedEventTypeId}
                          onClick={() => handleEventTypeChange(product.id)}
                        >
                          {product.name}
                        </Chip>
                      ))}
                    </div>
                  ) : (
                    <p className={mutedBoxClassName}>
                      No event types found for this category yet.
                    </p>
                  )}
                </div>
              ) : null}

              {selectedEventType ? (
                <div className="space-y-4">
                  {selectedEventType.short_description ? (
                    <p className={mutedBoxClassName}>
                      <span className="font-medium text-black">
                        {selectedEventType.name}:
                      </span>{" "}
                      {selectedEventType.short_description}
                    </p>
                  ) : null}

                  <div>
                    <p className={labelClassName} id="budget-label">
                      Budget Tier
                    </p>
                    <div
                      aria-labelledby="budget-label"
                      className="flex flex-wrap gap-2 lg:gap-[0.7cqw]"
                      role="radiogroup"
                    >
                      {budgetTiers.map((tier) => (
                        <Chip
                          key={tier.key}
                          isSelected={tier.key === budgetTier}
                          onClick={() => setBudgetTier(tier.key)}
                        >
                          {tier.label}
                        </Chip>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className={labelClassName}>Services</p>
                    {bundleProducts.length > 0 ? (
                      <div className="space-y-3">
                        {bundleProducts.map((product) => {
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
                              className="rounded-[15px] border border-[var(--color-gold)] bg-white p-4"
                            >
                              <label className="flex items-start gap-3">
                                <input
                                  checked={productState.selected}
                                  className="mt-1 h-4 w-4 accent-[var(--color-primary)]"
                                  onChange={() => handleProductToggle(product.id)}
                                  type="checkbox"
                                />
                                <div className="space-y-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <p className="text-[clamp(15px,1.19cqw,20px)] font-medium text-black">
                                      {product.name}
                                    </p>
                                    <span className="rounded-full bg-[var(--color-gold-pale)] px-3 py-0.5 text-[12px] text-[#717171]">
                                      {coreBundleIdSet.has(product.id)
                                        ? "Core bundle"
                                        : "Optional add-on"}
                                    </span>
                                  </div>
                                  <p className="text-[clamp(13px,1.07cqw,18px)] text-[#717171]">
                                    {product.short_description}
                                  </p>
                                  <p className="text-[clamp(13px,1.07cqw,18px)] text-black">
                                    {budgetConfig
                                      ? `${getBudgetLabel(budgetTier)}: Rs. ${budgetConfig.minimum_price} - Rs. ${budgetConfig.maximum_price}`
                                      : "Manual review required for final estimate"}
                                  </p>
                                </div>
                              </label>

                              {productState.selected ? (
                                <div className="mt-4 grid gap-4 rounded-[10px] bg-[var(--color-gold-pale)] p-4 md:grid-cols-2">
                                  {product.quotation_config.quantity_required ? (
                                    <div>
                                      <label
                                        className="mb-1 block text-sm text-black"
                                        htmlFor={`quantity-${product.id}`}
                                      >
                                        {product.quotation_config.quantity_label ??
                                          "Quantity required"}
                                      </label>
                                      <input
                                        className={inputClassName}
                                        id={`quantity-${product.id}`}
                                        min={
                                          product.quotation_config.minimum_quantity ?? 1
                                        }
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
                                    <div>
                                      <label
                                        className="mb-1 block text-sm text-black"
                                        htmlFor={`duration-${product.id}`}
                                      >
                                        {product.quotation_config.duration_label ??
                                          "Duration required"}
                                      </label>
                                      <input
                                        className={inputClassName}
                                        id={`duration-${product.id}`}
                                        min={
                                          product.quotation_config.minimum_duration ?? 1
                                        }
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

                                  <p className="text-sm text-[#717171] md:col-span-2">
                                    <span className="font-medium text-black">
                                      Estimated price:
                                    </span>{" "}
                                    {estimate
                                      ? `Rs. ${estimate.minimum} - Rs. ${estimate.maximum}`
                                      : "Manual review required for this selection."}
                                  </p>
                                </div>
                              ) : null}
                            </article>
                          );
                        })}
                      </div>
                    ) : (
                      <p className={mutedBoxClassName}>
                        No bundles are linked to this event type yet.
                      </p>
                    )}
                  </div>

                  <div className={mutedBoxClassName}>
                    <p>
                      Estimate summary · Budget tier:{" "}
                      <span className="font-medium text-black">
                        {getBudgetLabel(budgetTier)}
                      </span>
                    </p>
                    <p className="mt-1 font-serif text-[clamp(20px,1.67cqw,28px)] font-bold text-black">
                      Rs. {estimatedTotals.minimum} - Rs. {estimatedTotals.maximum}
                    </p>
                  </div>
                </div>
              ) : null}

              <GoogleMapsLocationPicker
                label="Event Location"
                onChange={setEventLocation}
                required
                value={eventLocation}
              />

              <Field htmlFor="event-date" label="Event Date" required>
                <input
                  className={`${inputClassName} appearance-none sm:max-w-[48%]`}
                  id="event-date"
                  min={today}
                  onChange={(event) => setEventDate(event.target.value)}
                  suppressHydrationWarning
                  type="date"
                  value={eventDate}
                />
              </Field>

              <Field htmlFor="notes" label="Additional Requirement">
                <textarea
                  className={`${inputClassName} h-[clamp(110px,8.3cqw,140px)] resize-none py-3`}
                  id="notes"
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Tell us more about your event vision, specific requirements, theme preference....."
                  value={notes}
                />
              </Field>

              <div>
                <button
                  className={`h-[clamp(46px,3.33cqw,56px)] w-full rounded-[10px] text-[clamp(16px,1.3cqw,22px)] font-medium text-white transition ${
                    canSubmit
                      ? "bg-[var(--color-primary)] hover:bg-[#9f4e2f]"
                      : "cursor-not-allowed bg-[#a5a19c]"
                  }`}
                  disabled={!canSubmit}
                  type="submit"
                >
                  {isSubmitting ? "Sending..." : "Request Call"}
                </button>
                <p className="mt-3 text-center text-[clamp(13px,1.19cqw,20px)] leading-[1.4] text-[#717171] lg:mt-[1cqw]">
                  We&apos;ll call you within 24 hours. No spam, ever.
                </p>
                {error ? (
                  <p
                    className="mt-3 rounded-[10px] bg-red-50 px-4 py-3 text-sm text-red-700"
                    role="alert"
                  >
                    {error}
                  </p>
                ) : null}
                {successMessage ? (
                  <p
                    className="mt-3 rounded-[10px] bg-[var(--color-gold-pale)] px-4 py-3 text-sm text-black"
                    role="status"
                  >
                    {successMessage}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </form>

        <div
          aria-hidden="true"
          className="grid grid-cols-2 gap-[9px] max-lg:hidden lg:w-[36cqw] lg:shrink-0 lg:self-start"
        >
          {collageImages.map((src) => (
            <div
              key={src}
              className="aspect-square rounded-[20px] bg-[#efe9dd] bg-cover bg-center"
              style={{ backgroundImage: `url(${src})` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
