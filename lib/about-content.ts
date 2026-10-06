// Content for the About page. The shapes below are what the components render.
// To move this to Firestore later, read a document shaped like `AboutContent`
// (snake_case fields, same as the other collections) inside `getAboutContent()`
// and keep returning `AboutContent`; the components and page need no changes.

export type AboutStory = {
  eyebrow: string;
  heading: string;
  highlighted_heading: string;
  paragraphs: string[];
  image_url: string;
  image_alt: string;
};

export type AboutStat = {
  id: string;
  value: string;
  label: string;
};

export type AboutStatsSection = {
  eyebrow: string;
  title: string;
  stats: AboutStat[];
};

export type AboutContent = {
  story: AboutStory;
  stats_section: AboutStatsSection;
};

export const defaultAboutContent: AboutContent = {
  story: {
    eyebrow: "Our Story",
    heading: "Making Every Event",
    highlighted_heading: "Unforgettable.",
    paragraphs: [
      "TentWala is a trusted event planning and execution partner focused on weddings, family celebrations, and premium hosted experiences. We bring together venue support, decor styling, catering coordination, photography, and guest-focused service in one smooth planning journey.",
      "With a practical booking flow and carefully organized service categories, we help clients move from inspiration to quotation with clarity. Our goal is simple: make every celebration feel polished, memorable, and beautifully managed from start to finish.",
    ],
    // Save the pink floral arch photo as public/about_story.png.
    image_url: "/about_story.png",
    image_alt: "Floral arch decoration set up by TentWala",
  },
  stats_section: {
    eyebrow: "Our Track Record",
    title: "Why Clients Trust TentWala",
    stats: [
      { id: "years", value: "22+", label: "Years of Experience" },
      { id: "weddings", value: "800+", label: "Wedding Events" },
      { id: "birthdays", value: "500+", label: "Birthday Decorations" },
      { id: "corporate", value: "200+", label: "Corporate Events" },
    ],
  },
};

// Single entry point for the About page's data. Static for now.
export async function getAboutContent(): Promise<AboutContent> {
  return defaultAboutContent;
}
