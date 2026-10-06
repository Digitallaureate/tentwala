import { OurStory } from "@/components/about/our-story";
import { TrackRecord } from "@/components/about/track-record";
import { CtaSection } from "@/components/home/cta-section";
import { HowItWorks } from "@/components/home/how-it-works";
import { getAboutContent } from "@/lib/about-content";

export default async function AboutPage() {
  const content = await getAboutContent();

  return (
    <main className="min-h-screen bg-[var(--color-bg)] pb-20 pt-28 text-black lg:pt-44">
      <OurStory story={content.story} />
      <TrackRecord section={content.stats_section} />
      <div aria-hidden="true" className="h-20" />
      <HowItWorks />

      <CtaSection />
    </main>
  );
}
