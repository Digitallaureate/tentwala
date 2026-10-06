import { SectionHeading } from "@/components/home/section-heading";

const steps = [
  {
    number: "01",
    title: "Discover",
    description:
      "Browse our curated services across decoration, catering, venues and more.",
  },
  {
    number: "02",
    title: "Choose",
    description:
      "Compare service packages, view photos and read real client reviews.",
  },
  {
    number: "03",
    title: "Request Quote",
    description:
      "Fill a simple form with your event details -- no account needed.",
  },
  {
    number: "04",
    title: "We Connect",
    description:
      "Our team calls you within 24 hours to discuss and finalise.",
  },
];

export function HowItWorks() {
  return (
    <section className="bg-[#f0ebe3] px-5 py-20 sm:px-8 lg:px-[120px]">
      <SectionHeading eyebrow="Simple Process" title="How TentWala Works" />

      <div className="mt-10 grid grid-cols-1 gap-16 lg:mt-[164px] lg:grid-cols-4 lg:gap-0">
        {steps.map((step, index) => (
          // Desktop sizes are Figma values (420px column) scaled by column width,
          // e.g. 72px number = 17.14cqw. Connectors sit on the column boundaries
          // on desktop and run vertically between steps on mobile.
          <div
            key={step.number}
            className="relative text-center [container-type:inline-size]"
          >
            <div className="relative lg:h-[9.52cqw]">
              <p className="font-serif text-[32px] leading-[40px] text-[var(--color-gold)] lg:text-[clamp(36px,17.14cqw,72px)]">
                {step.number}
              </p>
              {index < steps.length - 1 ? (
                <span
                  aria-hidden="true"
                  className="absolute left-full top-1/2 hidden h-[3px] w-[47.6cqw] -translate-x-1/2 -translate-y-1/2 bg-[var(--color-bg)] lg:block"
                />
              ) : null}
            </div>

            <h3 className="mt-3 font-serif text-[22px] leading-[40px] text-black lg:mt-[11.7cqw] lg:text-[clamp(18px,10.5cqw,44px)]">
              {step.title}
            </h3>
            <p className="mx-auto mt-1 max-w-[371px] text-sm leading-7 text-[#908b87] lg:mt-[1.4cqw] lg:max-w-[88cqw] lg:text-[clamp(12px,5.71cqw,24px)] lg:leading-[1.67]">
              {step.description}
            </p>
            {index < steps.length - 1 ? (
              <span
                aria-hidden="true"
                className="absolute left-1/2 top-full mt-3 h-10 w-[2px] -translate-x-1/2 bg-[var(--color-bg)] lg:hidden"
              />
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}
