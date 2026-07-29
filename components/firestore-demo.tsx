"use client";

import { useState } from "react";
import { collection, doc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

type Category = {
  id: string;
  name: string;
  slug: string;
  short_description: string;
  description: string;
  thumbnail_url: string;
  banner_url: string;
  sort_order: number;
  is_featured: boolean;
  is_active: boolean;
};

type CategoryDetail = {
  id: string;
  category_id: string;
  description: string;
  banner_url: string;
  image_urls: string[];
  service_highlights: string[];
  starting_price: number;
  price_note: string;
  meta_title: string;
  meta_description: string;
  faq: Array<{
    question: string;
    answer: string;
  }>;
};

type PriceTier = {
  label: string;
  minimum_price: number;
  maximum_price: number;
};

type Product = {
  id: string;
  name: string;
  slug: string;
  item_type: "event_type" | "service";
  service_group?: string;
  category_ids: string[];
  event_type_ids?: string[];
  short_description: string;
  description: string;
  thumbnail_url: string;
  banner_url?: string;
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
  pricing_model: string;
  price_tiers: {
    low: PriceTier;
    medium: PriceTier;
    high: PriceTier;
  };
  quotation_config: {
    quotation_enabled: boolean;
    quantity_required: boolean;
    duration_required: boolean;
    manual_review_required: boolean;
    quantity_label?: string;
    quantity_unit?: string;
    minimum_quantity?: number;
    duration_label?: string;
    duration_unit?: string;
    minimum_duration?: number;
  };
  search_tags: string[];
  search_text: string;
  sort_order: number;
  is_featured: boolean;
  is_active: boolean;
};

const categoriesRef = collection(db, "product_categories");
const categoryDetailsRef = collection(db, "category_details");
const productsRef = collection(db, "products");

const categorySeedData: Category[] = [
  {
    id: "wedding-functions",
    name: "Wedding Functions",
    slug: "wedding-functions",
    short_description:
      "Complete tent and event services for wedding-related functions.",
    description:
      "Tent, seating, decoration, catering, stage, lighting, power, photography and other arrangements for engagement, haldi, mehendi, sangeet, wedding and reception functions.",
    thumbnail_url: "",
    banner_url: "",

    sort_order: 1,
    is_featured: true,
    is_active: true,
  },

  {
    id: "family-friends-gatherings",
    name: "Family & Friends Gatherings",
    slug: "family-friends-gatherings",

    short_description:
      "Event services for birthdays, anniversaries and family gatherings.",

    description:
      "Tent, seating, decoration, catering, music, lighting and other arrangements for birthdays, anniversaries, family get-togethers and festive celebrations.",

    thumbnail_url: "",
    banner_url: "",

    sort_order: 2,
    is_featured: true,
    is_active: true,
  },

  {
    id: "corporate-institutional",
    name: "Corporate & Institutional",
    slug: "corporate-institutional",

    short_description:
      "Professional event services for corporate and institutional programmes.",

    description:
      "Tent, seating, stage, sound, lighting, power, catering and staff support for corporate events, dealer meets, school functions, college festivals, convocations, exhibitions and government programmes.",

    thumbnail_url: "",
    banner_url: "",

    sort_order: 3,
    is_featured: true,
    is_active: true,
  },

  {
    id: "religious-domestic-ceremonies",
    name: "Religious & Domestic Ceremonies",
    slug: "religious-domestic-ceremonies",

    short_description:
      "Event arrangements for religious and domestic ceremonies.",

    description:
      "Tent, seating, stage, lighting, catering and other arrangements for grih pravesh, havan, jagran, bhajan, kirtan, mundan, naamkaran and prayer meetings.",

    thumbnail_url: "",
    banner_url: "",

    sort_order: 4,
    is_featured: true,
    is_active: true,
  },
];

const categoryDetailSeedData: CategoryDetail[] = [
  {
    id: "wedding-functions",
    category_id: "wedding-functions",
    description:
      "Explore tent setup, decoration, catering, DJ, photography, lighting and seating arrangements for engagement, haldi, wedding and reception functions.",
    banner_url: "",
    image_urls: [],
    service_highlights: [
      "Tent setup for wedding gatherings",
      "Stage decoration and floral styling",
      "Catering and guest seating arrangements",
      "Photography, lighting and DJ support",
    ],
    starting_price: 25000,
    price_note:
      "Final quotation depends on guest count, selected services and event duration.",
    meta_title: "Wedding Function Services | The TentWala",
    meta_description:
      "Browse tent, catering, decor, photography and event setup services for wedding functions.",
    faq: [
      {
        question: "Do you provide full wedding event setup?",
        answer:
          "Yes, we can manage tent, decor, seating, catering, lighting and photography arrangements.",
      },
      {
        question: "Can I book only selected services?",
        answer:
          "Yes, you can choose only the required services and the quotation can be prepared accordingly.",
      },
    ],
  },
  {
    id: "birthday-and-small-parties",
    category_id: "birthday-and-small-parties",
    description:
      "Discover tent setup, decoration, catering, music and seating support for birthday parties and smaller celebration events.",
    banner_url: "",
    image_urls: [],
    service_highlights: [
      "Theme-based decoration support",
      "Balloon and backdrop setup",
      "Food and refreshment arrangement",
      "Compact seating and sound setup",
    ],
    starting_price: 12000,
    price_note:
      "Quotation depends on guest count, service selection and event duration.",
    meta_title: "Birthday and Small Party Services | The TentWala",
    meta_description:
      "Explore tent, decor, food and event setup services for birthday parties and small gatherings.",
    faq: [
      {
        question: "Do you provide home birthday decoration?",
        answer:
          "Yes, we provide birthday setup solutions for both home and venue-based celebrations.",
      },
      {
        question: "Can I choose only decoration and chairs?",
        answer:
          "Yes, services can be selected individually based on your requirement.",
      },
    ],
  },
  {
    id: "corporate-events",
    category_id: "corporate-events",
    description:
      "Browse tent setup, branding, stage, seating, catering, photography and sound support for office functions, conferences and business programs.",
    banner_url: "",
    image_urls: [],
    service_highlights: [
      "Professional stage and branding setup",
      "Conference seating and guest arrangement",
      "Corporate catering support",
      "Photography, audio and lighting coordination",
    ],
    starting_price: 30000,
    price_note:
      "Final quotation depends on audience size, selected services and event duration.",
    meta_title: "Corporate Event Services | The TentWala",
    meta_description:
      "Discover professional event setup services for corporate meetings, conferences and company programs.",
    faq: [
      {
        question: "Do you support conferences and office programs?",
        answer:
          "Yes, we can arrange tenting, seating, branding, stage, catering and related event services.",
      },
      {
        question: "Can branding and display setup be included?",
        answer:
          "Yes, branding walls, welcome areas and display arrangements can be added to the quotation.",
      },
    ],
  },
  {
    id: "incorporate-event",
    category_id: "incorporate-event",
    description:
      "Explore tent, seating, lighting, decor and catering services for custom event arrangements under the incorporate event category.",
    banner_url: "",
    image_urls: [],
    service_highlights: [
      "Flexible tent and seating arrangements",
      "Custom decor and lighting support",
      "Food and service coordination",
      "Adaptable event setup options",
    ],
    starting_price: 18000,
    price_note:
      "Quotation depends on selected services, quantity and duration requirements.",
    meta_title: "Incorporate Event Services | The TentWala",
    meta_description:
      "Browse flexible tent, decor, seating and event arrangement services for incorporate events.",
    faq: [
      {
        question: "Can this category be used for custom event needs?",
        answer:
          "Yes, this category can support flexible event arrangements depending on the client requirement.",
      },
      {
        question: "Can I combine services from multiple product types?",
        answer:
          "Yes, the quotation can include a custom combination of required services.",
      },
    ],
  },
];

const productSeedData: Product[] = [
  {
    id: "engagement",
    name: "Engagement",
    slug: "engagement",
    item_type: "event_type",
    category_ids: ["wedding-functions"],
    short_description: "Arrangement flow for engagement ceremonies.",
    description:
      "Event type for engagement functions with decor, seating, lighting and service planning.",
    thumbnail_url: "",
    image_urls: [],
    pricing_model: "base_price",
    price_tiers: {
      low: { label: "Basic", minimum_price: 10000, maximum_price: 15000 },
      medium: { label: "Standard", minimum_price: 18000, maximum_price: 25000 },
      high: { label: "Premium", minimum_price: 30000, maximum_price: 45000 },
    },
    quotation_config: {
      quotation_enabled: true,
      quantity_required: false,
      duration_required: false,
      manual_review_required: false,
    },
    search_tags: [
      "engagement",
      "engagement ceremony",
      "ring ceremony",
      "wedding engagement",
      "engagement function",
    ],
    search_text:
      "engagement engagement ceremony ring ceremony wedding engagement engagement function",
    sort_order: 1,
    is_featured: true,
    is_active: true,
  },
  {
    id: "haldi",
    name: "Haldi",
    slug: "haldi",
    item_type: "event_type",
    category_ids: ["wedding-functions"],
    short_description: "Arrangement flow for haldi ceremonies.",
    description:
      "Event type for haldi celebrations with decor, seating and festive setup planning.",
    thumbnail_url: "",
    image_urls: [],
    pricing_model: "base_price",
    price_tiers: {
      low: { label: "Basic", minimum_price: 8000, maximum_price: 12000 },
      medium: { label: "Standard", minimum_price: 15000, maximum_price: 22000 },
      high: { label: "Premium", minimum_price: 25000, maximum_price: 38000 },
    },
    quotation_config: {
      quotation_enabled: true,
      quantity_required: false,
      duration_required: false,
      manual_review_required: false,
    },
    search_tags: [
      "haldi",
      "haldi ceremony",
      "haldi function",
      "wedding haldi",
      "haldi event",
    ],
    search_text:
      "haldi haldi ceremony haldi function wedding haldi haldi event",
    sort_order: 2,
    is_featured: true,
    is_active: true,
  },
  {
    id: "wedding",
    name: "Wedding",
    slug: "wedding",
    item_type: "event_type",
    category_ids: ["wedding-functions"],
    short_description: "Arrangement flow for main wedding functions.",
    description:
      "Event type for wedding day planning with tent, decor, catering and guest setup requirements.",
    thumbnail_url: "",
    image_urls: [],
    pricing_model: "base_price",
    price_tiers: {
      low: { label: "Basic", minimum_price: 20000, maximum_price: 30000 },
      medium: { label: "Standard", minimum_price: 40000, maximum_price: 60000 },
      high: { label: "Premium", minimum_price: 70000, maximum_price: 120000 },
    },
    quotation_config: {
      quotation_enabled: true,
      quantity_required: false,
      duration_required: false,
      manual_review_required: true,
    },
    search_tags: [
      "wedding",
      "wedding function",
      "marriage",
      "shaadi",
      "wedding event",
    ],
    search_text: "wedding wedding function marriage shaadi wedding event",
    sort_order: 3,
    is_featured: true,
    is_active: true,
  },
  {
    id: "reception",
    name: "Reception",
    slug: "reception",
    item_type: "event_type",
    category_ids: ["wedding-functions"],
    short_description: "Arrangement flow for wedding receptions.",
    description:
      "Event type for reception planning with stage, catering, photography and lighting support.",
    thumbnail_url: "",
    image_urls: [],
    pricing_model: "base_price",
    price_tiers: {
      low: { label: "Basic", minimum_price: 10000, maximum_price: 18000 },
      medium: { label: "Standard", minimum_price: 22000, maximum_price: 35000 },
      high: { label: "Premium", minimum_price: 40000, maximum_price: 65000 },
    },
    quotation_config: {
      quotation_enabled: true,
      quantity_required: false,
      duration_required: false,
      manual_review_required: false,
    },
    search_tags: [
      "reception",
      "wedding reception",
      "reception function",
      "reception event",
      "party reception",
    ],
    search_text:
      "reception wedding reception reception function reception event party reception",
    sort_order: 4,
    is_featured: true,
    is_active: true,
  },
  {
    id: "banquet-chair",
    name: "Banquet Chair",
    slug: "banquet-chair",
    item_type: "service",
    service_group: "chairs-and-seating",
    category_ids: [
      "wedding-functions",
      "birthday-and-small-parties",
      "corporate-events",
      "incorporate-event",
    ],
    event_type_ids: ["engagement", "haldi", "wedding", "reception"],
    short_description: "Banquet chairs for events.",
    description:
      "Available in basic, covered and premium options for multiple event types.",
    thumbnail_url: "",
    banner_url: "",
    image_urls: [],
    service_highlights: [
      "Banquet seating for weddings, receptions and public functions",
      "Basic, standard and premium chair options available",
      "Suitable for both indoor and outdoor venue arrangements",
    ],
    included_items: [
      "Chair delivery to event location",
      "Placement support as per seating layout",
      "Pickup after event completion",
    ],
    ideal_for: [
      "Wedding and reception guest seating",
      "Birthday parties and family functions",
      "Corporate and public events",
    ],
    pricing_notes: [
      "Final price depends on chair type, quantity and event duration.",
      "Transport charges may vary based on event location.",
      "Chair cover or decoration can be quoted separately if required.",
    ],
    faq: [
      {
        question: "Can I rent chairs for one day only?",
        answer:
          "Yes, banquet chairs can be booked for one day or for multiple days based on event need.",
      },
      {
        question: "Can chair covers and bows be added?",
        answer:
          "Yes, decorative chair covers and styling options can be added in the final quotation.",
      },
    ],
    terms_and_conditions: [
      "Minimum order quantity applies for chair booking.",
      "Damaged or missing chairs may be chargeable after the event.",
      "Final delivery timing depends on venue access and setup slot.",
    ],
    availability_note:
      "Advance booking is recommended during wedding season and festival dates.",
    pricing_model: "per_unit_per_day",
    price_tiers: {
      low: { label: "Basic", minimum_price: 30, maximum_price: 40 },
      medium: { label: "Standard", minimum_price: 50, maximum_price: 70 },
      high: { label: "Premium", minimum_price: 80, maximum_price: 120 },
    },
    quotation_config: {
      quotation_enabled: true,
      quantity_required: true,
      quantity_label: "Number of chairs",
      quantity_unit: "chair",
      minimum_quantity: 20,
      duration_required: true,
      duration_label: "Number of days",
      duration_unit: "day",
      minimum_duration: 1,
      manual_review_required: false,
    },
    search_tags: [
      "banquet chair",
      "chair",
      "chairs",
      "event chair",
      "wedding chair",
      "party chair",
      "chair rental",
      "seating",
    ],
    search_text:
      "banquet chair chair chairs event chair wedding chair party chair chair rental seating",
    sort_order: 5,
    is_featured: true,
    is_active: true,
  },
  {
    id: "tent-setup",
    name: "Tent Setup",
    slug: "tent-setup",
    item_type: "service",
    service_group: "tent-and-structure",
    category_ids: [
      "wedding-functions",
      "birthday-and-small-parties",
      "corporate-events",
      "incorporate-event",
    ],
    event_type_ids: ["engagement", "haldi", "wedding", "reception"],
    short_description: "Tent setup for small and large events.",
    description:
      "Tent structure setup for weddings, parties, corporate functions and large event arrangements.",
    thumbnail_url: "",
    image_urls: [],
    pricing_model: "per_event",
    price_tiers: {
      low: { label: "Basic", minimum_price: 15000, maximum_price: 25000 },
      medium: { label: "Standard", minimum_price: 30000, maximum_price: 50000 },
      high: { label: "Premium", minimum_price: 60000, maximum_price: 90000 },
    },
    quotation_config: {
      quotation_enabled: true,
      quantity_required: false,
      duration_required: true,
      duration_label: "Number of days",
      duration_unit: "day",
      minimum_duration: 1,
      manual_review_required: true,
    },
    search_tags: [
      "tent",
      "tent setup",
      "event tent",
      "wedding tent",
      "party tent",
      "tent rental",
      "pandal",
      "structure setup",
    ],
    search_text:
      "tent tent setup event tent wedding tent party tent tent rental pandal structure setup",
    sort_order: 6,
    is_featured: true,
    is_active: true,
  },
  {
    id: "catering-service",
    name: "Catering Service",
    slug: "catering-service",
    item_type: "service",
    service_group: "food-and-catering",
    category_ids: [
      "wedding-functions",
      "birthday-and-small-parties",
      "corporate-events",
      "incorporate-event",
    ],
    event_type_ids: ["engagement", "haldi", "wedding", "reception"],
    short_description: "Food and catering services for events.",
    description:
      "Flexible catering support for small gatherings, receptions, public programs and formal functions.",
    thumbnail_url: "",
    image_urls: [],
    pricing_model: "per_person",
    price_tiers: {
      low: { label: "Basic", minimum_price: 250, maximum_price: 350 },
      medium: { label: "Standard", minimum_price: 450, maximum_price: 650 },
      high: { label: "Premium", minimum_price: 800, maximum_price: 1200 },
    },
    quotation_config: {
      quotation_enabled: true,
      quantity_required: true,
      quantity_label: "Number of guests",
      quantity_unit: "person",
      minimum_quantity: 25,
      duration_required: false,
      manual_review_required: true,
    },
    search_tags: [
      "catering",
      "food service",
      "event catering",
      "wedding catering",
      "party catering",
      "caterer",
      "meal service",
      "buffet",
    ],
    search_text:
      "catering food service event catering wedding catering party catering caterer meal service buffet",
    sort_order: 7,
    is_featured: true,
    is_active: true,
  },
  {
    id: "dj-setup",
    name: "DJ Setup",
    slug: "dj-setup",
    item_type: "service",
    service_group: "music-and-entertainment",
    category_ids: [
      "wedding-functions",
      "birthday-and-small-parties",
      "corporate-events",
      "incorporate-event",
    ],
    event_type_ids: ["engagement", "haldi", "wedding", "reception"],
    short_description: "DJ and sound setup for celebrations.",
    description:
      "DJ console, speakers and music support for weddings, birthdays and event gatherings.",
    thumbnail_url: "",
    image_urls: [],
    pricing_model: "per_event",
    price_tiers: {
      low: { label: "Basic", minimum_price: 10000, maximum_price: 18000 },
      medium: { label: "Standard", minimum_price: 22000, maximum_price: 35000 },
      high: { label: "Premium", minimum_price: 40000, maximum_price: 65000 },
    },
    quotation_config: {
      quotation_enabled: true,
      quantity_required: false,
      duration_required: true,
      duration_label: "Number of days",
      duration_unit: "day",
      minimum_duration: 1,
      manual_review_required: false,
    },
    search_tags: [
      "dj",
      "dj setup",
      "music",
      "sound system",
      "event dj",
      "party dj",
      "dj rental",
      "entertainment",
    ],
    search_text:
      "dj dj setup music sound system event dj party dj dj rental entertainment",
    sort_order: 8,
    is_featured: true,
    is_active: true,
  },
  {
    id: "event-photography",
    name: "Event Photography",
    slug: "event-photography",
    item_type: "service",
    service_group: "photography-and-videography",
    category_ids: [
      "wedding-functions",
      "birthday-and-small-parties",
      "corporate-events",
      "incorporate-event",
    ],
    event_type_ids: ["engagement", "haldi", "wedding", "reception"],
    short_description: "Photography and videography services for events.",
    description:
      "Choose basic, standard or premium event photography services for multiple event types.",
    thumbnail_url: "",
    image_urls: [],
    pricing_model: "per_event",
    price_tiers: {
      low: { label: "Basic", minimum_price: 15000, maximum_price: 25000 },
      medium: { label: "Standard", minimum_price: 30000, maximum_price: 50000 },
      high: { label: "Premium", minimum_price: 60000, maximum_price: 100000 },
    },
    quotation_config: {
      quotation_enabled: true,
      quantity_required: false,
      duration_required: true,
      duration_label: "Number of days",
      duration_unit: "day",
      minimum_duration: 1,
      manual_review_required: true,
    },
    search_tags: [
      "photography",
      "event photography",
      "photographer",
      "videography",
      "camera service",
      "wedding photography",
      "party photography",
      "event videography",
    ],
    search_text:
      "photography event photography photographer videography camera service wedding photography party photography event videography",
    sort_order: 9,
    is_featured: true,
    is_active: true,
  },
  {
    id: "stage-decoration",
    name: "Stage Decoration",
    slug: "stage-decoration",
    item_type: "service",
    service_group: "decoration-and-stage",
    category_ids: [
      "wedding-functions",
      "birthday-and-small-parties",
      "corporate-events",
      "incorporate-event",
    ],
    event_type_ids: ["engagement", "haldi", "wedding", "reception"],
    short_description: "Stage decoration services for events.",
    description:
      "Backdrop, floral styling, lighting accents and presentation decor for event stages.",
    thumbnail_url: "",
    image_urls: [],
    pricing_model: "per_event",
    price_tiers: {
      low: { label: "Basic", minimum_price: 12000, maximum_price: 18000 },
      medium: { label: "Standard", minimum_price: 22000, maximum_price: 35000 },
      high: { label: "Premium", minimum_price: 40000, maximum_price: 70000 },
    },
    quotation_config: {
      quotation_enabled: true,
      quantity_required: false,
      duration_required: false,
      manual_review_required: true,
    },
    search_tags: [
      "stage decoration",
      "stage decor",
      "backdrop",
      "event decoration",
      "wedding stage",
      "party decoration",
      "stage setup",
      "decor",
    ],
    search_text:
      "stage decoration stage decor backdrop event decoration wedding stage party decoration stage setup decor",
    sort_order: 10,
    is_featured: true,
    is_active: true,
  },
];

export function FirestoreDemo() {
  const [error, setError] = useState("");
  const [isSeedingCategories, setIsSeedingCategories] = useState(false);
  const [isSeedingCategoryDetails, setIsSeedingCategoryDetails] = useState(false);
  const [isSeedingProducts, setIsSeedingProducts] = useState(false);
  const [seedStatus, setSeedStatus] = useState("");

  async function handleSeedCategories() {
    setIsSeedingCategories(true);
    setError("");
    setSeedStatus("");

    try {
      for (const category of categorySeedData) {
        await setDoc(doc(categoriesRef, category.id), {
          ...category,
          created_at: serverTimestamp(),
          updated_at: serverTimestamp(),
        });
      }

      setSeedStatus("Categories uploaded with fixed document IDs.");
    } catch (saveError) {
      console.error(saveError);
      setError("Could not upload category seed data to Firestore.");
    } finally {
      setIsSeedingCategories(false);
    }
  }

  async function handleSeedProducts() {
    setIsSeedingProducts(true);
    setError("");
    setSeedStatus("");

    try {
      for (const product of productSeedData) {
        await setDoc(doc(productsRef, product.id), {
          ...product,
          created_at: serverTimestamp(),
          updated_at: serverTimestamp(),
        });
      }

      setSeedStatus("Products uploaded with fixed document IDs.");
    } catch (saveError) {
      console.error(saveError);
      setError("Could not upload product seed data to Firestore.");
    } finally {
      setIsSeedingProducts(false);
    }
  }

  async function handleSeedCategoryDetails() {
    setIsSeedingCategoryDetails(true);
    setError("");
    setSeedStatus("");

    try {
      for (const categoryDetail of categoryDetailSeedData) {
        await setDoc(doc(categoryDetailsRef, categoryDetail.id), {
          ...categoryDetail,
          created_at: serverTimestamp(),
          updated_at: serverTimestamp(),
        });
      }

      setSeedStatus("Category details uploaded with fixed document IDs.");
    } catch (saveError) {
      console.error(saveError);
      setError("Could not upload category detail seed data to Firestore.");
    } finally {
      setIsSeedingCategoryDetails(false);
    }
  }

  return (
    <section className="rounded-[2rem] border border-zinc-300 bg-white p-6">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500">
          Firestore Utility
        </p>
        <h2 className="text-xl font-semibold text-zinc-900">Seed Demo Data</h2>
        <p className="text-sm leading-6 text-zinc-600">
          Upload the default category and product collections with fixed
          document IDs.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          className="h-11 rounded-full border border-zinc-900 bg-zinc-900 px-5 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:border-zinc-300 disabled:bg-zinc-300"
          disabled={isSeedingCategories}
          onClick={() => void handleSeedCategories()}
          type="button"
        >
          {isSeedingCategories ? "Uploading categories..." : "Upload categories"}
        </button>

        <button
          className="h-11 rounded-full border border-zinc-300 bg-white px-5 text-sm font-medium text-zinc-900 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:border-zinc-200 disabled:bg-zinc-100 disabled:text-zinc-400"
          disabled={isSeedingCategoryDetails}
          onClick={() => void handleSeedCategoryDetails()}
          type="button"
        >
          {isSeedingCategoryDetails
            ? "Uploading category details..."
            : "Upload category details"}
        </button>

        <button
          className="h-11 rounded-full border border-zinc-300 bg-white px-5 text-sm font-medium text-zinc-900 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:border-zinc-200 disabled:bg-zinc-100 disabled:text-zinc-400"
          disabled={isSeedingProducts}
          onClick={() => void handleSeedProducts()}
          type="button"
        >
          {isSeedingProducts ? "Uploading products..." : "Upload products"}
        </button>
      </div>

      {seedStatus ? (
        <p className="mt-3 text-sm text-emerald-700">{seedStatus}</p>
      ) : null}

      {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
    </section>
  );
}
