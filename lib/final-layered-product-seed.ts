import {
  bundleDefinitions,
  eventTypeDefinitions,
  type LayeredProductSeed,
  type ProductCategoryId,
} from "@/lib/layered-product-architecture";
import {
  draftProductSeedData,
  defaultProductBannerUrl,
  defaultProductImageUrls,
  defaultProductThumbnailUrl,
  type DraftProductSeed,
} from "@/lib/product-seed-draft";

type Exposure = "shown" | "rolled_up" | "internal" | "excluded" | "on_request";

type FinalLayeredProductSeed = LayeredProductSeed & {
  item_type: "l1_item" | "bundle" | "event_type";
  exposure: Exposure;
  customer_selectable: boolean;
  quotation_enabled: boolean;
  thumbnail_url: string;
  banner_url: string;
  image_urls: string[];
  service_highlights?: string[];
  included_items?: string[];
  ideal_for?: string[];
  pricing_notes?: string[];
  faq?: Array<{
    question: string;
    answer: string;
  }>;
  terms_and_conditions?: string[];
  availability_note?: string;
  price_tiers: DraftProductSeed["price_tiers"];
  quotation_config: DraftProductSeed["quotation_config"];
};

type L1Supplement = {
  code: string;
  name: string;
  slug: string;
  service_group: string;
  pricing_model: string;
  source: "in_house" | "vendor" | "coordination" | "referral_only";
  exposure: Exposure;
  short_description: string;
  description: string;
  category_ids: ProductCategoryId[];
};

const allCategoryIds: ProductCategoryId[] = [
  "wedding-functions",
  "family-friends-gatherings",
  "corporate-institutional",
  "religious-domestic-ceremonies",
];

const defaultPriceTiers = {
  low: { label: "Basic", minimum_price: 1, maximum_price: 1 },
  medium: { label: "Standard", minimum_price: 3, maximum_price: 3 },
  high: { label: "Premium", minimum_price: 5, maximum_price: 5 },
} satisfies DraftProductSeed["price_tiers"];

function makeManualReviewConfig(
  overrides: Partial<DraftProductSeed["quotation_config"]> = {}
): DraftProductSeed["quotation_config"] {
  return {
    quotation_enabled: true,
    quantity_required: false,
    duration_required: false,
    manual_review_required: true,
    ...overrides,
  };
}

function makeBundleQuotationConfig(
  scalesBy: string
): DraftProductSeed["quotation_config"] {
  switch (scalesBy) {
    case "decoration_area_sq_ft":
      return makeManualReviewConfig({
        quantity_required: true,
        quantity_label: "Decoration area",
        quantity_unit: "sq_ft",
        minimum_quantity: 100,
      });
    case "guest_count":
      return makeManualReviewConfig({
        quantity_required: true,
        quantity_label: "Guest count",
        quantity_unit: "guest",
        minimum_quantity: 25,
      });
    case "catering_headcount":
      return makeManualReviewConfig({
        quantity_required: true,
        quantity_label: "Catering headcount",
        quantity_unit: "guest",
        minimum_quantity: 25,
      });
    case "stage_area_sq_ft":
      return makeManualReviewConfig({
        quantity_required: true,
        quantity_label: "Stage area",
        quantity_unit: "sq_ft",
        minimum_quantity: 50,
      });
    case "kva_x_days":
      return makeManualReviewConfig({
        quantity_required: true,
        quantity_label: "Required generator load",
        quantity_unit: "kva",
        minimum_quantity: 1,
        duration_required: true,
        duration_label: "Number of days",
        duration_unit: "day",
        minimum_duration: 1,
      });
    case "guest_count_plus_duration":
      return makeManualReviewConfig({
        quantity_required: true,
        quantity_label: "Guest count",
        quantity_unit: "guest",
        minimum_quantity: 25,
        duration_required: true,
        duration_label: "Number of days",
        duration_unit: "day",
        minimum_duration: 1,
      });
    case "number_of_functions":
      return makeManualReviewConfig({
        quantity_required: true,
        quantity_label: "Number of functions",
        quantity_unit: "function",
        minimum_quantity: 1,
      });
    case "number_of_guests_staying":
      return makeManualReviewConfig({
        quantity_required: true,
        quantity_label: "Guests staying",
        quantity_unit: "guest",
        minimum_quantity: 1,
      });
    case "per_event_selection":
      return makeManualReviewConfig({
        quantity_required: false,
        duration_required: false,
      });
    case "40_percent_bundle_subtotal":
      return makeManualReviewConfig({
        quantity_required: false,
        duration_required: false,
      });
    case "flat_coordination_fee":
      return makeManualReviewConfig({
        quantity_required: false,
        duration_required: false,
      });
    default:
      return makeManualReviewConfig();
  }
}

const supplementalL1Products: L1Supplement[] = [
  {
    code: "TS-04",
    name: "Side Walls, Cloth Lining, Ceiling Drapes",
    slug: "side-walls-cloth-lining-ceiling-drapes",
    service_group: "tent-and-structure",
    pricing_model: "per_sq_ft",
    source: "in_house",
    exposure: "rolled_up",
    short_description: "Tent lining and drape treatment that rolls into larger setup pricing.",
    description: "Supporting tent finish materials including side walls, cloth lining, and ceiling drapes.",
    category_ids: allCategoryIds,
  },
  {
    code: "TS-05",
    name: "Poles, Frames, Ropes, Hardware",
    slug: "poles-frames-ropes-hardware",
    service_group: "tent-and-structure",
    pricing_model: "per_setup",
    source: "in_house",
    exposure: "internal",
    short_description: "Core tent setup hardware used internally in structure installation.",
    description: "Internal structural materials required to build tent, shamiana, and canopy systems.",
    category_ids: allCategoryIds,
  },
  {
    code: "SF-08",
    name: "Chair Covers, Table Cloths, Ribbons",
    slug: "chair-covers-table-cloths-ribbons",
    service_group: "tables-and-dining",
    pricing_model: "per_unit_per_day",
    source: "in_house",
    exposure: "rolled_up",
    short_description: "Table and chair styling materials bundled into setup presentation.",
    description: "Covers and fabric accessories used to finish guest seating and dining tables.",
    category_ids: allCategoryIds,
  },
  {
    code: "ST-02",
    name: "Stage Backdrop",
    slug: "stage-backdrop",
    service_group: "stage-and-platform",
    pricing_model: "per_setup",
    source: "in_house",
    exposure: "rolled_up",
    short_description: "Backdrop treatment that rolls into stage setup and decor pricing.",
    description: "Supporting stage backdrop layer used inside stage presentation bundles.",
    category_ids: allCategoryIds,
  },
  {
    code: "DC-04",
    name: "Fabric / Drape Decoration",
    slug: "fabric-drape-decoration",
    service_group: "decoration-and-stage",
    pricing_model: "per_sq_ft",
    source: "in_house",
    exposure: "rolled_up",
    short_description: "Fabric and drape decoration included inside broader decor packages.",
    description: "Soft furnishing and drape styling used to build event ambience and venue finish.",
    category_ids: allCategoryIds,
  },
  {
    code: "PW-02",
    name: "Electrical Wiring, Distribution & Fittings",
    slug: "electrical-wiring-distribution-fittings",
    service_group: "lighting-and-power",
    pricing_model: "per_setup",
    source: "in_house",
    exposure: "internal",
    short_description: "Internal electrical setup work used to power and distribute event services.",
    description: "Internal power infrastructure including wiring, fittings, and electrical distribution work.",
    category_ids: allCategoryIds,
  },
  {
    code: "PW-04",
    name: "Generator Operator",
    slug: "generator-operator",
    service_group: "lighting-and-power",
    pricing_model: "per_person_per_shift",
    source: "in_house",
    exposure: "rolled_up",
    short_description: "Generator staffing cost absorbed into power package pricing.",
    description: "Operator support for running and monitoring generator systems during event hours.",
    category_ids: allCategoryIds,
  },
  {
    code: "PW-05",
    name: "Generator Fuel",
    slug: "generator-fuel",
    service_group: "lighting-and-power",
    pricing_model: "not_billed",
    source: "coordination",
    exposure: "excluded",
    short_description: "Fuel is client-arranged and excluded from the quotation.",
    description: "Generator fuel remains a written exclusion and is not supplied or billed by the business.",
    category_ids: allCategoryIds,
  },
  {
    code: "KD-03",
    name: "Serving Equipment (Chafing Dish, Thermal)",
    slug: "serving-equipment-chafing-dish-thermal",
    service_group: "kitchen-and-dining-equipment",
    pricing_model: "per_unit_per_day",
    source: "in_house",
    exposure: "rolled_up",
    short_description: "Serving equipment cost absorbed into dining and catering setups.",
    description: "Supporting dining service equipment used in buffet, thermal, and plated food presentation.",
    category_ids: allCategoryIds,
  },
  {
    code: "KD-04",
    name: "Gas / Bhatti / Cooking Range Setup",
    slug: "gas-bhatti-cooking-range-setup",
    service_group: "kitchen-and-dining-equipment",
    pricing_model: "per_setup",
    source: "in_house",
    exposure: "rolled_up",
    short_description: "Kitchen range setup rolled into larger dining and catering bundles.",
    description: "Cooking range support for large-scale kitchen operation during hosted functions.",
    category_ids: allCategoryIds,
  },
  {
    code: "KD-05",
    name: "Water Dispensers / Drums",
    slug: "water-dispensers-drums",
    service_group: "kitchen-and-dining-equipment",
    pricing_model: "per_unit_per_day",
    source: "in_house",
    exposure: "rolled_up",
    short_description: "Water support items absorbed into service bundles.",
    description: "Water dispensers and drums used for guest utility and kitchen support.",
    category_ids: allCategoryIds,
  },
  {
    code: "MP-04",
    name: "Cleaning & Housekeeping Staff",
    slug: "cleaning-housekeeping-staff",
    service_group: "manpower-and-staff",
    pricing_model: "per_person_per_shift",
    source: "in_house",
    exposure: "rolled_up",
    short_description: "Housekeeping support rolled into service charge and operational bundles.",
    description: "Cleaning and maintenance support staff used during active event service windows.",
    category_ids: allCategoryIds,
  },
  {
    code: "MP-05",
    name: "Setup & Dismantling Labour",
    slug: "setup-dismantling-labour",
    service_group: "manpower-and-staff",
    pricing_model: "per_person_per_day",
    source: "in_house",
    exposure: "internal",
    short_description: "Internal labour for event setup and dismantling.",
    description: "Behind-the-scenes labour for loading, installation, and breakdown operations.",
    category_ids: allCategoryIds,
  },
  {
    code: "MP-06",
    name: "Site Supervisor",
    slug: "site-supervisor",
    service_group: "manpower-and-staff",
    pricing_model: "per_person_per_day",
    source: "in_house",
    exposure: "internal",
    short_description: "Internal supervision support for event execution and site management.",
    description: "On-ground supervisory role covering coordination, operations, and service oversight.",
    category_ids: allCategoryIds,
  },
  {
    code: "MP-07",
    name: "Transport & Logistics",
    slug: "transport-logistics",
    service_group: "transport-and-logistics",
    pricing_model: "per_trip",
    source: "in_house",
    exposure: "internal",
    short_description: "Internal transport and logistics cost used in event execution.",
    description: "Movement, loading, route, and vehicle handling support for event service operations.",
    category_ids: allCategoryIds,
  },
  {
    code: "CT-07",
    name: "Catering Staff & Kitchen Labour",
    slug: "catering-staff-kitchen-labour",
    service_group: "food-and-catering",
    pricing_model: "per_person_per_shift",
    source: "vendor",
    exposure: "rolled_up",
    short_description: "Kitchen labour cost absorbed into catering package pricing.",
    description: "Operational food service labour used to support catering output and live counters.",
    category_ids: allCategoryIds,
  },
  {
    code: "BR-12",
    name: "Baraat Route Coordination",
    slug: "baraat-route-coordination",
    service_group: "baraat-and-transport",
    pricing_model: "per_event",
    source: "vendor",
    exposure: "rolled_up",
    short_description: "Procession route coordination absorbed into baraat arrangements.",
    description: "Supporting coordination service for procession route movement and operational handling.",
    category_ids: ["wedding-functions"],
  },
  {
    code: "VN-05",
    name: "Client-owned Venue",
    slug: "client-owned-venue",
    service_group: "venue-coordination",
    pricing_model: "not_billed",
    source: "coordination",
    exposure: "excluded",
    short_description: "Client-owned venue option with no venue fee billed by us.",
    description: "Client-supplied venue option that is not billed but affects setup scope and quotation.",
    category_ids: allCategoryIds,
  },
];

function withLayer1Shape(
  product: (typeof draftProductSeedData)[number]
): FinalLayeredProductSeed {
  return {
    id: product.id,
    code: product.code,
    name: product.name,
    slug: product.slug,
    layer: 1,
    node_type: "l1_item",
    item_type: "l1_item",
    category_ids: product.category_ids as ProductCategoryId[],
    short_description: product.short_description,
    description: product.description,
    pricing_model: product.pricing_model,
    service_group: product.service_group,
    source: "vendor",
    thumbnail_url: product.thumbnail_url,
    banner_url: product.banner_url ?? "",
    image_urls: product.image_urls,
    service_highlights: product.service_highlights,
    included_items: product.included_items,
    ideal_for: product.ideal_for,
    pricing_notes: product.pricing_notes,
    faq: product.faq as Array<{ question: string; answer: string }> | undefined,
    terms_and_conditions: product.terms_and_conditions,
    availability_note: product.availability_note,
    price_tiers: product.price_tiers,
    quotation_config: product.quotation_config,
    search_tags: product.search_tags,
    search_text: product.search_text,
    is_featured: product.is_featured,
    is_active: product.is_active,
    sort_order: product.sort_order,
    exposure: "shown",
    customer_selectable: true,
    quotation_enabled: product.quotation_config.quotation_enabled,
  };
}

function withSupplementShape(
  product: L1Supplement,
  sortOrder: number
): FinalLayeredProductSeed {
  return {
    id: product.slug,
    code: product.code,
    name: product.name,
    slug: product.slug,
    layer: 1,
    node_type: "l1_item",
    item_type: "l1_item",
    category_ids: product.category_ids,
    short_description: product.short_description,
    description: product.description,
    pricing_model: product.pricing_model,
    service_group: product.service_group,
    source: product.source,
    thumbnail_url: defaultProductThumbnailUrl,
    banner_url: defaultProductBannerUrl,
    image_urls: defaultProductImageUrls,
    price_tiers: defaultPriceTiers,
    quotation_config: makeManualReviewConfig(),
    search_tags: [product.code.toLowerCase(), product.name.toLowerCase()],
    search_text: `${product.code} ${product.name} ${product.short_description}`.toLowerCase(),
    is_featured: false,
    is_active: true,
    sort_order: sortOrder,
    exposure: product.exposure,
    customer_selectable:
      product.exposure === "shown" || product.exposure === "on_request",
    quotation_enabled:
      product.exposure === "shown" || product.exposure === "on_request",
  };
}

const l1BaseSeeds = draftProductSeedData.map(withLayer1Shape);
const l1SupplementSeeds = supplementalL1Products.map((product, index) =>
  withSupplementShape(product, l1BaseSeeds.length + index + 1)
);

const l1Seeds = [...l1BaseSeeds, ...l1SupplementSeeds];

const codeToId = new Map(l1Seeds.map((product) => [product.code, product.id]));
const bundleCodeToId = new Map(
  bundleDefinitions.map((bundle) => [bundle.code, bundle.slug])
);

const bundleCategoryMap = new Map<string, ProductCategoryId[]>();
for (const eventType of eventTypeDefinitions) {
  for (const coreCode of eventType.core_bundle_codes) {
    const current = bundleCategoryMap.get(coreCode) ?? [];
    if (!current.includes(eventType.category_id)) {
      current.push(eventType.category_id);
    }
    bundleCategoryMap.set(coreCode, current);
  }

  for (const optionalCode of eventType.optional_bundle_codes) {
    const current = bundleCategoryMap.get(optionalCode) ?? [];
    if (!current.includes(eventType.category_id)) {
      current.push(eventType.category_id);
    }
    bundleCategoryMap.set(optionalCode, current);
  }
}

const bundleSeeds: FinalLayeredProductSeed[] = bundleDefinitions.map(
  (bundle, index) => ({
    id: bundle.slug,
    code: bundle.code,
    name: bundle.name,
    slug: bundle.slug,
    layer: 2,
    node_type: "bundle",
    item_type: "bundle",
    category_ids: bundleCategoryMap.get(bundle.code) ?? allCategoryIds,
    short_description: `${bundle.name} bundle assembled from linked service components.`,
    description: `${bundle.name} is an L2 bundle that groups related L1 services and scales by ${bundle.scales_by}.`,
    pricing_model: "bundle_rollup",
    service_group: "bundle",
    source: "coordination",
    thumbnail_url: defaultProductThumbnailUrl,
    banner_url: defaultProductBannerUrl,
    image_urls: defaultProductImageUrls,
    price_tiers: defaultPriceTiers,
    quotation_config: makeBundleQuotationConfig(bundle.scales_by),
    pricing_notes: [
      "Bundle price is rolled up from linked L1 items and reviewed before final quotation.",
    ],
    component_product_ids: bundle.component_codes
      .map((code) => codeToId.get(code))
      .filter((value): value is string => Boolean(value)),
    search_tags: [bundle.code.toLowerCase(), bundle.name.toLowerCase(), "bundle"],
    search_text: `${bundle.code} ${bundle.name} bundle ${bundle.scales_by}`.toLowerCase(),
    is_featured: bundle.code === "B-01" || bundle.code === "B-09",
    is_active: true,
    sort_order: index + 1,
    exposure: "shown",
    customer_selectable: true,
    quotation_enabled: true,
  })
);

const eventTypeSeeds: FinalLayeredProductSeed[] = eventTypeDefinitions.map(
  (eventType, index) => ({
    id: eventType.slug,
    code: eventType.code,
    name: eventType.name,
    slug: eventType.slug,
    layer: 3,
    node_type: "event_type",
    item_type: "event_type",
    category_ids: [eventType.category_id],
    short_description: `${eventType.name} event flow with pre-ticked core bundles and optional add-ons.`,
    description: `${eventType.name} is an L3 event type product that loads core bundles by default and exposes optional bundle add-ons.`,
    pricing_model: "event_template",
    service_group: "event-type",
    thumbnail_url: defaultProductThumbnailUrl,
    banner_url: defaultProductBannerUrl,
    image_urls: defaultProductImageUrls,
    price_tiers: defaultPriceTiers,
    quotation_config: makeManualReviewConfig({
      quantity_required: false,
      duration_required: false,
    }),
    pricing_notes: [
      "Event-type pricing is assembled from selected core and optional bundles during quotation review.",
    ],
    core_product_ids: eventType.core_bundle_codes
      .map((code) => bundleCodeToId.get(code))
      .filter((value): value is string => Boolean(value)),
    optional_product_ids: eventType.optional_bundle_codes
      .map((code) => bundleCodeToId.get(code))
      .filter((value): value is string => Boolean(value)),
    search_tags: [eventType.name.toLowerCase(), "event type", eventType.category_id],
    search_text: `${eventType.code} ${eventType.name} ${eventType.category_id}`.toLowerCase(),
    is_featured: eventType.category_id === "wedding-functions",
    is_active: true,
    sort_order: index + 1,
    exposure: "shown",
    customer_selectable: true,
    quotation_enabled: true,
  })
);

export const finalLayeredProductSeedData: FinalLayeredProductSeed[] = [
  ...l1Seeds,
  ...bundleSeeds,
  ...eventTypeSeeds,
];
