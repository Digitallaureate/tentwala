import { SectionHeading } from "@/components/home/section-heading";

// Icons are emoji placeholders; swap for the exported Figma icons when available.
const benefits = [
  {
    icon: "💌",
    title: "Digital Invitation",
    description:
      "Beautiful, personalised e-invites sent directly to your guests — no printing, no hassle.",
  },
  {
    icon: "🚗",
    title: "Car Booking",
    description:
      "Guests can book a cab to and from your venue through a dedicated event link.",
  },
  {
    icon: "🧥",
    title: "Outfit Assistance",
    description:
      "Curated outfit suggestions and styling guidance for guests attending your event.",
  },
  {
    icon: "🖼️",
    title: "Event Photos",
    description:
      "Guests receive a private gallery link to download their photos from the event.",
  },
];

export function BookingBenefits() {
  return (
    <section className="bg-[#f0ebe3] px-5 py-12 sm:px-8 sm:py-16 lg:px-[120px] lg:pb-[59px] lg:pt-[45px]">
      <SectionHeading
        eyebrow="Exclusive with every booking"
        title="More Than just Event Planning"
      />

      <div className="mt-10 grid grid-cols-2 gap-4 lg:mt-[69px] lg:grid-cols-4 lg:gap-6">
        {benefits.map((benefit) => (
          // Sizes are Figma values (403px card) scaled by card width, e.g. 38px = 9.43cqw.
          <div key={benefit.title} className="[container-type:inline-size]">
            <div className="flex h-full flex-col items-center rounded-[20px] border-2 border-[var(--color-gold)] bg-[var(--color-bg)] px-[3.7cqw] pb-[7.4cqw] pt-[12.2cqw] text-center">
            <span
              aria-hidden="true"
              className="text-[clamp(28px,13.15cqw,53px)] leading-none"
            >
              {benefit.icon}
            </span>
            <h3 className="mt-[0.5cqw] font-serif text-[clamp(16px,9.43cqw,38px)] leading-[1.58] text-black">
              {benefit.title}
            </h3>
            <p className="mt-[2.2cqw] text-[clamp(11px,5.96cqw,24px)] leading-[1.04] text-[#a7a3a0]">
              {benefit.description}
            </p>
            </div>
          </div>
        ))}
      </div>

      <p className="mx-auto mt-8 max-w-[784px] text-center text-sm leading-6 text-[#a7a3a0] lg:mt-[46px] lg:text-[24px] lg:leading-[30px]">
        <span className="block">
          Book your event with Tentwala and give your guests a seamless digital
          experience.
        </span>
        <span className="block">
          Exclusive digital benefits with every Tentwala booking.
        </span>
      </p>
    </section>
  );
}
