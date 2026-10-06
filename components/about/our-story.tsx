import Image from "next/image";
import type { AboutStory } from "@/lib/about-content";

export function OurStory({ story }: { story: AboutStory }) {
  return (
    <section className="px-5 py-10 sm:px-8 lg:px-[120px] lg:pb-[107px] lg:pt-0">
      {/*
        Desktop sizes are Figma values (1920px frame, 1680px content) scaled by the
        content width, e.g. 72px heading = 4.286cqw, 524px photo = 31.19cqw.
      */}
      <div className="mx-auto grid max-w-[1680px] gap-8 [container-type:inline-size] lg:grid-cols-[1fr_31.19cqw] lg:gap-x-[6cqw] lg:gap-y-0">
        <div>
          <p className="text-base leading-[1.4] text-[var(--color-gold)] lg:text-[clamp(20px,2.262cqw,38px)] lg:leading-[40px]">
            {story.eyebrow}
          </p>
          <h1 className="font-serif text-[36px] leading-[1.15] text-black sm:text-5xl lg:text-[clamp(36px,4.286cqw,72px)] lg:leading-[80px]">
            {story.heading}
            <span className="block italic text-[var(--color-gold)]">
              {story.highlighted_heading}
            </span>
          </h1>
          <div className="mt-1 h-[2px] w-[110px] bg-[var(--color-gold)] lg:w-[150px]" />
        </div>

        <div className="relative aspect-[3/2] w-full overflow-hidden rounded-[20px] lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:mt-[2.381cqw] lg:aspect-square">
          <Image
            alt={story.image_alt}
            className="object-cover"
            fill
            sizes="(min-width: 1024px) 31vw, 100vw"
            src={story.image_url}
          />
        </div>

        <div className="max-w-[1028px] space-y-5 text-[#717171] lg:mt-[2.738cqw] lg:max-w-[61.19cqw] lg:space-y-[2.02cqw]">
          {story.paragraphs.map((paragraph, index) => (
            <p
              key={index}
              className="text-base leading-7 lg:text-[clamp(14px,1.786cqw,30px)] lg:leading-[1.133]"
            >
              {paragraph}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}
