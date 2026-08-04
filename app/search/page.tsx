import { ProductSearchResults } from "@/components/product-search-results";
import { SearchBar } from "@/components/search-bar";
import { SiteHeader } from "@/components/site-header";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const queryText = Array.isArray(params.q) ? params.q[0] ?? "" : params.q ?? "";

  return (
    <main className="min-h-screen bg-[#f5f5f4] px-4 pb-6 pt-36 text-zinc-950 sm:px-6 sm:pb-6 sm:pt-40 lg:px-8 lg:pt-44">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <SiteHeader />
        <header className="rounded-[2rem] border-2 border-zinc-300 bg-white p-5 sm:p-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">
                Global Product Search
              </p>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Search products across TentWala
              </h1>
            </div>
            <SearchBar initialQuery={queryText} key={queryText} />
          </div>
        </header>

        <section className="rounded-[2rem] border-2 border-zinc-300 bg-white p-6 sm:p-8">
          <ProductSearchResults queryText={queryText} />
        </section>
      </div>
    </main>
  );
}
