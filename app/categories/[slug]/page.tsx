import { CategoryDetail } from "@/components/category-detail";

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <main className="min-h-screen bg-[#f5f5f4] px-4 py-6 text-zinc-950 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-6xl">
        <CategoryDetail slug={slug} />
      </div>
    </main>
  );
}
