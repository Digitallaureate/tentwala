import { CtaSection } from "@/components/home/cta-section";
import { ServicesBrowser } from "@/components/services-browser";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { q, category } = await searchParams;
  const queryText = typeof q === "string" ? q : "";
  const initialCategorySlug = typeof category === "string" ? category : "";

  return (
    <main className="min-h-screen bg-[var(--color-bg)] pt-28 text-black lg:pt-36">
      <div className="px-5 sm:px-8 lg:px-[120px]">
        <div className="mx-auto w-full max-w-[1680px]">
          <p className="text-base leading-[1.4] text-[var(--color-gold)] lg:text-[38px] lg:leading-[40px]">
            Discover
          </p>
          <h1 className="font-serif text-[36px] leading-[1.2] text-black sm:text-5xl lg:text-[64px] lg:leading-[80px]">
            Search Services
          </h1>
          <div className="h-[2px] w-[110px] bg-[var(--color-gold)] lg:w-[150px]" />
          <p className="mt-3 max-w-[870px] text-[15px] leading-[1.45] text-[#717171] sm:text-lg lg:mt-4 lg:text-[28px]">
            Browse curated event services. Find exactly what you need and
            request a quote instantly.
          </p>

          <div className="mt-8 lg:mt-12">
            {/* key remounts with the new text when the header search is used */}
            <ServicesBrowser
              initialCategorySlug={initialCategorySlug}
              initialQuery={queryText}
              key={queryText}
              mode="search"
            />
          </div>
        </div>
      </div>

      <div className="mt-16 lg:mt-24">
        <CtaSection />
      </div>
    </main>
  );
}
