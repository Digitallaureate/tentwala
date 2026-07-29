import Link from "next/link";
import { HomeCategoryPreview } from "@/components/home-category-preview";
import { HomeProducts } from "@/components/home-products";
import { SiteHeader } from "@/components/site-header";

export default function Home() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(223,242,245,0.95)_0%,_rgba(223,242,245,0.82)_18%,_rgba(248,251,248,0.96)_42%,_rgba(255,250,245,0.98)_68%,_rgba(245,236,226,0.92)_100%)] px-4 py-6 text-zinc-950 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-none flex-col gap-6">
        <SiteHeader active="home" />

        <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[2rem] border border-[#d7dfde] bg-white/82 p-7 shadow-[0_18px_55px_rgba(40,50,64,0.08)] backdrop-blur sm:p-10">
            <div className="space-y-5">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#56b7c4]">
                Wedding and Event Planning
              </p>
              <h1 className="max-w-3xl font-serif text-4xl leading-tight text-[#1d2d44] sm:text-5xl lg:text-6xl">
                Premium celebrations planned with style, care, and a smooth
                booking journey.
              </h1>
              <p className="max-w-2xl text-base leading-8 text-zinc-700 sm:text-lg">
                TentWala brings venues, decorations, food, and event execution
                together in one place so clients can explore services, browse
                products, and request quotations without confusion.
              </p>
              <div className="flex flex-wrap gap-4 pt-2">
                <Link
                  className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#15518c] px-7 text-sm font-semibold uppercase tracking-[0.08em] text-white transition hover:bg-[#0f4f8b]"
                  href="/contact"
                >
                  Book Now
                </Link>
                <Link
                  className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#1d2d44]/15 bg-white px-7 text-sm font-semibold uppercase tracking-[0.08em] text-[#1d2d44] transition hover:bg-[#f7fbfb]"
                  href="/services"
                >
                  Explore Services
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="overflow-hidden border border-[#d7dfde] bg-white/78 p-8 shadow-[0_18px_55px_rgba(40,50,64,0.07)] backdrop-blur sm:p-10">
          <div className="mx-auto max-w-6xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#ff6c45]">
              Welcome To TentWala
            </p>
            <h2 className="mt-3 font-serif text-4xl text-[#1d2d44] sm:text-5xl lg:text-6xl">
              Crafting Your Perfect Celebration
            </h2>
            <p className="mx-auto mt-8 max-w-6xl text-base leading-9 text-zinc-700 sm:text-lg">
              TentWala is a trusted event planning and execution partner focused
              on weddings, family celebrations, and premium hosted experiences.
              We bring together venue support, decor styling, catering
              coordination, photography, and guest-focused service in one smooth
              planning journey.
            </p>
            <p className="mx-auto mt-6 max-w-5xl text-base leading-9 text-zinc-700 sm:text-lg">
              With a practical booking flow and carefully organized service
              categories, we help clients move from inspiration to quotation
              with clarity. Our goal is simple: make every celebration feel
              polished, memorable, and beautifully managed from start to finish.
            </p>
          </div>

          <div className="mt-14 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#ff6c45]">
              We Do Everything
            </p>
            <h3 className="mt-3 font-serif text-4xl text-[#1d2d44] sm:text-5xl">
              Our Services
            </h3>
          </div>

          <HomeCategoryPreview />

          {/* <div className="mt-8 flex justify-center">
            <Link
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#15518c] px-7 text-sm font-semibold uppercase tracking-[0.08em] text-white transition hover:bg-[#0f4f8b]"
              href="/services"
            >
              View All Services
            </Link>
          </div> */}
        </section>

        {/* <Link
          className="mx-auto flex h-12 w-44 items-center justify-center rounded-full bg-[#15518c] text-xs font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-[#0f4f8b]"
          href="/contact"
        >
          Book Now
        </Link> */}

        <section className="rounded-[2rem] border border-[#d7dfde] bg-white/82 p-6 shadow-[0_18px_55px_rgba(40,50,64,0.07)] backdrop-blur sm:p-8">
          <div className="mb-6 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#56b7c4]">
              Featured Products
            </p>
            <h2 className="font-serif text-3xl text-[#1d2d44] sm:text-4xl">
              Users can browse products directly from the homepage
            </h2>
          </div>

          <HomeProducts />
        </section>
      </div>
    </main>
  );
}
