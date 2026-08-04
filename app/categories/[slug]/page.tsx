import { CategoryDetail } from "@/components/category-detail";
import { SiteHeader } from "@/components/site-header";

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <main className="min-h-screen bg-[#f5f5f4] px-4 pb-6 pt-36 text-zinc-950 sm:px-6 sm:pb-6 sm:pt-40 lg:px-8 lg:pt-44">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <SiteHeader />
        <CategoryDetail slug={slug} />
      </div>
    </main>
  );
}
