import { HomeCategories } from "@/components/home-categories";
import { SiteHeader } from "@/components/site-header";

export default function ServicesPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(223,242,245,0.95)_0%,_rgba(223,242,245,0.82)_18%,_rgba(248,251,248,0.96)_42%,_rgba(255,250,245,0.98)_68%,_rgba(245,236,226,0.92)_100%)] px-4 pb-6 pt-36 text-zinc-950 sm:px-6 sm:pb-6 sm:pt-40 lg:px-8 lg:pt-44">
      <div className="mx-auto flex w-full max-w-none flex-col gap-6">
        <SiteHeader active="services" />

        <section className="rounded-[2rem] border border-[#d7dfde] bg-white/82 p-8 shadow-[0_18px_55px_rgba(40,50,64,0.07)] backdrop-blur sm:p-10">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#56b7c4]">
              What We Do
            </p>
            <h1 className="font-serif text-4xl text-[#1d2d44] sm:text-5xl">
              Full-service event production
            </h1>
            <p className="max-w-3xl text-base leading-8 text-zinc-700 sm:text-lg">
              This is the right place for the large premium category storytelling
              layout. Users can understand each service deeply before moving to
              booking or product selection.
            </p>
          </div>
        </section>

        <HomeCategories />
      </div>
    </main>
  );
}
