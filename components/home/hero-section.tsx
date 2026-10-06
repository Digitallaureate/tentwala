import Link from "next/link";

const heroImage =
  "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=2400&q=85";

export function HeroSection() {
  return (
    <section className="relative h-[450px] overflow-hidden bg-black text-white lg:h-[990px]">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroImage})` }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(90deg, rgba(66, 48, 16, 0.78) 0%, rgba(151, 135, 106, 0.5) 50%, rgba(102, 102, 102, 0) 100%)",
        }}
      />

      <div className="relative mx-auto flex h-full w-full max-w-[87rem] items-center px-5 pb-10 pt-24 sm:px-8 sm:pt-32 lg:px-20">
        <div className="max-w-[47rem]">
          <p className="text-lg font-medium text-white sm:text-xl">
            India&apos;s event planning platform
          </p>

          <h1 className="mt-7 font-serif text-[2.85rem] leading-[1.02] text-white sm:text-[4.1rem] lg:text-[5rem]">
            Your{" "}
            <span className="italic text-[var(--color-gold)]">
              Celebrations
            </span>{" "}
            planned with{" "}
            <span className="italic text-[var(--color-gold)]">style</span>,{" "}
            <span className="italic text-[var(--color-gold)]">care</span>, and
            a graceful booking journey.
          </h1>

          <p className="mt-8 max-w-[42rem] text-base leading-8 text-white/92 sm:text-lg">
            TentWala brings venues, decor, catering, and event execution
            together in one polished experience so clients can explore,
            compare, and book with complete clarity.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--color-primary)] px-6 text-sm font-semibold text-white shadow-[0_18px_32px_rgba(0,0,0,0.22)] transition hover:-translate-y-0.5 hover:bg-[#9f4e2f]"
              href="/contact"
            >
              Get a Quote
            </Link>
            <Link
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/70 bg-white/10 px-6 text-sm font-semibold text-white backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/18"
              href="/services"
            >
              Explore Services
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
