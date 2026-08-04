"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import {
  buildQuotationPayload,
  buildSelectedProductState,
  buildWhatsAppMessage,
  BudgetTierKey,
  CategoryOption,
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

type ChatStep =
  | "name"
  | "phone"
  | "location"
  | "category"
  | "eventTypeLoading"
  | "eventType"
  | "budget"
  | "bundles"
  | "notes"
  | "confirm"
  | "complete";

type ChatMessage = {
  id: string;
  sender: "bot" | "user";
  text: string;
};

const categoriesRef = collection(db, "product_categories");
const productsRef = collection(db, "products");
const quotationRequestsRef = collection(db, "quotation_requests");
const whatsappNumber = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "").replace(
  /\D/g,
  ""
);

function createInitialMessages(): ChatMessage[] {
  return [
    {
      id: "welcome",
      sender: "bot",
      text: "Welcome to TentWala. I can guide you through a quotation in a simple chat flow.",
    },
    {
      id: "name",
      sender: "bot",
      text: "Let's begin with your name.",
    },
  ];
}

function makeMessage(sender: ChatMessage["sender"], text: string): ChatMessage {
  return {
    id: `${sender}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    sender,
    text,
  };
}

export function QuotationChatbot({
  initialCategoryId = "",
  initialProductId = "",
  onClose,
  variant = "page",
}: {
  initialCategoryId?: string;
  initialProductId?: string;
  onClose?: () => void;
  variant?: "page" | "widget";
}) {
  const [messages, setMessages] = useState<ChatMessage[]>(createInitialMessages);
  const [step, setStep] = useState<ChatStep>("name");
  const [textInput, setTextInput] = useState("");
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState(initialCategoryId);
  const [selectedEventTypeId, setSelectedEventTypeId] = useState("");
  const [budgetTier, setBudgetTier] = useState<BudgetTierKey>("medium");
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<
    Record<string, SelectedProductFormState>
  >({});
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [, setIsLoadingProducts] = useState(
    Boolean(initialCategoryId)
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const pendingEventTypePrompt = useRef(false);

  const appendMessage = useCallback((sender: ChatMessage["sender"], text: string) => {
    setMessages((current) => [...current, makeMessage(sender, text)]);
  }, []);

  const moveToStep = useCallback((nextStep: ChatStep, prompt?: string) => {
    setStep(nextStep);

    if (prompt) {
      appendMessage("bot", prompt);
    }
  }, [appendMessage]);

  function restartChat() {
    setMessages(createInitialMessages());
    setStep("name");
    setTextInput("");
    setSelectedCategoryId(initialCategoryId);
    setSelectedEventTypeId("");
    setBudgetTier("medium");
    setName("");
    setPhoneNumber("");
    setEventLocation("");
    setNotes("");
    setSelectedProducts({});
    setProducts([]);
    setIsLoadingProducts(Boolean(initialCategoryId));
    setError("");
    setSuccessMessage("");
  }

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
          "Could not load categories for the quotation chat. Check Firestore rules and indexes."
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

        setProducts(
          nextProducts.filter(
            (product) =>
              product.customer_selectable !== false &&
              product.quotation_enabled !== false
          )
        );
        setIsLoadingProducts(false);
        setError("");

        if (pendingEventTypePrompt.current) {
          pendingEventTypePrompt.current = false;

          if (
            nextProducts.filter(
              (product) =>
                product.customer_selectable !== false &&
                product.quotation_enabled !== false &&
                product.node_type === "event_type" &&
                product.layer === 3
            ).length === 0
          ) {
            moveToStep(
              "category",
              "I could not find event types for that category yet. Please choose another category."
            );
          } else {
            moveToStep(
              "eventType",
              "Great. Now choose the event type that best matches your celebration."
            );
          }
        }
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
  }, [moveToStep, selectedCategoryId]);

  const eventTypeProducts = useMemo(
    () => getEventTypeProducts(products),
    [products]
  );
  const {
    bundleProducts,
    coreBundleIdSet,
    selectedEventType,
  } = useMemo(
    () => getBundleProductsForEventType(products, selectedEventTypeId),
    [products, selectedEventTypeId]
  );
  const estimatedTotals = useMemo(
    () => getEstimatedTotals(bundleProducts, selectedProducts, budgetTier),
    [bundleProducts, selectedProducts, budgetTier]
  );

  function handleTextSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const value = textInput.trim();
    setError("");

    if (step === "name") {
      if (value.length < 2) {
        setError("Please enter your full name.");
        return;
      }

      setName(value);
      appendMessage("user", value);
      setTextInput("");
      moveToStep("phone", "What phone number should we use for your quotation?");
      return;
    }

    if (step === "phone") {
      if (value.replace(/\D/g, "").length < 7) {
        setError("Please enter a valid phone number.");
        return;
      }

      setPhoneNumber(value);
      appendMessage("user", value);
      setTextInput("");
      moveToStep("location", "Where is the event taking place?");
      return;
    }

    if (step === "location") {
      if (!value) {
        setError("Please enter the event location.");
        return;
      }

      setEventLocation(value);
      appendMessage("user", value);
      setTextInput("");
      moveToStep("category", "Please choose the category for your event.");
      return;
    }

    if (step === "notes") {
      setNotes(value);
      appendMessage("user", value || "No extra notes");
      setTextInput("");
      moveToStep(
        "confirm",
        "Perfect. Review your quotation summary below and submit when you're ready."
      );
    }
  }

  function handleCategorySelect(category: CategoryOption) {
    setSelectedCategoryId(category.id);
    setSelectedEventTypeId("");
    setSelectedProducts({});
    setProducts([]);
    setIsLoadingProducts(true);
    pendingEventTypePrompt.current = true;
    setError("");
    setSuccessMessage("");
    appendMessage("user", category.name);
    moveToStep(
      "eventTypeLoading",
      "I'm loading the matching event types for you."
    );
  }

  function handleEventTypeSelect(product: ProductOption) {
    setSelectedEventTypeId(product.id);
    setSelectedProducts(
      buildSelectedProductState(products, product.id, initialProductId)
    );
    appendMessage("user", product.name);
    moveToStep("budget", "Which budget tier would you like me to estimate?");
  }

  function handleBudgetSelect(nextBudgetTier: BudgetTierKey) {
    setBudgetTier(nextBudgetTier);
    appendMessage("user", getBudgetLabel(nextBudgetTier));
    moveToStep(
      "bundles",
      "Select the services you want in the quotation. You can also adjust quantity or duration where required."
    );
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

  function handleBundleContinue() {
    try {
      buildQuotationPayload({
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
    } catch (bundleError) {
      setError(
        bundleError instanceof Error
          ? bundleError.message
          : "Please review your service selections."
      );
      return;
    }

    const selectedCount = bundleProducts.filter(
      (product) => selectedProducts[product.id]?.selected
    ).length;

    appendMessage(
      "user",
      `Selected ${selectedCount} service${selectedCount === 1 ? "" : "s"}`
    );
    moveToStep(
      "notes",
      "Any extra notes to help us prepare the quotation? You can type them below or skip this step."
    );
  }

  function handleSkipNotes() {
    setNotes("");
    appendMessage("user", "No additional notes");
    moveToStep(
      "confirm",
      "Perfect. Review your quotation summary below and submit when you're ready."
    );
  }

  async function handleSubmitQuotation() {
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
        window.location.assign(whatsappUrl);
      }

      setSuccessMessage(
        "Your quotation request has been submitted and WhatsApp has been opened with the same details."
      );
      appendMessage(
        "bot",
        "Your quotation request is submitted. I've also opened WhatsApp with the same request details for quick follow-up."
      );
      setStep("complete");
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

  const currentCategory = categories.find(
    (category) => category.id === selectedCategoryId
  );
  const isWidget = variant === "widget";

  return (
    <section
      className={`rounded-[2rem] border border-[#d8dfde] bg-white/88 shadow-[0_24px_60px_rgba(29,45,68,0.08)] backdrop-blur ${
        isWidget
          ? "flex h-full min-h-0 flex-col border-white/70 bg-transparent p-2 shadow-none"
          : "p-5 sm:p-7"
      }`}
    >
      <div className={`flex flex-col gap-6 ${isWidget ? "min-h-0 flex-1" : ""}`}>
        <div
          className={`flex flex-col gap-3 ${
            isWidget
              ? "rounded-[1.6rem] border border-white/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.82),rgba(248,244,238,0.72))] px-4 py-4 shadow-[0_18px_36px_rgba(29,45,68,0.08)]"
              : "sm:flex-row sm:items-end sm:justify-between"
          }`}
        >
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#4faebc]">
              Quotation Chat
            </p>
            <h2
              className={`font-serif leading-tight text-[#1d2d44] ${
                isWidget ? "text-2xl" : "text-3xl sm:text-4xl"
              }`}
            >
              {isWidget
                ? "How may we help you?"
                : "Guided quotation, one step at a time"}
            </h2>
            <p
              className={`text-zinc-600 ${
                isWidget
                  ? "max-w-md text-sm leading-6"
                  : "max-w-3xl text-sm leading-7 sm:text-base"
              }`}
            >
              {isWidget
                ? "Ask for your event quotation here. We'll guide you step by step."
                : "This chatbot uses the same quotation logic as your form, but asks the questions in a simpler conversation flow."}
            </p>
          </div>

          <div className="flex gap-2">
            <button
              className="inline-flex h-11 items-center justify-center rounded-full border border-[#1d2d44]/10 bg-white/80 px-5 text-sm font-semibold text-[#1d2d44] shadow-[0_10px_22px_rgba(29,45,68,0.06)] transition hover:bg-white"
              onClick={restartChat}
              type="button"
            >
              Restart chat
            </button>
            {onClose ? (
              <button
                className="inline-flex h-11 items-center justify-center rounded-full border border-[#1d2d44]/10 bg-white/80 px-4 text-sm font-semibold text-[#1d2d44] shadow-[0_10px_22px_rgba(29,45,68,0.06)] transition hover:bg-white"
                onClick={onClose}
                type="button"
              >
                Close
              </button>
            ) : null}
          </div>
        </div>

        <div
          className={`grid gap-4 ${isWidget ? "min-h-0 flex-1 grid-cols-1 overflow-y-auto pr-1" : "lg:grid-cols-[1.2fr_0.8fr]"}`}
        >
          <div className="rounded-[1.8rem] border border-white/80 bg-[linear-gradient(180deg,rgba(249,247,243,0.98),rgba(243,238,231,0.92))] p-4 shadow-[0_18px_36px_rgba(29,45,68,0.07)] sm:p-5">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.sender === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[90%] rounded-[1.4rem] px-4 py-3 text-sm leading-7 shadow-[0_12px_28px_rgba(29,45,68,0.06)] sm:text-[0.96rem] ${
                      message.sender === "user"
                        ? "bg-[linear-gradient(135deg,#173f73,#214f86)] text-white shadow-[0_16px_28px_rgba(23,63,115,0.2)]"
                        : "border border-white/80 bg-white/96 text-zinc-700"
                    }`}
                  >
                    {message.text}
                  </div>
                </div>
              ))}

              {error ? (
                <div className="rounded-[1.25rem] bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              ) : null}

              {successMessage ? (
                <div className="rounded-[1.25rem] bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {successMessage}
                </div>
              ) : null}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-[1.8rem] border border-white/80 bg-white/92 p-5 shadow-[0_18px_40px_rgba(29,45,68,0.06)]">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#b18d54]">
                Live Summary
              </p>
              <div className="mt-4 space-y-3 text-sm text-zinc-600">
                <p>
                  <span className="font-semibold text-zinc-900">Name:</span>{" "}
                  {name || "Waiting"}
                </p>
                <p>
                  <span className="font-semibold text-zinc-900">Phone:</span>{" "}
                  {phoneNumber || "Waiting"}
                </p>
                <p>
                  <span className="font-semibold text-zinc-900">Location:</span>{" "}
                  {eventLocation || "Waiting"}
                </p>
                <p>
                  <span className="font-semibold text-zinc-900">Category:</span>{" "}
                  {currentCategory?.name || "Waiting"}
                </p>
                <p>
                  <span className="font-semibold text-zinc-900">Event type:</span>{" "}
                  {selectedEventType?.name || "Waiting"}
                </p>
                <p>
                  <span className="font-semibold text-zinc-900">Budget:</span>{" "}
                  {getBudgetLabel(budgetTier)}
                </p>
                <p className="pt-1 text-base font-semibold text-[#1d2d44]">
                  Rs. {estimatedTotals.minimum} - Rs. {estimatedTotals.maximum}
                </p>
              </div>
            </div>

            <div className="rounded-[1.8rem] border border-white/80 bg-white/92 p-5 shadow-[0_18px_40px_rgba(29,45,68,0.06)]">
              {step === "name" || step === "phone" || step === "location" || step === "notes" ? (
                <form className="space-y-3" onSubmit={handleTextSubmit}>
                  <input
                    className="h-12 w-full rounded-2xl border border-[#d8dfde] bg-[#fbfaf7] px-4 text-sm outline-none transition focus:border-[#173f73] focus:bg-white"
                    onChange={(event) => setTextInput(event.target.value)}
                    placeholder={
                      step === "name"
                        ? "Enter your name"
                        : step === "phone"
                          ? "Enter your phone number"
                          : step === "location"
                            ? "Enter city or venue location"
                            : "Add notes about guest count, timing, or special needs"
                    }
                    value={textInput}
                  />
                  <div className="flex flex-wrap gap-3">
                    <button
                      className="inline-flex h-11 items-center justify-center rounded-full bg-[linear-gradient(135deg,#173f73,#214f86)] px-5 text-sm font-semibold text-white shadow-[0_16px_28px_rgba(23,63,115,0.2)] transition hover:brightness-105"
                      type="submit"
                    >
                      Continue
                    </button>
                    {step === "notes" ? (
                      <button
                        className="inline-flex h-11 items-center justify-center rounded-full border border-[#1d2d44]/12 bg-white px-5 text-sm font-semibold text-[#1d2d44] transition hover:bg-[#f7f7f4]"
                        onClick={handleSkipNotes}
                        type="button"
                      >
                        Skip notes
                      </button>
                    ) : null}
                  </div>
                </form>
              ) : null}

              {step === "category" ? (
                <div className="space-y-3">
                  {isLoadingCategories ? (
                    <p className="text-sm text-zinc-600">Loading categories...</p>
                  ) : (
                    <div className="flex flex-wrap gap-3">
                      {categories.map((category) => (
                        <button
                          key={category.id}
                          className="rounded-full border border-[#1d2d44]/10 bg-[#fbfaf7] px-4 py-2 text-sm font-medium text-[#1d2d44] shadow-[0_10px_18px_rgba(29,45,68,0.04)] transition hover:border-[#173f73] hover:bg-white hover:text-[#173f73]"
                          onClick={() => handleCategorySelect(category)}
                          type="button"
                        >
                          {category.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : null}

              {step === "eventTypeLoading" ? (
                <p className="text-sm text-zinc-600">
                  Loading event types for the selected category...
                </p>
              ) : null}

              {step === "eventType" ? (
                <div className="space-y-3">
                  <div className="grid gap-3">
                    {eventTypeProducts.map((product) => (
                      <button
                        key={product.id}
                        className="rounded-[1.4rem] border border-[#d8dfde] bg-[#fbfaf7] p-4 text-left shadow-[0_12px_24px_rgba(29,45,68,0.04)] transition hover:border-[#173f73] hover:bg-white"
                        onClick={() => handleEventTypeSelect(product)}
                        type="button"
                      >
                        <p className="font-semibold text-[#1d2d44]">{product.name}</p>
                        <p className="mt-1 text-sm leading-6 text-zinc-600">
                          {product.short_description}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {step === "budget" ? (
                <div className="flex flex-wrap gap-3">
                  {(["low", "medium", "high"] as BudgetTierKey[]).map((tier) => (
                    <button
                      key={tier}
                      className="rounded-full border border-[#1d2d44]/10 bg-[#fbfaf7] px-5 py-2 text-sm font-semibold text-[#1d2d44] shadow-[0_10px_18px_rgba(29,45,68,0.04)] transition hover:border-[#173f73] hover:bg-white hover:text-[#173f73]"
                      onClick={() => handleBudgetSelect(tier)}
                      type="button"
                    >
                      {getBudgetLabel(tier)}
                    </button>
                  ))}
                </div>
              ) : null}

              {step === "bundles" ? (
                <div className="space-y-4">
                  <div className="grid gap-4">
                    {bundleProducts.map((product) => {
                      const productState = selectedProducts[product.id] ?? {
                        duration: product.quotation_config.minimum_duration
                          ? String(product.quotation_config.minimum_duration)
                          : "1",
                        quantity: product.quotation_config.minimum_quantity
                          ? String(product.quotation_config.minimum_quantity)
                          : "1",
                        selected: coreBundleIdSet.has(product.id),
                      };
                      const estimate = getProductEstimate(
                        product,
                        budgetTier,
                        productState
                      );

                      return (
                        <article
                          key={product.id}
                          className="rounded-[1.4rem] border border-[#d8dfde] bg-[#fbfaf7] p-4 shadow-[0_12px_24px_rgba(29,45,68,0.04)]"
                        >
                          <label className="flex items-start gap-3">
                            <input
                              checked={productState.selected}
                              className="mt-1 h-4 w-4"
                              onChange={() => handleProductToggle(product.id)}
                              type="checkbox"
                            />
                            <div className="flex-1 space-y-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="font-semibold text-[#1d2d44]">
                                  {product.name}
                                </p>
                                <span className="rounded-full border border-[#1d2d44]/10 bg-white px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-zinc-500">
                                  {coreBundleIdSet.has(product.id)
                                    ? "Core bundle"
                                    : "Optional add-on"}
                                </span>
                              </div>
                              <p className="text-sm leading-6 text-zinc-600">
                                {product.short_description}
                              </p>
                              <p className="text-sm font-medium text-zinc-700">
                                {estimate
                                  ? `Rs. ${estimate.minimum} - Rs. ${estimate.maximum}`
                                  : "Manual review required for this selection"}
                              </p>

                              {productState.selected ? (
                                <div className="grid gap-3 pt-1 sm:grid-cols-2">
                                  {product.quotation_config.quantity_required ? (
                                    <input
                                      className="h-11 rounded-2xl border border-[#d8dfde] bg-white px-4 text-sm outline-none transition focus:border-[#173f73]"
                                      min={product.quotation_config.minimum_quantity ?? 1}
                                      onChange={(event) =>
                                        handleProductFieldChange(
                                          product.id,
                                          "quantity",
                                          event.target.value
                                        )
                                      }
                                      placeholder={
                                        product.quotation_config.quantity_label ??
                                        "Quantity"
                                      }
                                      type="number"
                                      value={productState.quantity}
                                    />
                                  ) : null}
                                  {product.quotation_config.duration_required ? (
                                    <input
                                      className="h-11 rounded-2xl border border-[#d8dfde] bg-white px-4 text-sm outline-none transition focus:border-[#173f73]"
                                      min={product.quotation_config.minimum_duration ?? 1}
                                      onChange={(event) =>
                                        handleProductFieldChange(
                                          product.id,
                                          "duration",
                                          event.target.value
                                        )
                                      }
                                      placeholder={
                                        product.quotation_config.duration_label ??
                                        "Duration"
                                      }
                                      type="number"
                                      value={productState.duration}
                                    />
                                  ) : null}
                                </div>
                              ) : null}
                            </div>
                          </label>
                        </article>
                      );
                    })}
                  </div>

                  <button
                    className="inline-flex h-11 items-center justify-center rounded-full bg-[linear-gradient(135deg,#173f73,#214f86)] px-5 text-sm font-semibold text-white shadow-[0_16px_28px_rgba(23,63,115,0.2)] transition hover:brightness-105"
                    onClick={handleBundleContinue}
                    type="button"
                  >
                    Continue with selected services
                  </button>
                </div>
              ) : null}

              {step === "confirm" || step === "complete" ? (
                <div className="space-y-4">
                  <div className="rounded-[1.4rem] border border-[#d8dfde] bg-[#fbfaf7] p-4">
                    <div className="space-y-2 text-sm text-zinc-600">
                      <p>
                        <span className="font-semibold text-zinc-900">Category:</span>{" "}
                        {currentCategory?.name}
                      </p>
                      <p>
                        <span className="font-semibold text-zinc-900">Event type:</span>{" "}
                        {selectedEventType?.name}
                      </p>
                      <p>
                        <span className="font-semibold text-zinc-900">Budget:</span>{" "}
                        {getBudgetLabel(budgetTier)}
                      </p>
                      <p>
                        <span className="font-semibold text-zinc-900">Notes:</span>{" "}
                        {notes || "No additional notes"}
                      </p>
                      <p className="pt-2 text-base font-semibold text-[#1d2d44]">
                        Estimated total: Rs. {estimatedTotals.minimum} - Rs.{" "}
                        {estimatedTotals.maximum}
                      </p>
                    </div>
                  </div>

                  {step === "confirm" ? (
                    <button
                      className="inline-flex h-11 items-center justify-center rounded-full bg-[linear-gradient(135deg,#173f73,#214f86)] px-5 text-sm font-semibold text-white shadow-[0_16px_28px_rgba(23,63,115,0.2)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:shadow-none"
                      disabled={isSubmitting}
                      onClick={handleSubmitQuotation}
                      type="button"
                    >
                      {isSubmitting ? "Submitting request..." : "Submit quotation request"}
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
