import { SectionHeading } from "@/components/home/section-heading";
import type { AboutStatsSection } from "@/lib/about-content";

export function TrackRecord({ section }: { section: AboutStatsSection }) {
  return (
    <section className="bg-[#ecd9ce] px-5 py-12 sm:px-8 sm:py-16 lg:px-[120px] lg:pb-[114px] lg:pt-[52px]">
      {/* The gold rule under the heading is only in the mobile design. */}
      <SectionHeading
        eyebrow={section.eyebrow}
        ruleClassName="lg:hidden"
        title={section.title}
      />

      <div className="mx-auto mt-8 grid max-w-[1680px] grid-cols-2 gap-4 lg:mt-[46px] lg:grid-cols-4 lg:gap-6">
        {section.stats.map((stat) => (
          // Sizes are Figma values (398px card) scaled by card width,
          // e.g. 64px number = 16.08cqw.
          <div key={stat.id} className="[container-type:inline-size]">
            <div className="flex flex-col items-center justify-center rounded-[20px] border-2 border-[var(--color-primary)] px-2 py-[11.56cqw] text-center">
              <p className="font-serif text-[clamp(26px,16.08cqw,64px)] font-bold leading-[1.1] text-[var(--color-primary)] lg:leading-[0.81]">
                {stat.value}
              </p>
              <p className="mt-1 text-[clamp(13px,8.04cqw,32px)] leading-[1.1] text-[#a7a3a0] lg:mt-[1cqw] lg:leading-[1.125]">
                {stat.label}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
