"use client";

import { useState } from "react";
import { collection, doc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  finalLayeredProductSeedData,
} from "@/lib/final-layered-product-seed";

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

const categoriesRef = collection(db, "product_categories");
const categoryDetailsRef = collection(db, "category_details");
const productsRef = collection(db, "products");

function stripUndefined<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => stripUndefined(item)) as T;
  }

  if (value && typeof value === "object") {
    const entries = Object.entries(value).filter(([, entryValue]) => entryValue !== undefined);

    return Object.fromEntries(
      entries.map(([entryKey, entryValue]) => [entryKey, stripUndefined(entryValue)])
    ) as T;
  }

  return value;
}

const categorySeedData: Category[] = [
  {
    id: "wedding-functions",
    name: "Wedding Functions",
    slug: "wedding-functions",
    short_description:
      "Complete tent and event services for wedding-related functions.",
    description:
      "Tent, seating, decoration, catering, stage, lighting, power, photography and other arrangements for engagement, haldi, mehendi, sangeet, wedding and reception functions.",
    thumbnail_url: "https://firebasestorage.googleapis.com/v0/b/ecostory-b31b6.firebasestorage.app/o/wedding%2Ftent1.png?alt=media&token=7a424ea4-0ff7-4539-bb05-26e106d6e8a3",
    banner_url: "https://firebasestorage.googleapis.com/v0/b/ecostory-b31b6.firebasestorage.app/o/wedding%2Ftent2.png?alt=media&token=125cae6b-7890-4b03-ac51-2eb53113d076",
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

    thumbnail_url: "https://firebasestorage.googleapis.com/v0/b/ecostory-b31b6.firebasestorage.app/o/wedding%2Ftent1.png?alt=media&token=7a424ea4-0ff7-4539-bb05-26e106d6e8a3",
    banner_url: "https://firebasestorage.googleapis.com/v0/b/ecostory-b31b6.firebasestorage.app/o/wedding%2Ftent2.png?alt=media&token=125cae6b-7890-4b03-ac51-2eb53113d076",
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

    thumbnail_url: "https://firebasestorage.googleapis.com/v0/b/ecostory-b31b6.firebasestorage.app/o/wedding%2Ftent1.png?alt=media&token=7a424ea4-0ff7-4539-bb05-26e106d6e8a3",
    banner_url: "https://firebasestorage.googleapis.com/v0/b/ecostory-b31b6.firebasestorage.app/o/wedding%2Ftent2.png?alt=media&token=125cae6b-7890-4b03-ac51-2eb53113d076",

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

    thumbnail_url: "https://firebasestorage.googleapis.com/v0/b/ecostory-b31b6.firebasestorage.app/o/wedding%2Ftent1.png?alt=media&token=7a424ea4-0ff7-4539-bb05-26e106d6e8a3",
    banner_url: "https://firebasestorage.googleapis.com/v0/b/ecostory-b31b6.firebasestorage.app/o/wedding%2Ftent2.png?alt=media&token=125cae6b-7890-4b03-ac51-2eb53113d076",


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

const productSeedData = finalLayeredProductSeedData;

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
          ...stripUndefined(category),
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
          ...stripUndefined(product),
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
          ...stripUndefined(categoryDetail),
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
        <p className="text-sm leading-6 text-zinc-500">
          Re-uploading products will refresh existing product documents with the
          latest schema, including media placeholders, price tiers, and
          quotation config.
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
