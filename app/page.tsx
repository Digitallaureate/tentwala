import Link from "next/link";
import { FloatingQuotationChat } from "@/components/floating-quotation-chat";
import { HomeCategoryPreview } from "@/components/home-category-preview";
import { HomeProducts } from "@/components/home-products";
import { SiteHeader } from "@/components/site-header";
import { FirestoreDemo } from "@/components/firestore-demo";

export default function Home() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(232,241,244,0.95)_0%,_rgba(232,241,244,0.86)_18%,_rgba(248,249,247,0.97)_42%,_rgba(253,248,242,0.98)_68%,_rgba(240,230,220,0.94)_100%)] px-4 pb-6 pt-36 text-zinc-950 sm:px-6 sm:pb-6 sm:pt-40 lg:px-8 lg:pt-44">
      <div className="mx-auto flex w-full max-w-none flex-col gap-6">
        <SiteHeader active="home" />

        <section className="relative overflow-hidden rounded-[2.4rem] border border-white/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.92),rgba(250,247,243,0.86))] px-6 py-7 shadow-[0_24px_80px_rgba(37,48,63,0.10)] backdrop-blur sm:px-8 sm:py-8 lg:px-10 lg:py-10">
          <div className="pointer-events-none absolute inset-y-10 left-[38%] hidden w-px bg-[linear-gradient(to_bottom,rgba(30,41,59,0),rgba(30,41,59,0.14),rgba(30,41,59,0))] lg:block" />
          <div className="pointer-events-none absolute -right-16 top-10 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(198,168,116,0.18)_0%,rgba(198,168,116,0)_72%)]" />
          <div className="pointer-events-none absolute bottom-0 left-0 h-48 w-48 rounded-full bg-[radial-gradient(circle,rgba(86,183,196,0.14)_0%,rgba(86,183,196,0)_72%)]" />

          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.18fr)_minmax(320px,0.82fr)] lg:items-center">
            <div className="space-y-8">
              <div className="space-y-5">
                <div className="inline-flex items-center gap-3 rounded-full border border-[#1d2d44]/10 bg-white/70 px-4 py-2 shadow-[0_10px_30px_rgba(29,45,68,0.05)]">
                  <span className="h-2 w-2 rounded-full bg-[#c6a874]" />
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.32em] text-[#4faebc]">
                    Wedding and Event Planning
                  </p>
                </div>

                <h1 className="max-w-4xl font-serif text-[3.3rem] leading-[0.94] text-[#1c2b41] sm:text-[4.2rem] lg:text-[5.35rem]">
                  Premium celebrations
                  <span className="block text-[#2d425d]">planned with style, care,</span>
                  <span className="block text-[#2d425d]">and a graceful booking journey.</span>
                </h1>

                <p className="max-w-2xl text-base leading-8 text-zinc-700 sm:text-lg">
                  TentWala brings venues, decor, catering, and event execution
                  together in one polished experience so clients can explore,
                  compare, and book with complete clarity.
                </p>
              </div>

              <div className="flex flex-wrap gap-4">
                <Link
                  className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#173f73] px-7 text-sm font-semibold uppercase tracking-[0.12em] text-white shadow-[0_16px_32px_rgba(23,63,115,0.24)] transition hover:-translate-y-0.5 hover:bg-[#123965]"
                  href="/contact"
                >
                  Book Now
                </Link>
                <Link
                  className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#1d2d44]/12 bg-white/82 px-7 text-sm font-semibold uppercase tracking-[0.12em] text-[#1d2d44] transition hover:border-[#1d2d44]/20 hover:bg-white"
                  href="/services"
                >
                  Explore Services
                </Link>
              </div>

              <div className="grid gap-4 pt-1 sm:grid-cols-3">
                {[
                  { value: "Tailored", label: "venue and decor curation" },
                  { value: "Seamless", label: "quotation to execution flow" },
                  { value: "Refined", label: "guest-first celebration details" },
                ].map((item) => (
                  <div
                    key={item.value}
                    className="rounded-[1.5rem] border border-white/80 bg-white/58 px-5 py-4 shadow-[0_14px_34px_rgba(29,45,68,0.06)]"
                  >
                    <p className="font-serif text-2xl text-[#1d2d44]">
                      {item.value}
                    </p>
                    <p className="mt-1 text-sm uppercase tracking-[0.18em] text-zinc-500">
                      {item.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="rounded-[2rem] border border-[#1d2d44]/8 bg-[linear-gradient(160deg,rgba(255,255,255,0.84),rgba(245,239,232,0.72))] p-5 shadow-[0_24px_55px_rgba(33,42,58,0.08)] sm:p-6">
                <div className="rounded-[1.7rem] border border-white/80 bg-[#f7f3ed]/88 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#4faebc]">
                        Signature Approach
                      </p>
                      <h2 className="mt-3 font-serif text-3xl leading-tight text-[#1d2d44]">
                        A calmer, more elegant planning experience.
                      </h2>
                    </div>
                    <div className="hidden h-14 w-14 rounded-full border border-[#c6a874]/35 bg-white/70 text-[#b18d54] shadow-[0_10px_25px_rgba(177,141,84,0.16)] sm:flex sm:items-center sm:justify-center sm:text-2xl">
                      T
                    </div>
                  </div>

                  <div className="mt-6 space-y-4">
                    {[
                      "Discover curated services without jumping between vendors.",
                      "Shortlist products, venues, and experiences in one place.",
                      "Request quotations with confidence and a clear next step.",
                    ].map((step, index) => (
                      <div
                        key={step}
                        className="flex gap-4 rounded-[1.25rem] border border-white/80 bg-white/72 px-4 py-4"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#173f73] font-semibold text-white">
                          0{index + 1}
                        </div>
                        <p className="text-sm leading-7 text-zinc-700 sm:text-[0.97rem]">
                          {step}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-[1.35rem] border border-[#1d2d44]/8 bg-white/75 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#b18d54]">
                        Premium feel
                      </p>
                      <p className="mt-3 font-serif text-2xl text-[#1d2d44]">
                        Soft luxury
                      </p>
                      <p className="mt-2 text-sm leading-7 text-zinc-600">
                        Clean spacing, warmer tones, and quieter details create
                        a more expensive first impression.
                      </p>
                    </div>
                    <div className="rounded-[1.35rem] border border-[#1d2d44]/8 bg-[#173f73] p-4 text-white">
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/70">
                        Client journey
                      </p>
                      <p className="mt-3 font-serif text-2xl text-white">
                        Thoughtfully guided
                      </p>
                      <p className="mt-2 text-sm leading-7 text-white/78">
                        The section now balances emotion, trust, and booking
                        intent instead of leaving the right side empty.
                      </p>
                    </div>
                  </div>
                </div>
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
          {/* <FirestoreDemo/> */}
        </section>
      </div>
      <FloatingQuotationChat />
    </main>
  );
}
