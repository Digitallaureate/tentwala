import { ProductDetail } from "@/components/product-detail";

export default async function ProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { slug } = await params;
  const { from } = await searchParams;
  const fromSlug = typeof from === "string" ? from : undefined;

  return (
    <main className="min-h-screen bg-[var(--color-bg)] px-5 pb-20 pt-28 text-black sm:px-8 lg:px-[120px] lg:pt-36">
      {/* key remounts the page's data when navigating between products */}
      <ProductDetail key={`${slug}:${fromSlug ?? ""}`} fromSlug={fromSlug} slug={slug} />
    </main>
  );
}
