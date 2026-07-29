import Link from "next/link";
import { SiteHeader } from "@/components/site-header";

const galleryHighlights = [
  "Wedding venue setups",
  "Stage and decor transformations",
  "Dining, catering, and hospitality moments",
  "Premium event styling details",
];

export default function GalleryPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(223,242,245,0.95)_0%,_rgba(223,242,245,0.82)_18%,_rgba(248,251,248,0.96)_42%,_rgba(255,250,245,0.98)_68%,_rgba(245,236,226,0.92)_100%)] px-4 py-6 text-zinc-950 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-none flex-col gap-6">
        <SiteHeader active="gallery" />

        <section className="rounded-[2rem] border border-[#d7dfde] bg-white/82 p-8 shadow-[0_18px_55px_rgba(40,50,64,0.07)] backdrop-blur sm:p-10">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#56b7c4]">
              Gallery
            </p>
            <h1 className="font-serif text-4xl text-[#1d2d44] sm:text-5xl">
              A curated view of event execution
            </h1>
            <p className="max-w-3xl text-base leading-8 text-zinc-700 sm:text-lg">
              This page can later hold real event photos, category galleries,
              and premium client showcase content.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {galleryHighlights.map((item) => (
              <div
                key={item}
                className="rounded-[1.75rem] bg-[linear-gradient(135deg,#edf8f9_0%,#ffffff_55%,#f8efe6_100%)] p-6 shadow-[0_14px_34px_rgba(40,50,64,0.06)]"
              >
                <p className="font-serif text-2xl text-[#1d2d44]">{item}</p>
              </div>
            ))}
          </div>

          <div className="mt-8">
            <Link
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#15518c] px-7 text-sm font-semibold uppercase tracking-[0.08em] text-white transition hover:bg-[#0f4f8b]"
              href="/contact"
            >
              Book Now
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
