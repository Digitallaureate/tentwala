"use client";

export type BudgetTierKey = "low" | "medium" | "high";

export type CategoryOption = {
  id: string;
  name: string;
  short_description: string;
};

export type PriceTier = {
  label: string;
  maximum_price: number;
  minimum_price: number;
};

export type ProductOption = {
  id: string;
  name: string;
  item_type: string;
  node_type?: string;
  layer?: number;
  core_product_ids?: string[];
  optional_product_ids?: string[];
  customer_selectable?: boolean;
  quotation_enabled?: boolean;
  short_description: string;
  service_group?: string;
  pricing_model: string;
  price_tiers: {
    high?: PriceTier;
    low?: PriceTier;
    medium?: PriceTier;
  };
  quotation_config: {
    quotation_enabled?: boolean;
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

export type SelectedProductFormState = {
  duration: string;
  quantity: string;
  selected: boolean;
};

export type EventLocationSelection = {
  address: string;
  latitude?: number;
  longitude?: number;
  placeId?: string;
  source: "google_places" | "manual";
};

export type QuotationRequestStatus =
  | "pending"
  | "in_review"
  | "quoted"
  | "closed";

export type RequestPayload = {
  budget_tier: BudgetTierKey;
  category_id: string;
  category_name: string;
  event_type_id?: string;
  event_type_name?: string;
  event_location: string;
  event_location_latitude?: number;
  event_location_longitude?: number;
  event_location_place_id?: string;
  event_location_source: EventLocationSelection["source"];
  name: string;
  notes: string;
  phone_number: string;
  request_type: "quotation";
  status: QuotationRequestStatus;
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

export function normalizeQuotationConfig(
  config: ProductOption["quotation_config"] | undefined
): ProductOption["quotation_config"] {
  return {
    quotation_enabled: config?.quotation_enabled ?? true,
    quantity_required: config?.quantity_required ?? false,
    duration_required: config?.duration_required ?? false,
    manual_review_required: config?.manual_review_required ?? true,
    quantity_label: config?.quantity_label,
    quantity_unit: config?.quantity_unit,
    minimum_quantity: config?.minimum_quantity,
    duration_label: config?.duration_label,
    duration_unit: config?.duration_unit,
    minimum_duration: config?.minimum_duration,
  };
}

export function normalizePriceTiers(
  tiers: ProductOption["price_tiers"] | undefined
): ProductOption["price_tiers"] {
  return {
    low: tiers?.low,
    medium: tiers?.medium,
    high: tiers?.high,
  };
}

export function normalizeNumber(value: string, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function getBudgetLabel(tier: BudgetTierKey) {
  if (tier === "low") {
    return "Utsav";
  }

  if (tier === "medium") {
    return "Bhavya";
  }

  return "Shaahi";
}

export function buildWhatsAppMessage(payload: RequestPayload) {
  const productLines = payload.selected_products
    .map((product, index) => {
      const quantityText = `Quantity: ${product.quantity}`;
      const durationText =
        product.duration > 1 ? `, Duration: ${product.duration}` : "";

      return `${index + 1}. ${product.product_name}
   Type: ${product.item_type}
   ${quantityText}${durationText}
   Estimate: ${
     product.estimated_minimum_price === 0 &&
     product.estimated_maximum_price === 0
       ? "Manual review required"
       : `Rs. ${product.estimated_minimum_price} - Rs. ${product.estimated_maximum_price}`
   }`;
    })
    .join("\n");

  return [
    "New quotation request",
    "",
    `Name: ${payload.name}`,
    `Phone: ${payload.phone_number}`,
    `Location: ${payload.event_location}`,
    payload.event_location_place_id
      ? `Map place ID: ${payload.event_location_place_id}`
      : null,
    typeof payload.event_location_latitude === "number" &&
    typeof payload.event_location_longitude === "number"
      ? `Coordinates: ${payload.event_location_latitude}, ${payload.event_location_longitude}`
      : null,
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

export function getProductEstimate(
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

export function buildSelectedProductState(
  products: ProductOption[],
  eventTypeId: string,
  initialProductId = ""
) {
  const nextState: Record<string, SelectedProductFormState> = {};
  const eventType = products.find((product) => product.id === eventTypeId);
  const coreIds = new Set(eventType?.core_product_ids ?? []);
  const optionalIds = new Set(eventType?.optional_product_ids ?? []);

  for (const product of products) {
    if (!coreIds.has(product.id) && !optionalIds.has(product.id)) {
      continue;
    }

    nextState[product.id] = {
      duration: product.quotation_config.minimum_duration
        ? String(product.quotation_config.minimum_duration)
        : "1",
      quantity: product.quotation_config.minimum_quantity
        ? String(product.quotation_config.minimum_quantity)
        : "1",
      selected:
        coreIds.has(product.id) ||
        (product.id === initialProductId && optionalIds.has(product.id)),
    };
  }

  return nextState;
}

export function getEventTypeProducts(products: ProductOption[]) {
  return products.filter(
    (product) => product.node_type === "event_type" && product.layer === 3
  );
}

export function getBundleProductsForEventType(
  products: ProductOption[],
  selectedEventTypeId: string
) {
  const selectedEventType = products.find(
    (product) => product.id === selectedEventTypeId
  );
  const coreBundleIdSet = new Set(selectedEventType?.core_product_ids ?? []);
  const optionalBundleIdSet = new Set(selectedEventType?.optional_product_ids ?? []);

  return {
    bundleProducts: products.filter(
      (product) =>
        product.node_type === "bundle" &&
        (coreBundleIdSet.has(product.id) || optionalBundleIdSet.has(product.id))
    ),
    coreBundleIdSet,
    optionalBundleIdSet,
    selectedEventType,
  };
}

export function getEstimatedTotals(
  bundleProducts: ProductOption[],
  selectedProducts: Record<string, SelectedProductFormState>,
  budgetTier: BudgetTierKey
) {
  return bundleProducts.reduce(
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
}

export function buildQuotationPayload({
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
}: {
  budgetTier: BudgetTierKey;
  categories: CategoryOption[];
  eventLocation: EventLocationSelection;
  name: string;
  notes: string;
  phoneNumber: string;
  products: ProductOption[];
  selectedCategoryId: string;
  selectedEventTypeId: string;
  selectedProducts: Record<string, SelectedProductFormState>;
}) {
  const selectedCategory = categories.find(
    (category) => category.id === selectedCategoryId
  );
  const selectedEventType = products.find(
    (product) =>
      product.id === selectedEventTypeId && product.node_type === "event_type"
  );

  if (!selectedCategory) {
    throw new Error("Please select a category before submitting.");
  }

  if (!selectedEventType) {
    throw new Error("Please select an event type before submitting.");
  }

  const bundleIds = new Set([
    ...(selectedEventType.core_product_ids ?? []),
    ...(selectedEventType.optional_product_ids ?? []),
  ]);

  const chosenProducts = products
    .filter((product) => bundleIds.has(product.id) && product.node_type === "bundle")
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
        item_type:
          product.node_type?.replaceAll("_", " ") ??
          product.item_type.replaceAll("_", " "),
        pricing_model: product.pricing_model,
        product_id: product.id,
        product_name: product.name,
        quantity: estimate.quantity,
      };
    })
    .filter(Boolean) as RequestPayload["selected_products"];

  if (chosenProducts.length === 0) {
    throw new Error("Please select at least one product or service.");
  }

  return {
    budget_tier: budgetTier,
    category_id: selectedCategory.id,
    category_name: selectedCategory.name,
    event_type_id: selectedEventType.id,
    event_type_name: selectedEventType.name,
    event_location: eventLocation.address.trim(),
    event_location_latitude: eventLocation.latitude,
    event_location_longitude: eventLocation.longitude,
    event_location_place_id: eventLocation.placeId,
    event_location_source: eventLocation.source,
    name: name.trim(),
    notes: notes.trim(),
    phone_number: phoneNumber.trim(),
    request_type: "quotation" as const,
    status: "pending" as const,
    selected_products: chosenProducts,
  };
}
