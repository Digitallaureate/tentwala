export type ProductLayer = 1 | 2 | 3;

export type ProductNodeType = "l1_item" | "bundle" | "event_type";

export type ProductCategoryId =
  | "wedding-functions"
  | "family-friends-gatherings"
  | "corporate-institutional"
  | "religious-domestic-ceremonies";

export type ProductRelationFields = {
  component_product_ids?: string[];
  core_product_ids?: string[];
  optional_product_ids?: string[];
};

export type LayeredProductSeed = {
  id: string;
  code: string;
  name: string;
  slug: string;
  layer: ProductLayer;
  node_type: ProductNodeType;
  category_ids: ProductCategoryId[];
  short_description: string;
  description: string;
  pricing_model: string;
  service_group?: string;
  source?: "in_house" | "vendor" | "coordination" | "referral_only";
  search_tags: string[];
  search_text: string;
  is_featured: boolean;
  is_active: boolean;
  sort_order: number;
} & ProductRelationFields;

export type BundleDefinition = {
  code: string;
  name: string;
  slug: string;
  component_codes: string[];
  scales_by: string;
};

export type EventTypeDefinition = {
  code: string;
  name: string;
  slug: string;
  category_id: ProductCategoryId;
  core_bundle_codes: string[];
  optional_bundle_codes: string[];
};

function makeSearchText(parts: string[]) {
  return parts.join(" ").toLowerCase();
}

export const bundleDefinitions: BundleDefinition[] = [
  {
    code: "B-01",
    name: "Tent & Canopy Setup",
    slug: "tent-canopy-setup-bundle",
    component_codes: ["TS-01", "TS-02", "TS-03", "TS-04", "TS-05", "FC-01", "DC-02", "PW-02"],
    scales_by: "decoration_area_sq_ft",
  },
  {
    code: "B-02",
    name: "Seating Setup",
    slug: "seating-setup-bundle",
    component_codes: ["SF-01", "SF-02", "SF-03", "SF-04", "SF-05", "SF-06", "SF-08", "FC-01"],
    scales_by: "guest_count",
  },
  {
    code: "B-03",
    name: "Dining & Kitchen Setup",
    slug: "dining-kitchen-setup-bundle",
    component_codes: ["KD-01", "KD-02", "KD-03", "KD-04", "KD-05", "SF-06", "MP-01"],
    scales_by: "catering_headcount",
  },
  {
    code: "B-04",
    name: "Stage Setup",
    slug: "stage-setup-bundle",
    component_codes: ["ST-01", "ST-02", "ST-03", "DC-01", "DC-02"],
    scales_by: "stage_area_sq_ft",
  },
  {
    code: "B-05",
    name: "Basic Decor Package",
    slug: "basic-decor-package-bundle",
    component_codes: ["DC-01", "DC-02", "DC-03", "DC-04", "ST-03"],
    scales_by: "decoration_area_sq_ft",
  },
  {
    code: "B-06",
    name: "Premium Decor Package",
    slug: "premium-decor-package-bundle",
    component_codes: ["DP-01", "DP-02", "DP-03", "DP-04"],
    scales_by: "decoration_area_sq_ft",
  },
  {
    code: "B-07",
    name: "Power Package",
    slug: "power-package-bundle",
    component_codes: ["PW-01", "PW-02", "PW-03", "PW-04"],
    scales_by: "kva_x_days",
  },
  {
    code: "B-08",
    name: "Guest Services Staff",
    slug: "guest-services-staff-bundle",
    component_codes: ["MP-01", "MP-02", "MP-03"],
    scales_by: "guest_count_plus_duration",
  },
  {
    code: "B-09",
    name: "Catering Package",
    slug: "catering-package-bundle",
    component_codes: ["CT-01", "CT-02", "CT-03", "CT-04", "CT-05", "CT-06", "CT-07"],
    scales_by: "catering_headcount",
  },
  {
    code: "B-10",
    name: "Entertainment Package",
    slug: "entertainment-package-bundle",
    component_codes: ["EN-01", "EN-02", "EN-03", "EN-04", "EN-05", "EN-06"],
    scales_by: "per_event_selection",
  },
  {
    code: "B-11",
    name: "Photography Package",
    slug: "photography-package-bundle",
    component_codes: ["PH-01", "PH-02", "PH-03", "PH-04", "PH-05", "PH-06"],
    scales_by: "number_of_functions",
  },
  {
    code: "B-12",
    name: "Guest Stay Setup",
    slug: "guest-stay-setup-bundle",
    component_codes: ["SF-07", "FC-01", "TS-01"],
    scales_by: "number_of_guests_staying",
  },
  {
    code: "B-13",
    name: "Baraat Arrangement",
    slug: "baraat-arrangement-bundle",
    component_codes: ["BR-01", "BR-02", "BR-03", "BR-04", "BR-05", "BR-06", "BR-07", "BR-08", "BR-09", "BR-10", "BR-11", "BR-12"],
    scales_by: "per_event_selection",
  },
  {
    code: "B-14",
    name: "Service Charge (Embedded)",
    slug: "service-charge-embedded-bundle",
    component_codes: ["MP-04", "MP-05", "MP-06", "MP-07", "TS-05", "PW-02"],
    scales_by: "40_percent_bundle_subtotal",
  },
  {
    code: "B-15",
    name: "Venue Coordination",
    slug: "venue-coordination-bundle",
    component_codes: ["VN-01", "VN-02"],
    scales_by: "flat_coordination_fee",
  },
];

export const eventTypeDefinitions: EventTypeDefinition[] = [
  {
    code: "L3-WF-ENGAGEMENT",
    name: "Engagement / Ring Ceremony",
    slug: "engagement-ring-ceremony",
    category_id: "wedding-functions",
    core_bundle_codes: ["B-01", "B-02", "B-04", "B-05", "B-07", "B-14"],
    optional_bundle_codes: ["B-03", "B-06", "B-08", "B-09", "B-10", "B-11", "B-15"],
  },
  {
    code: "L3-WF-HALDI",
    name: "Haldi Ceremony",
    slug: "haldi-ceremony",
    category_id: "wedding-functions",
    core_bundle_codes: ["B-01", "B-02", "B-05", "B-07", "B-14"],
    optional_bundle_codes: ["B-03", "B-09", "B-11"],
  },
  {
    code: "L3-WF-MEHENDI",
    name: "Mehendi Ceremony",
    slug: "mehendi-ceremony",
    category_id: "wedding-functions",
    core_bundle_codes: ["B-01", "B-02", "B-05", "B-07", "B-14"],
    optional_bundle_codes: ["B-03", "B-06", "B-09", "B-10", "B-11"],
  },
  {
    code: "L3-WF-SANGEET",
    name: "Sangeet",
    slug: "sangeet",
    category_id: "wedding-functions",
    core_bundle_codes: ["B-01", "B-02", "B-04", "B-05", "B-07", "B-14"],
    optional_bundle_codes: ["B-03", "B-06", "B-09", "B-10", "B-11"],
  },
  {
    code: "L3-WF-LAGAN",
    name: "Lagan / Tilak Ceremony",
    slug: "lagan-tilak-ceremony",
    category_id: "wedding-functions",
    core_bundle_codes: ["B-01", "B-02", "B-05", "B-07", "B-14"],
    optional_bundle_codes: ["B-03", "B-09", "B-11"],
  },
  {
    code: "L3-WF-BARAAT",
    name: "Baraat",
    slug: "baraat",
    category_id: "wedding-functions",
    core_bundle_codes: ["B-13", "B-14"],
    optional_bundle_codes: ["B-07", "B-11"],
  },
  {
    code: "L3-WF-WEDDING",
    name: "Wedding Ceremony (Main)",
    slug: "wedding-ceremony-main",
    category_id: "wedding-functions",
    core_bundle_codes: ["B-01", "B-02", "B-03", "B-04", "B-05", "B-07", "B-08", "B-14"],
    optional_bundle_codes: ["B-06", "B-09", "B-10", "B-11", "B-12", "B-13"],
  },
  {
    code: "L3-WF-RECEPTION",
    name: "Reception",
    slug: "reception",
    category_id: "wedding-functions",
    core_bundle_codes: ["B-01", "B-02", "B-03", "B-04", "B-05", "B-07", "B-08", "B-14"],
    optional_bundle_codes: ["B-06", "B-09", "B-10", "B-11"],
  },
  {
    code: "L3-FF-BIRTHDAY",
    name: "Birthday Celebration",
    slug: "birthday-celebration",
    category_id: "family-friends-gatherings",
    core_bundle_codes: ["B-01", "B-02", "B-05", "B-07", "B-14"],
    optional_bundle_codes: ["B-03", "B-06", "B-09", "B-10", "B-11"],
  },
  {
    code: "L3-FF-ANNIVERSARY",
    name: "Anniversary Celebration",
    slug: "anniversary-celebration",
    category_id: "family-friends-gatherings",
    core_bundle_codes: ["B-01", "B-02", "B-05", "B-07", "B-14"],
    optional_bundle_codes: ["B-03", "B-06", "B-09", "B-10", "B-11"],
  },
  {
    code: "L3-FF-GETTOGETHER",
    name: "Friends / Family Get-together",
    slug: "friends-family-get-together",
    category_id: "family-friends-gatherings",
    core_bundle_codes: ["B-01", "B-02", "B-07", "B-14"],
    optional_bundle_codes: ["B-03", "B-05", "B-09", "B-10", "B-15"],
  },
  {
    code: "L3-FF-FESTIVAL-PARTY",
    name: "Holi / Diwali / New Year Party",
    slug: "festival-party",
    category_id: "family-friends-gatherings",
    core_bundle_codes: ["B-01", "B-02", "B-05", "B-07", "B-14"],
    optional_bundle_codes: ["B-03", "B-06", "B-09", "B-10", "B-11", "B-15"],
  },
  {
    code: "L3-CI-CORPORATE",
    name: "Corporate Event / Dealer Meet",
    slug: "corporate-event-dealer-meet",
    category_id: "corporate-institutional",
    core_bundle_codes: ["B-01", "B-02", "B-04", "B-05", "B-07", "B-08", "B-14"],
    optional_bundle_codes: ["B-03", "B-06", "B-09", "B-10", "B-11"],
  },
  {
    code: "L3-CI-SCHOOL",
    name: "School Function / Annual Day",
    slug: "school-function-annual-day",
    category_id: "corporate-institutional",
    core_bundle_codes: ["B-01", "B-02", "B-04", "B-07", "B-14"],
    optional_bundle_codes: ["B-05", "B-08", "B-09", "B-11"],
  },
  {
    code: "L3-CI-COLLEGE",
    name: "College Fest",
    slug: "college-fest",
    category_id: "corporate-institutional",
    core_bundle_codes: ["B-01", "B-02", "B-04", "B-07", "B-08", "B-14"],
    optional_bundle_codes: ["B-05", "B-09", "B-10", "B-11"],
  },
  {
    code: "L3-CI-CONVOCATION",
    name: "Convocation Ceremony",
    slug: "convocation-ceremony",
    category_id: "corporate-institutional",
    core_bundle_codes: ["B-01", "B-02", "B-04", "B-05", "B-07", "B-08", "B-14"],
    optional_bundle_codes: ["B-03", "B-09", "B-11"],
  },
  {
    code: "L3-CI-GOVT",
    name: "Government Function / Camp",
    slug: "government-function-camp",
    category_id: "corporate-institutional",
    core_bundle_codes: ["B-01", "B-02", "B-04", "B-07", "B-14"],
    optional_bundle_codes: ["B-05", "B-08", "B-09"],
  },
  {
    code: "L3-CI-EXHIBITION",
    name: "Exhibition / Trade Stall",
    slug: "exhibition-trade-stall",
    category_id: "corporate-institutional",
    core_bundle_codes: ["B-01", "B-07", "B-14"],
    optional_bundle_codes: ["B-02", "B-05", "B-08"],
  },
  {
    code: "L3-RD-KUA-PUJAN",
    name: "Kua Pujan",
    slug: "kua-pujan",
    category_id: "religious-domestic-ceremonies",
    core_bundle_codes: ["B-01", "B-02", "B-05", "B-07", "B-14"],
    optional_bundle_codes: ["B-03", "B-09"],
  },
  {
    code: "L3-RD-GRIH-PRAVESH",
    name: "Grih Pravesh / Housewarming",
    slug: "grih-pravesh-housewarming",
    category_id: "religious-domestic-ceremonies",
    core_bundle_codes: ["B-01", "B-02", "B-05", "B-07", "B-14"],
    optional_bundle_codes: ["B-03", "B-09", "B-11"],
  },
  {
    code: "L3-RD-HAVAN",
    name: "Havan / Yagya",
    slug: "havan-yagya",
    category_id: "religious-domestic-ceremonies",
    core_bundle_codes: ["B-01", "B-02", "B-07", "B-14"],
    optional_bundle_codes: ["B-03", "B-05", "B-09"],
  },
  {
    code: "L3-RD-BHAJAN",
    name: "Bhajan & Kirtan Gathering",
    slug: "bhajan-kirtan-gathering",
    category_id: "religious-domestic-ceremonies",
    core_bundle_codes: ["B-01", "B-02", "B-04", "B-07", "B-14"],
    optional_bundle_codes: ["B-03", "B-05", "B-09", "B-10"],
  },
  {
    code: "L3-RD-JAGRAN",
    name: "Jagran / Mata ki Chowki",
    slug: "jagran-mata-ki-chowki",
    category_id: "religious-domestic-ceremonies",
    core_bundle_codes: ["B-01", "B-02", "B-04", "B-05", "B-07", "B-14"],
    optional_bundle_codes: ["B-03", "B-09", "B-10"],
  },
  {
    code: "L3-RD-MUNDAN",
    name: "Mundan / Naamkaran",
    slug: "mundan-naamkaran",
    category_id: "religious-domestic-ceremonies",
    core_bundle_codes: ["B-01", "B-02", "B-05", "B-07", "B-14"],
    optional_bundle_codes: ["B-03", "B-09", "B-11"],
  },
  {
    code: "L3-RD-PRAYER-MEET",
    name: "Prayer Meet / Uthala",
    slug: "prayer-meet-uthala",
    category_id: "religious-domestic-ceremonies",
    core_bundle_codes: ["B-01", "B-02", "B-07", "B-14"],
    optional_bundle_codes: ["B-05"],
  },
];

export const layeredBundleSeeds: LayeredProductSeed[] = bundleDefinitions.map(
  (bundle, index) => ({
    id: bundle.slug,
    code: bundle.code,
    name: bundle.name,
    slug: bundle.slug,
    layer: 2,
    node_type: "bundle",
    category_ids: [
      "wedding-functions",
      "family-friends-gatherings",
      "corporate-institutional",
      "religious-domestic-ceremonies",
    ],
    short_description: `${bundle.name} bundle stitched from internal service items.`,
    description: `${bundle.name} is an L2 bundle that rolls up multiple L1 items and scales by ${bundle.scales_by}.`,
    pricing_model: "bundle_rollup",
    service_group: "bundle",
    source: "coordination",
    component_product_ids: bundle.component_codes.map((code) =>
      code.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
    ),
    search_tags: [bundle.code.toLowerCase(), bundle.name.toLowerCase()],
    search_text: makeSearchText([bundle.code, bundle.name, bundle.scales_by]),
    is_featured: false,
    is_active: true,
    sort_order: index + 1,
  })
);

export const layeredEventTypeSeeds: LayeredProductSeed[] =
  eventTypeDefinitions.map((eventType, index) => ({
    id: eventType.slug,
    code: eventType.code,
    name: eventType.name,
    slug: eventType.slug,
    layer: 3,
    node_type: "event_type",
    category_ids: [eventType.category_id],
    short_description: `${eventType.name} event flow with pre-ticked core bundles and optional add-ons.`,
    description: `${eventType.name} is an L3 selectable event type that loads core bundles and optional bundle add-ons by default.`,
    pricing_model: "event_template",
    service_group: "event-type",
    core_product_ids: eventType.core_bundle_codes.map((code) =>
      bundleDefinitions.find((bundle) => bundle.code === code)?.slug ?? code
    ),
    optional_product_ids: eventType.optional_bundle_codes.map((code) =>
      bundleDefinitions.find((bundle) => bundle.code === code)?.slug ?? code
    ),
    search_tags: [eventType.name.toLowerCase(), "event type", eventType.category_id],
    search_text: makeSearchText([
      eventType.code,
      eventType.name,
      eventType.category_id,
      ...eventType.core_bundle_codes,
      ...eventType.optional_bundle_codes,
    ]),
    is_featured: eventType.category_id === "wedding-functions",
    is_active: true,
    sort_order: index + 1,
  }));
