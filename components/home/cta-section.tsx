import Link from "next/link";

// Background is public/planning_bg.png; the soft drape-like gradient
// underneath is only a fallback if the image fails to load.
const backgroundImage = [
  "url(/planning_bg.png)",
  "repeating-linear-gradient(90deg, #f1eee9 0px, #faf8f5 22px, #ebe7e0 46px)",
].join(", ");

export function CtaSection() {
  return (
    // Desktop sizes are Figma values (1920px frame) scaled by section width,
    // e.g. 78px heading = 4.06cqw.
    <section className="bg-[var(--color-bg)] py-20 [container-type:inline-size]">
      <div
        className="bg-cover bg-center px-5 py-14 text-center sm:px-8 lg:px-0 lg:pb-[5.99cqw] lg:pt-[5.63cqw]"
        style={{ backgroundImage }}
      >
        <p className="text-base font-medium leading-[1.4] text-[var(--color-gold)] lg:text-[clamp(20px,2.19cqw,42px)] lg:leading-[56px]">
          Let&apos;s Begin
        </p>
        <h2 className="font-serif text-[32px] leading-[1.2] text-black lg:text-[clamp(36px,4.06cqw,78px)] lg:leading-[80px]">
          Planning an event?
          <span className="block italic text-[var(--color-gold)]">
            Let&apos;s make it memorable.
          </span>
        </h2>
        <p className="mx-auto mt-4 max-w-[961px] text-sm leading-6 text-[#717171] lg:mt-[1.56cqw] lg:max-w-[50cqw] lg:text-[clamp(14px,1.875cqw,36px)] lg:leading-[40px]">
          From intimate gatherings to grand celebrations — our team is here to
          bring your vision to life.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4 lg:mt-[3.75cqw] lg:gap-[2.4cqw]">
          <Link
            className="inline-flex h-10 items-center justify-center rounded-xl bg-[var(--color-primary)] px-5 text-sm font-medium text-white transition hover:bg-[#9f4e2f] lg:h-[clamp(40px,2.5cqw,48px)] lg:px-[1.09cqw] lg:text-[clamp(14px,1.35cqw,26px)]"
            href="/contact"
          >
            Get a Quote
          </Link>
          <Link
            className="inline-flex h-10 items-center justify-center rounded-xl border border-white/70 bg-[var(--color-gold)] px-5 text-sm font-medium text-white transition hover:brightness-95 lg:h-[clamp(40px,2.5cqw,48px)] lg:px-[1.09cqw] lg:text-[clamp(14px,1.35cqw,26px)]"
            href="/services"
          >
            Explore Services
          </Link>
        </div>
      </div>
    </section>
  );
}
