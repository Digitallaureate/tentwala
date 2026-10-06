import { FloatingQuotationChat } from "@/components/floating-quotation-chat";
import { BookingBenefits } from "@/components/home/booking-benefits";
import { CtaSection } from "@/components/home/cta-section";
import { EventGallery } from "@/components/home/event-gallery";
import { HeroSection } from "@/components/home/hero-section";
import { HowItWorks } from "@/components/home/how-it-works";
import { SectionHeading } from "@/components/home/section-heading";
import { HomeCategoryPreview } from "@/components/home-category-preview";
import { HomeProducts } from "@/components/home-products";

export default function Home() {
  return (
    <main className="min-h-screen bg-[var(--color-bg)] text-black">

      <HeroSection />

      <div className="flex w-full flex-col">
        <section
          className="overflow-hidden bg-[var(--color-bg)] px-5 py-16 sm:px-8 sm:py-20 lg:px-[120px]"
        >
          <SectionHeading eyebrow="Browse By Category" title="Find Your Service" />

          <HomeCategoryPreview />
        </section>

        <BookingBenefits />

        <section className="bg-[var(--color-bg)] px-5 py-16 sm:px-8 sm:py-20 lg:px-[120px]">
          <div className="mb-10 lg:mb-[72px]">
            <SectionHeading eyebrow="Popular Services" title="Featured Services" />
          </div>

          <HomeProducts />
        </section>

        <HowItWorks />

        <EventGallery />

        <CtaSection />
      </div>
      <FloatingQuotationChat />
    </main>
  );
}
