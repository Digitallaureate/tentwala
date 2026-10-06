import { CategoryDetail } from "@/components/category-detail";

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <main className="min-h-screen bg-[var(--color-bg)] px-5 pb-20 pt-28 text-black sm:px-8 lg:px-[120px] lg:pt-36">
      <CategoryDetail slug={slug} />
    </main>
  );
}
